'use strict';

// An attachment's content, kept checkable and searchable.
//
// Every attachment gets two things, each with the time it was made:
//
//   contentHash  { algorithm: 'sha256', value, size, at } on the attachment -
//                made when it is added, or the first time it is read whole
//                when it has none yet (attachments added before this);
//   search text  plain text only - no markup, no styles, no images - in the
//                attachment text index (documentPreviews, one row an
//                attachment, `searchText` and `generatedAt`), which Search,
//                Filter and Search All Boards read.
//
// Each time an attachment is read whole, the bytes sent are hashed on the way
// out and compared with contentHash (decideHash below):
//
//   the same              nothing to do;
//   none stored yet       it is stored now;
//   different, but that   the file is an earlier version that the card history
//   hash is in the card   (undo/restore) knows - a new hash and new search text
//   history               are made from it;
//   different, unknown    nothing explains it: a warning in Admin Panel /
//                         Problems (integrity), and the stored hash is kept, so
//                         the next read warns again until someone looks.
//
// SHA-256 because it is the hash WeKan's storage integrity scan and the Gitea
// backups already use, and Node computes it at the speed of the disk; it is a
// checksum here, not a secret.
//
// Pure: no Meteor, no files. tests/attachmentContent.test.cjs.

const { attachmentKind, attachmentRichKind } = require('./attachmentKind');

const ALGORITHM = 'sha256';
// The search text is cut here, as the document index always was.
const MAX_SEARCH_TEXT = 2 * 1024 * 1024;
// A text file is read this far for its search text.
const MAX_TEXT_READ = 4 * 1024 * 1024;
const DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'pptx'];

// Where an attachment's search text comes from: 'text' (the file is text, read
// as it is), 'document' (PDF and Office, the document text extractor),
// 'preview' (Outlook .msg and OpenDocument, from the rows their slideshow
// conversion already wrote), or null - an image, a video, an archive: nothing
// to search in.
function searchTextSource(doc) {
  const kind = attachmentKind(doc);
  if (DOCUMENT_EXTENSIONS.includes(kind.extension)) return 'document';
  const rich = attachmentRichKind(doc);
  if (rich === 'outlook' || rich === 'opendocument') return 'preview';
  if (rich === 'tar') return null;
  if (rich || kind.isText || kind.isJSON) return 'text';
  if (['eml', 'xml', 'html', 'htm', 'svg', 'rtf', 'tex', 'srt', 'vtt'].includes(kind.extension)) return 'text';
  return null;
}

// The text of a text file's first bytes: UTF-8, or UTF-16 by its byte order
// mark. A file with NUL bytes in it is not text.
function decodeText(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) return new TextDecoder('utf-16le').decode(b.subarray(2));
  if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) return new TextDecoder('utf-16be').decode(b.subarray(2));
  const start = b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? 3 : 0;
  const probe = b.subarray(start, Math.min(b.length, start + 8192));
  if (probe.includes(0)) return '';
  return new TextDecoder('utf-8').decode(b.subarray(start));
}

// Text with markup removed, control characters gone and whitespace collapsed,
// for searching only.
function plainSearchText(value, { markup = false } = {}) {
  let text = String(value || '');
  if (markup) {
    // Until nothing more is removed: a single pass leaves the tag that two
    // overlapping ones join into (tests/tagStrippingFixedPoint.test.cjs).
    let before;
    do {
      before = text;
      text = text.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]*>/gi, ' ');
    } while (text !== before);
    text = text
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  }
  return text.normalize('NFKC')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, MAX_SEARCH_TEXT);
}

const MARKUP_EXTENSIONS = ['html', 'htm', 'xml', 'svg'];
function isMarkup(doc) {
  return MARKUP_EXTENSIONS.includes(attachmentKind(doc).extension);
}

// The words of one row of a slideshow conversion (server/lib/attachmentPreviewStore.js
// rows: { t: 'field'|'file'|'text'|'h'|'p'|'page'|'row'|'more', ... }).
function previewRowText(row) {
  if (!row || typeof row !== 'object') return '';
  const parts = [];
  for (const [key, value] of Object.entries(row)) {
    if (key === 't') continue;
    if (typeof value === 'string') parts.push(value);
    else if (Array.isArray(value)) parts.push(value.filter(v => typeof v === 'string').join(' '));
  }
  return parts.join(' ');
}

const finiteSize = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;

// The stored hash, if it is one this code can compare with.
function storedHash(attachment) {
  const h = attachment && attachment.contentHash;
  return h && h.algorithm === ALGORITHM && typeof h.value === 'string' && /^[0-9a-f]{64}$/.test(h.value) ? h : null;
}

// What to do after a whole read: actual = { value, size } of the bytes read;
// known = the hashes the card history has for earlier versions of this
// attachment. Returns 'same' | 'store' | 'known-version' | 'mismatch'.
function decideHash({ attachment, actual, known = [] }) {
  if (!actual || typeof actual.value !== 'string' || !/^[0-9a-f]{64}$/.test(actual.value)) return 'same';
  const stored = storedHash(attachment);
  if (!stored) return 'store';
  if (stored.value === actual.value) return 'same';
  if (known.includes(actual.value)) return 'known-version';
  return 'mismatch';
}

// A whole read: the bytes sent are the size the attachment says. A read that
// stopped early (the browser went away) is not a mismatch, it is nothing.
function wasWholeRead(attachment, actual) {
  const size = Number(attachment && attachment.size);
  return Boolean(actual) && finiteSize(actual.size) && (!finiteSize(size) || size === 0 || actual.size === size);
}

// The hashes of earlier versions of this attachment that history rows carry.
function knownHashes(rows) {
  const out = new Set();
  for (const row of rows || []) {
    for (const content of [row && row.previousContent, row && row.newContent]) {
      const value = content && (content.contentHash && content.contentHash.value || content.contentHash);
      if (typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)) out.add(value);
    }
  }
  return [...out];
}

// A search term as a regular expression's source, its special characters as
// themselves.
function escapeSearchTerm(term) {
  return String(term || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  ALGORITHM,
  MAX_SEARCH_TEXT,
  MAX_TEXT_READ,
  DOCUMENT_EXTENSIONS,
  searchTextSource,
  decodeText,
  plainSearchText,
  isMarkup,
  previewRowText,
  storedHash,
  decideHash,
  wasWholeRead,
  knownHashes,
  escapeSearchTerm,
};
