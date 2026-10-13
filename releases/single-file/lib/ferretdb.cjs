'use strict';

// FerretDB is the one file a single-file WeKan has to put on disk: it is a
// program of its own, and an operating system starts a program only from a
// real file. It is copied ONCE to wekan-files/bin/ferretdb-<sha256 prefix>,
// checked against the checksum recorded when the executable was built
// (single-file.json), and reused until a different version needs a different
// file. An older copy is removed once a newer one is in place.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function sha256File(file, fsImpl = fs) {
  return crypto.createHash('sha256').update(fsImpl.readFileSync(file)).digest('hex');
}

function ferretdbFileName(manifest, platform = process.platform) {
  const exe = platform === 'win32' ? '.exe' : '';
  return `ferretdb-${manifest.ferretdb.sha256.slice(0, 16)}${exe}`;
}

/**
 * @return {string} the real path of a verified FerretDB
 */
function ensureFerretdb({ appRoot, manifest, binDir, fsImpl = fs, platform = process.platform }) {
  const name = ferretdbFileName(manifest, platform);
  const target = path.join(binDir, name);
  fsImpl.mkdirSync(binDir, { recursive: true });
  const verified = file => {
    try {
      return sha256File(file, fsImpl) === manifest.ferretdb.sha256;
    } catch (e) {
      return false;
    }
  };
  if (!verified(target)) {
    const source = path.join(appRoot, manifest.ferretdb.path);
    const partial = `${target}.partial-${process.pid}`;
    fsImpl.writeFileSync(partial, fsImpl.readFileSync(source), { mode: 0o755 });
    if (!verified(partial)) {
      fsImpl.rmSync(partial, { force: true });
      throw new Error(`The FerretDB inside this executable does not match its checksum; the download may be damaged.`);
    }
    fsImpl.renameSync(partial, target);
  }
  if (platform !== 'win32') fsImpl.chmodSync(target, 0o755);
  for (const other of fsImpl.readdirSync(binDir)) {
    if (other !== name && /^ferretdb-[0-9a-f]{16}(\.exe)?(\.partial-\d+)?$/.test(other)) {
      try {
        fsImpl.rmSync(path.join(binDir, other), { force: true });
      } catch (e) {
        // in use by a FerretDB still running (Windows): removed next time
      }
    }
  }
  return target;
}

function ferretdbArgs(dbDir, listenAddr) {
  const url = `file:${dbDir.replace(/\\/g, '/')}/`;
  return ['--handler=sqlite', `--sqlite-url=${url}`, `--listen-addr=${listenAddr}`, '--telemetry=disable', '--log-level=error'];
}

function ferretdbVersion(binary) {
  try {
    const out = execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 15000, windowsHide: true });
    const version = /version:\s*(\S+)/.exec(out);
    const commit = /commit:\s*(\S+)/.exec(out);
    return { version: version ? version[1] : 'unknown', commit: commit ? commit[1] : 'unknown' };
  } catch (e) {
    return { version: 'unknown', commit: 'unknown' };
  }
}

module.exports = { sha256File, ferretdbFileName, ensureFerretdb, ferretdbArgs, ferretdbVersion };
