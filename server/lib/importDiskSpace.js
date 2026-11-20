'use strict';
// Server-only: is there room on the local disk for an import? An upload is
// written to WRITABLE_PATH a part at a time and read from there
// (server/lib/importUpload.js), so the file system holding that directory is
// what fills up: before it starts, against the size the client announced, and
// again while it is written, against what has arrived.
//
// The check keeps a reserve free (IMPORT_DISK_RESERVE_BYTES, default 512 MB,
// or IMPORT_DISK_RESERVE_MB), so an import that would fit to the last byte is
// refused rather than leaving the database and the server no room to work.
const fs = require('fs');
const path = require('path');

const DEFAULT_RESERVE = 512 * 1024 * 1024;

function reserveBytes(env = process.env) {
  const mb = Number(env.IMPORT_DISK_RESERVE_MB);
  return Number.isFinite(mb) && mb >= 0 ? Math.floor(mb * 1024 * 1024) : DEFAULT_RESERVE;
}

// Free bytes the server's user may use on the file system of `dir` (the
// nearest existing ancestor, so a directory not made yet is measured by where
// it will be). null when the platform cannot tell (no statfs).
async function freeBytes(dir) {
  let at = path.resolve(dir);
  for (;;) {
    try {
      await fs.promises.access(at);
      break;
    } catch (e) {
      const up = path.dirname(at);
      if (up === at) break;
      at = up;
    }
  }
  if (typeof fs.promises.statfs !== 'function') return null;
  const s = await fs.promises.statfs(at);
  return Number(s.bavail) * Number(s.bsize);
}

// What may still be written: free space less the reserve. Infinity when the
// platform cannot tell, so an unknown is not a refusal.
async function roomFor(dir, env = process.env) {
  const free = await freeBytes(dir);
  return free === null ? Infinity : Math.max(0, free - reserveBytes(env));
}

class ImportSpaceError extends Error {
  constructor(code, detail) {
    super(detail);
    this.code = code;
  }
}

// Refuse an import that needs `needed` more bytes than there is room for.
async function assertRoom(dir, needed, env = process.env) {
  const room = await roomFor(dir, env);
  if (Number(needed) > room) {
    throw new ImportSpaceError('import-disk-full',
      `The import needs ${Number(needed)} bytes, and ${room === Infinity ? 'an unknown amount' : room} bytes are free for it`);
  }
  return room;
}

// The largest import the administrator allows, in bytes; 0 means no limit -
// as large as the free disk space lets it finish.
function importLimitBytes(setting) {
  const mb = Number(setting && setting.importMaxMegabytes);
  return Number.isFinite(mb) && mb > 0 ? Math.floor(mb * 1024 * 1024) : 0;
}

module.exports = { freeBytes, roomFor, assertRoom, reserveBytes, importLimitBytes, ImportSpaceError, DEFAULT_RESERVE };
