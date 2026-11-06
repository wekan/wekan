'use strict';
// A lock for spec files that change the SAME site-wide setting.
//
// Playwright runs the tests of one file in order (fullyParallel: false) but
// two files at once with two workers. A site-wide setting is one document for
// every worker, so two files that write it undo each other:
// password-length-report.e2e.js and password-min-length-signup-login.e2e.js
// both set, and after every test restore, `loginOptions` (the password
// policy). In the full Chromium run they ran side by side and one test of
// each failed - the other file had switched enforcement back on, or off.
//
// holdSharedSetting(test, 'password-policy') at the top of each such file
// makes it hold the lock for all its tests: the second file waits until the
// first is finished. The lock is a directory - mkdir is atomic - under
// TMPDIR, which build.sh sets to .tools/tmp for every worker of a run, and
// holds the owning process id, so a lock left by a worker that died is taken
// over instead of blocking the run.
const fs = require('fs');
const os = require('os');
const path = require('path');

const WAIT_MS = 15 * 60 * 1000;

function lockDir(name) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`shared setting lock name must be kebab-case: ${name}`);
  return path.join(process.env.TMPDIR || os.tmpdir(), `wekan-e2e-setting-lock-${name}`);
}

function alive(pid) {
  if (!pid) return true; // being written: treat as held for now
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}

// How many holders this process has per name: one worker can run the same
// file again (--repeat-each, a retry) before the earlier run's afterAll, and
// the lock must stay taken until the LAST holder releases it.
const held = new Map();

async function acquire(name, opts = {}) {
  const count = held.get(name) || 0;
  if (count > 0) { held.set(name, count + 1); return releaser(name); }
  await take(name, opts);
  held.set(name, 1);
  return releaser(name);
}

function releaser(name) {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const count = (held.get(name) || 1) - 1;
    if (count > 0) { held.set(name, count); return; }
    held.delete(name);
    const dir = lockDir(name);
    try {
      if (Number(fs.readFileSync(path.join(dir, 'pid'), 'utf8')) === process.pid) fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) { /* already gone */ }
  };
}

async function take(name, { waitMs = WAIT_MS } = {}) {
  const dir = lockDir(name);
  const owner = path.join(dir, 'pid');
  const started = Date.now();
  for (;;) {
    try {
      fs.mkdirSync(dir);
      fs.writeFileSync(owner, String(process.pid));
      return;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let pid = 0;
      try { pid = Number(fs.readFileSync(owner, 'utf8')) || 0; } catch (_) { /* not written yet */ }
      if (pid === process.pid) return; // left by this process
      if (!alive(pid)) { fs.rmSync(dir, { recursive: true, force: true }); continue; }
      if (Date.now() - started > waitMs) throw new Error(`shared setting "${name}" still held by process ${pid}`);
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
}

function holdSharedSetting(test, name) {
  let release = null;
  test.beforeAll(async ({}, testInfo) => {
    testInfo.setTimeout(WAIT_MS + 60 * 1000);
    release = await acquire(name);
  });
  test.afterAll(() => {
    if (release) release();
    release = null;
  });
}

module.exports = { holdSharedSetting, acquire };
