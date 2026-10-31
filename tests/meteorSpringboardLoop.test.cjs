'use strict';

// Meteor with METEOR_WAREHOUSE_DIR set and no SANDBOX takes the running tool to
// be wherever the warehouse's "meteor" link points - the release Meteor was
// installed with. Once .meteor/release names another release (3.6-rc.1 with a
// 3.5.4 link), every start springboards to it, the new tool finds itself
// "wrong" again and springboards again: a build that printed uname -p /
// sysctl hw.cpu64bit_capable forever and never reached its first package.
// Meteor's own self-test sets SANDBOX=true beside the warehouse for this.
// Run: node --test tests/meteorSpringboardLoop.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const tmp = path.join(root, '.tools/tmp');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const SKIP = new Set(['node_modules', '.tools', '_build', '.build', '.git', '.meteor', 'old-CHANGELOG', 'docs']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(sh|bat|cmd|py|cjs|mjs|js)$/.test(entry.name) && !/\.test\.cjs$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('tools-env.sh and tools-env.bat set SANDBOX=true together with the warehouse', () => {
  assert.match(read('releases/tools-env.sh'),
    /METEOR_WAREHOUSE_DIR="\$WEKAN_TOOLS_DIR\/\.meteor"\n\s+SANDBOX=true\n\s+export METEOR_WAREHOUSE_DIR SANDBOX/);
  assert.match(read('releases/tools-env.bat'),
    /set "METEOR_WAREHOUSE_DIR=%WEKAN_TOOLS_DIR%\\\.meteor"\r?\n\s+set "SANDBOX=true"/);
});

test('sourced, tools-env.sh exports SANDBOX only when it exports the warehouse', () => {
  fs.mkdirSync(tmp, { recursive: true });
  const fake = fs.mkdtempSync(path.join(tmp, 'springboard-'));
  try {
    const show = () => spawnSync('bash', ['-c', '. releases/tools-env.sh; printf "%s|%s" "${METEOR_WAREHOUSE_DIR:-}" "${SANDBOX:-}"'],
      { cwd: root, encoding: 'utf8', env: { ...process.env, WEKAN_TOOLS_DIR: fake, METEOR_WAREHOUSE_DIR: '', SANDBOX: '' } }).stdout;
    // No Meteor in the tools dir: neither, so a Meteor in ~/.meteor keeps working.
    assert.equal(show(), '|');
    fs.mkdirSync(path.join(fake, '.meteor'));
    fs.writeFileSync(path.join(fake, '.meteor/meteor'), '#!/bin/sh\n', { mode: 0o755 });
    assert.equal(show(), `${path.join(fake, '.meteor')}|true`);
  } finally {
    fs.rmSync(fake, { recursive: true, force: true });
  }
});

test('negative: nothing points Meteor at a warehouse without SANDBOX beside it', () => {
  // An assignment in any shell, batch, Python or JavaScript file: X=..., set "X=...",
  // env['X'] = ..., X: value. Reading the variable is not setting it.
  const sets = /(?:^|[\s"'(])(?:export\s+)?METEOR_WAREHOUSE_DIR(?:=|['"]?\]\s*=|:\s*\S)/m;
  const offenders = [];
  let found = 0;
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    if (!sets.test(text)) continue;
    found++;
    if (!/\bSANDBOX\b\s*(?:=|['"]?\]\s*=|:\s*['"]true|=true)|"SANDBOX=true"|SANDBOX: 'true'/.test(text)) offenders.push(path.relative(root, file));
  }
  assert.ok(found >= 4, `the scan found ${found} places that set the warehouse; it is not looking`);
  assert.deepEqual(offenders, []);
});

test('the installed Meteor starts with one springboard, not an endless loop', (t) => {
  const meteor = path.join(root, '.tools/.meteor/meteor');
  const release = read('.meteor/release').trim().split('@')[1].replace(/^(\d+\.\d+)(-)/, '$1.0$2');
  const tool = path.join(root, '.tools/.meteor/packages/meteor-tool', release);
  if (process.platform === 'win32' || !fs.existsSync(meteor) || !fs.existsSync(tool)) {
    t.skip(`Meteor ${release} is not installed in .tools/.meteor`);
    return;
  }
  const r = spawnSync('bash', ['-c', '. releases/tools-env.sh; exec "$WEKAN_TOOLS_DIR/.meteor/meteor" --version'],
    { cwd: root, encoding: 'utf8', timeout: 60000, env: { ...process.env, METEOR_DEBUG_SPRINGBOARD: '1', SANDBOX: '' } });
  const springboards = (r.stdout.match(/WILL SPRINGBOARD TO/g) || []).length;
  // The warehouse link may name another release: then one springboard reaches it.
  assert.ok(springboards <= 1, `${springboards} springboards before the timeout`);
  assert.match(r.stdout, /^Meteor \d/m);
});
