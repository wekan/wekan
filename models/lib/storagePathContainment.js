// Pure, dependency-free containment checks for a file path that came out of the
// DATABASE rather than off the disk. No Meteor imports, so it is unit tested
// directly with plain Node (tests/storagePathContainment.test.cjs).
//
// GHSA-4mxf-m8pq-xc9p: the board exporter read `versions.original.path` from an
// avatar document and streamed that file into the export as base64, trusting
// whatever Mongo held. The avatar allow rule let the owner write that field, so
// the export embedded the bytes of any file the WeKan process could read.
// Blocking the write is the first half of the fix; this is the second, and it is
// the half that also holds if a path is poisoned some other way - a document
// written before the fix, a restored backup, a bad migration.
//
// The DOWNLOAD path in models/lib/fileStoreStrategy.js has always checked
// containment this way; that function now lives here, so the download and the
// export ask the same question instead of each having their own answer. Drift
// between two copies of a rule is exactly what this advisory was.

const path = require('path');

/** Resolve, and lowercase on Windows, whose paths are case-insensitive. */
function normalizeForCompare(inputPath) {
  const normalized = path.resolve(inputPath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

/**
 * True when `targetPath` is `basePath` or lies under it.
 *
 * Resolving first is the whole point: '..' segments are what a plain
 * `startsWith` gets wrong, so `/data/files/avatars/../../etc/passwd` is NOT
 * inside `/data/files/avatars`. Comparing the RELATIVE path also means
 * `/data/files/avatars-evil` is not inside `/data/files/avatars`, which a
 * `startsWith` on the raw strings would accept.
 *
 * @param {string} basePath the directory
 * @param {string} targetPath the path to test
 * @return {boolean}
 */
function isPathInsideBase(basePath, targetPath) {
  if (typeof basePath !== 'string' || !basePath) return false;
  if (typeof targetPath !== 'string' || !targetPath) return false;

  const normalizedBase = normalizeForCompare(basePath);
  const normalizedTarget = normalizeForCompare(targetPath);
  const relative = path.relative(normalizedBase, normalizedTarget);

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * The same question asked the other way round, for reading a FILE: is this
 * candidate somewhere under that root? The root ITSELF is not an answer - a
 * storage root is a directory, never the file being read - which is the one
 * difference from isPathInsideBase().
 *
 * @param {string} candidate the path to check (as stored)
 * @param {string} root the directory it must be under
 * @return {boolean}
 */
function isPathInside(candidate, root) {
  if (typeof candidate !== 'string' || !candidate) return false;
  if (typeof root !== 'string' || !root) return false;
  if (normalizeForCompare(candidate) === normalizeForCompare(root)) return false;

  return isPathInsideBase(root, candidate);
}

/**
 * Same, against several roots at once (attachments and avatars, say).
 * @param {string} candidate
 * @param {string[]} roots
 * @return {boolean}
 */
function isPathInsideAny(candidate, roots) {
  if (!Array.isArray(roots)) return false;
  return roots.some((root) => isPathInside(candidate, root));
}

module.exports = {
  normalizeForCompare,
  isPathInsideBase,
  isPathInside,
  isPathInsideAny,
};
