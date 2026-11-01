'use strict';

// Is WeKan running, where, and since when: wekan-files/run/wekan.pid, written
// by `start` and removed when it stops, plus a look at the address itself.

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function readPid(layout, fsImpl = fs) {
  try {
    const info = JSON.parse(fsImpl.readFileSync(layout.pidFile, 'utf8'));
    return Number.isInteger(info.pid) && info.pid > 0 ? info : null;
  } catch (e) {
    return null;
  }
}

function isAlive(pid, kill = process.kill.bind(process)) {
  if (!pid) return false;
  try {
    kill(pid, 0);
    return true;
  } catch (e) {
    // EPERM: it exists, it is just not ours to signal.
    return e && e.code === 'EPERM';
  }
}

/** The running WeKan's pid file, or null; a stale pid file is removed. */
function running(layout, { fsImpl = fs, kill } = {}) {
  const info = readPid(layout, fsImpl);
  if (!info) return null;
  if (isAlive(info.pid, kill)) return info;
  try {
    fsImpl.rmSync(layout.pidFile, { force: true });
  } catch (e) {
    // read-only: reported as stopped all the same
  }
  return null;
}

async function probe(url, timeoutMs = 5000) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    return res.status;
  } catch (e) {
    return 0;
  }
}

/**
 * Waits until the WeKan just started in the background (`pid`) has written
 * its pid file - it does so only after reading its settings and, the first
 * time, extracting FerretDB - so the command that started it can return with
 * WeKan really running: a `stop` right after `start --background` or `backup`
 * found no pid file yet, said "WeKan was not running" and left it running.
 * True once the file names `pid`; false if that process ended or time ran out.
 */
async function waitUntilStarted(layout, pid, { timeoutMs = 30000, stepMs = 100, kill } = {}) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const info = readPid(layout);
    if (info && info.pid === pid) return true;
    if (!isAlive(pid, kill)) return false;
    await new Promise(r => setTimeout(r, stepMs));
  }
  return false;
}

async function stop(layout, { platform = process.platform, waitMs = 30000, log = () => {} } = {}) {
  const info = running(layout);
  if (!info) return false;
  log(`Stopping WeKan (pid ${info.pid}) ...`);
  if (platform === 'win32') {
    // Windows has no SIGTERM: end the launcher and the FerretDB and server
    // it started, as one tree.
    try {
      execFileSync('taskkill', ['/PID', String(info.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    } catch (e) {
      // already gone
    }
  } else {
    try {
      process.kill(info.pid, 'SIGTERM');
    } catch (e) {
      // already gone
    }
  }
  const until = Date.now() + waitMs;
  while (Date.now() < until && isAlive(info.pid)) {
    await new Promise(r => setTimeout(r, 250));
  }
  if (isAlive(info.pid)) {
    try {
      process.kill(info.pid, 'SIGKILL');
    } catch (e) {
      // gone at the last moment
    }
  }
  try {
    fs.rmSync(layout.pidFile, { force: true });
  } catch (e) {
    // removed by the launcher itself
  }
  return true;
}

module.exports = { readPid, isAlive, running, probe, stop, waitUntilStarted };
