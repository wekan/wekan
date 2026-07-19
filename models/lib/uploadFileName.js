'use strict';

// Upload-time filename hardening (server). Used by the attachment/avatar upload
// validation to (1) strip invisible characters from the stored filename, (2) give
// it a type-based name if that leaves it empty, (3) correct the extension to match
// the file's MIME type, and (4) reject filenames that look like an exploit.
//
// Pure functions (no Meteor) so they are unit-testable; wired in
// models/fileValidation.js and models/attachments.server.js / avatars.server.js.

const mime = require('mime-types');
const {
  decodeFileNameSafe,
  cleanFileName,
  hasInvisibleChars,
  normalizeConfusables,
  classifyExploitKinds,
} = require('/imports/lib/fileNameDisplay');

// Maximum number of CHARACTERS (code points, not bytes) allowed in a stored
// filename. Chosen so the name fits any operating system and filesystem WeKan
// might be stored on or restored to — including classic Amiga OS FFS, whose
// filename limit is 30 characters. This is a logical/user-facing cap; the
// on-disk "<id>-<version>-<name>" component is capped separately in bytes by
// models/lib/filenameSanitizer.js. Not as tight as DOS 8.3, but portable.
const MAX_FILENAME_CHARS = 30;

// Truncate a filename to at most maxChars code points, preserving the extension
// and never splitting a Unicode code point. Falls back to clipping the whole
// name when the extension alone would not fit.
function truncateFilenameChars(name, maxChars = MAX_FILENAME_CHARS) {
  const chars = Array.from(String(name == null ? '' : name)); // by code point
  if (chars.length <= maxChars) return chars.join('');
  const dot = String(name).lastIndexOf('.');
  const ext = dot > 0 ? String(name).slice(dot) : '';
  const extChars = Array.from(ext);
  const keepExt = ext && extChars.length < maxChars;
  if (!keepExt) {
    return chars.slice(0, maxChars).join('');
  }
  const baseChars = chars.slice(0, chars.length - extChars.length);
  const budget = maxChars - extChars.length;
  return baseChars.slice(0, budget).join('') + ext;
}

// A base display name for a file whose sanitized name became empty, by MIME group.
function baseNameForMime(mimeType) {
  const t = String(mimeType || '').toLowerCase();
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  if (/(spreadsheet|ms-excel|excel|csv)/.test(t)) return 'spreadsheet';
  if (/(word|pdf|presentation|powerpoint|opendocument|rtf|document)/.test(t)) return 'document';
  if (t.startsWith('text/')) return 'document';
  if (/(zip|tar|compressed|archive|rar|7z|gzip|bzip)/.test(t)) return 'archive';
  return 'file';
}

// The correct extension (with leading dot) for a MIME type, or '' if unknown.
function extensionForMime(mimeType) {
  const ext = mime.extension(String(mimeType || '').toLowerCase());
  return ext ? '.' + ext : '';
}

// True when the filename looks like an attempted exploit: HTML/script markup, an
// XML doctype/entity (billion-laughs), a template-injection payload, php/asp tags,
// a javascript:/data: URI, an inline event handler, a null byte, or path traversal.
function filenameLooksLikeExploit(name) {
  const n = decodeFileNameSafe(String(name == null ? '' : name));
  if (/<\s*(script|svg|iframe|object|embed|img|html|meta|link|style|foreignobject|base)\b/i.test(n)) return true;
  if (/<\?xml|<!doctype|<!entity/i.test(n)) return true;      // XML billion-laughs / doctype
  if (/javascript:|vbscript:|data:\s*text\/html/i.test(n)) return true;
  if (/\son\w+\s*=/i.test(n) || /^on\w+\s*=/i.test(n)) return true; // onerror= etc.
  if (/\{\{[\s\S]*\}\}|\$\{[\s\S]*\}|<%[\s\S]*%>/.test(n)) return true; // template injection
  if (/<\?php|<\?=/i.test(n)) return true;
  if (/\u0000/.test(n)) return true;                          // null byte
  if (/(^|[\\/])\.\.([\\/]|$)/.test(n)) return true;          // path traversal
  return false;
}

