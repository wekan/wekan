// The Content-Disposition header of a served file, shared by the file routes
// (server/routes/universalFileServer.js, server/routes/legacyAttachments.js),
// which each used to define both functions.
const { sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');

/**
 * Encode a filename for the Content-Disposition header.
 * Removes invalid characters (control chars, newlines, etc.) that would break HTTP headers.
 * For non-ASCII filenames, uses RFC 5987 encoding to preserve the original filename.
 * This prevents ERR_INVALID_CHAR errors when filenames contain control characters.
 *
 * Example:
 * - ASCII filename: sanitizeFilenameForHeader('test.txt') => 'test.txt'
 * - Non-ASCII: sanitizeFilenameForHeader('現有檔案.odt') => '____.odt|RFC5987:%E7%8F%BE%E6%9C%89%E6%AA%94%E6%A1%88.odt'
 * - Control chars: sanitizeFilenameForHeader('test\nfile.txt') => 'testfile.txt'
 */
export function sanitizeFilenameForHeader(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'download';
  }

  // Decode a URL-encoded name and REMOVE all invisible/format characters (incl.
  // control chars, zero-width, bidi, BOM) so the downloaded file gets a clean,
  // unambiguous name — matching how filenames are shown in the UI.
  let sanitized = sanitizeDownloadFileName(filename);

  // If the filename is all ASCII printable characters (0x20-0x7E), use it directly
  if (/^[\x20-\x7E]*$/.test(sanitized)) {
    // Escape any quotes and backslashes in the filename
    sanitized = sanitized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return sanitized;
  }

  // For non-ASCII filenames, provide a fallback and RFC 5987 encoded version
  const fallback = sanitized.replace(/[^\x20-\x7E]/g, '_').slice(0, 100) || 'download';
  const encoded = encodeURIComponent(sanitized);

  // Return special marker format that will be handled by buildContentDispositionHeader
  // Format: "fallback|RFC5987:encoded"
  return `${fallback}|RFC5987:${encoded}`;
}

/**
 * Build a complete Content-Disposition header value with RFC 5987 support.
 * Handles the special format returned by sanitizeFilenameForHeader for non-ASCII filenames.
 */
export function buildContentDispositionHeader(disposition, sanitizedFilename) {
  if (sanitizedFilename.includes('|RFC5987:')) {
    const [fallback, encoded] = sanitizedFilename.split('|RFC5987:');
    return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
  }
  return `${disposition}; filename="${sanitizedFilename}"`;
}
