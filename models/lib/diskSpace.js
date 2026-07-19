'use strict';

// Best-effort free-disk-space probe, used before writing an uploaded file to the
// default (filesystem) storage so a large upload cannot fill the disk. When the
// platform / Node build does not expose free-space info (e.g. running inside a
// restricted sandbox, or the storage backend is remote cloud with no local disk),
// the probe returns null and the caller falls back to safe small-chunk streaming
// with immediate cleanup on any write error.

const fs = require('fs');

// Return the number of free bytes available on the filesystem that holds dirPath,
// or null when it cannot be determined. Uses fs.statfsSync when available
// (Node >= 18.15); otherwise returns null so the caller degrades gracefully.
function getFreeDiskBytes(dirPath) {
  try {
    if (typeof fs.statfsSync !== 'function') return null;
    const stats = fs.statfsSync(dirPath);
    if (!stats || typeof stats.bavail !== 'number' || typeof stats.bsize !== 'number') {
      return null;
    }
    const free = stats.bavail * stats.bsize;
    return Number.isFinite(free) && free >= 0 ? free : null;
  } catch (e) {
    // Path missing, unsupported platform, or statfs failed — unknown, not "full".
    return null;
  }
}

// True when there is enough free space for neededBytes plus a safety margin, or
// when free space is UNKNOWN (null) — in the unknown case the caller still writes,
// but must use small-chunk streaming and clean up partial output on any error.
// A false result means we positively know the disk is (nearly) full.
function hasEnoughDiskSpace(dirPath, neededBytes, marginBytes = 16 * 1024 * 1024) {
  const free = getFreeDiskBytes(dirPath);
  if (free === null) return true; // unknown -> proceed with safe streaming
  const need = Math.max(0, Number(neededBytes) || 0) + marginBytes;
  return free >= need;
}

module.exports = { getFreeDiskBytes, hasEnoughDiskSpace };