// The name to STORE at upload: URL-decoded, invisible characters removed; if empty
// a name from the MIME type; and the extension corrected to the MIME type — e.g. a
// PNG named "foo" or "foo.txt" becomes "foo.png"; ".jpg" for image/jpeg is kept.
function sanitizeUploadFileName(name, mimeType) {
  // cleanFileName: URL-decode, fold confusable homoglyphs (NFKC + typosquat
  // characters), remove invisible characters, strip any exploit markup, collapse
  // whitespace. This is the same normalization used to DISPLAY names, so the
  // stored name matches what users see.
  let n = cleanFileName(name);
  const wantExt = extensionForMime(mimeType);
  const wantMime = String(mimeType || '').toLowerCase();

  if (!n) {
    return truncateFilenameChars(baseNameForMime(mimeType) + wantExt);
  }
  if (wantExt) {
    const curMime = mime.lookup(n); // false when there is no recognized extension
    if (curMime === wantMime) {
      // extension already matches the type (handles .jpg vs .jpeg) — keep it
    } else if (curMime) {
      // recognized but WRONG extension -> replace it
      n = n.slice(0, n.lastIndexOf('.')) + wantExt;
    } else {
      // no recognized extension -> append the correct one
      n = n + wantExt;
    }
  }
  // Cap the logical length last, so the extension is preserved within the budget.
  return truncateFilenameChars(n);
}

// Append an increasing "-N" before the extension to disambiguate two DIFFERENT
// files that would otherwise share a name (e.g. during a migration where two
// stored files both sanitize to "document.pdf" but differ in size/date). index 0
// returns the name unchanged; 1 -> "document-1.pdf", 2 -> "document-2.pdf", ...
// The result is length-capped like every other stored name.
function numberedName(name, index) {
  if (!index) return truncateFilenameChars(String(name == null ? '' : name));
  const s = String(name == null ? '' : name);
  const dot = s.lastIndexOf('.');
  const ext = dot > 0 ? s.slice(dot) : '';
  const base = dot > 0 ? s.slice(0, dot) : s;
  return truncateFilenameChars(base + '-' + index + ext);
}

// Explain, in human-readable terms for the Admin Panel → Problems log, WHY a
// filename required sanitization: which reasons applied (URL-encoding, invisible
// characters, typosquatting look-alikes, a specific exploit KIND, the wrong file
// type/extension, an over-long name, or an empty name). Computed from the ORIGINAL
// name (+ the type-detected MIME and the corrected result). Returns [] when the
// name was already clean.
function sanitizationReasons(originalName, mimeType, correctedName) {
  const reasons = [];
  const raw = String(originalName == null ? '' : originalName);
  const decoded = decodeFileNameSafe(raw);
  const corrected = String(correctedName == null ? '' : correctedName);

  if (decoded !== raw) reasons.push('URL-encoded name');
  if (hasInvisibleChars(decoded)) reasons.push('invisible characters');
  if (normalizeConfusables(decoded) !== decoded) reasons.push('typosquatting (look-alike characters)');
  for (const kind of classifyExploitKinds(decoded)) reasons.push('exploit: ' + kind);

  const cleaned = cleanFileName(decoded);
  if (cleaned === '') {
    reasons.push('empty name, generated from file type');
  } else if (Array.from(cleaned).length > MAX_FILENAME_CHARS) {
    reasons.push('filename too long');
  }

  const dot = s => { const i = String(s).lastIndexOf('.'); return i > 0 ? String(s).slice(i).toLowerCase() : ''; };
  const oldExt = dot(decoded);
  const newExt = dot(corrected);
  if (oldExt !== newExt) {
    reasons.push('wrong file type (' + (oldExt || '(none)') + ' → ' + (newExt || '(none)') + ')');
  }
  return reasons;
}

module.exports = {
  MAX_FILENAME_CHARS,
  truncateFilenameChars,
  numberedName,
  sanitizationReasons,
  baseNameForMime,
  extensionForMime,
  filenameLooksLikeExploit,
  sanitizeUploadFileName,
};
