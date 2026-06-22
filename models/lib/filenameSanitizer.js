// Pure, dependency-free filename helpers (no Meteor imports) so they can be unit
// tested directly with plain Node. Used by models/lib/fileStoreStrategy.js.
//
// #6412: very long attachment filenames produced an on-disk
// "<id>-<version>-<name>" component longer than the filesystem's 255-byte limit
// and failed with ENAMETOOLONG (worse with multibyte UTF-8 like German umlauts).
const path = require('path');

/**
 * Maximum number of bytes for the sanitized filename. Most filesystems limit a
 * single path component to 255 bytes; the stored file is named
 * "<id>-<version>-<name>", so we reserve headroom for that prefix and cap the
 * name well below 255. Length is measured in UTF-8 *bytes* (not characters).
 */
const MAX_FILENAME_BYTES = 200;

/**
 * Truncate a filename to at most maxBytes UTF-8 bytes, preserving the extension
 * and never splitting a multibyte character.
 * @param {string} filename
 * @param {number} maxBytes
 * @return {string} the (possibly) shortened filename
 */
function truncateFilenameToBytes(filename, maxBytes) {
  if (Buffer.byteLength(filename, 'utf8') <= maxBytes) {
    return filename;
  }
  const ext = path.extname(filename);
  const extBytes = Buffer.byteLength(ext, 'utf8');
  // If the extension alone does not fit, ignore it and clip the whole name.
  const keepExt = extBytes < maxBytes;
  const base = keepExt ? filename.slice(0, filename.length - ext.length) : filename;
  const budget = keepExt ? maxBytes - extBytes : maxBytes;

  let out = '';
  let bytes = 0;
  for (const ch of base) { // iterates by Unicode code point
    const chBytes = Buffer.byteLength(ch, 'utf8');
    if (bytes + chBytes > budget) {
      break;
    }
    out += ch;
    bytes += chBytes;
  }

  const truncated = keepExt ? out + ext : out;
  return truncated || 'unnamed';
}

/**
 * Sanitize a filename to prevent path traversal AND cap its length so the
 * on-disk path component stays within the filesystem's per-component byte limit.
 * @param {string} filename - User-provided filename
 * @return {string} Sanitized filename safe for filesystem operations
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  // Use path.basename to strip any directory components
  let safe = path.basename(filename);

  // Remove null bytes
  safe = safe.replace(/\0/g, '');

  // Remove any remaining path traversal sequences
  let previous;
  do {
    previous = safe;
    safe = safe.replace(/\.\.[\\/\\]/g, '');
  } while (safe !== previous);
  safe = safe.replace(/^\.\.$/, '');

  // Trim whitespace
  safe = safe.trim();

  // If empty after sanitization, use default
  if (!safe || safe === '.' || safe === '..') {
    return 'unnamed';
  }

  // Limit length so the on-disk filename stays within the filesystem's
  // per-component byte limit, preventing ENAMETOOLONG on very long names (#6412).
  safe = truncateFilenameToBytes(safe, MAX_FILENAME_BYTES);

  return safe;
}

module.exports = { MAX_FILENAME_BYTES, truncateFilenameToBytes, sanitizeFilename };
