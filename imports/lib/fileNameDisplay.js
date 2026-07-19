'use strict';

// Safe filename display for the Admin Panel → Problems → Files report.
// Isomorphic (server builds the invisible-char query, client detects + decodes).
//
// - decodeFileNameSafe: percent-encoded names (e.g. "%D0%93%D1%80" -> "Гр") are
//   URL-decoded when they look encoded AND decode cleanly; otherwise returned
//   unchanged. Filenames are ALWAYS shown as plain text by the caller (Blaze
//   `{{ }}` HTML-escapes; never rendered as markdown/HTML).
// - hasInvisibleChars: true when the (decoded) name contains a genuinely
//   invisible / format / control character often used to spoof filenames — the
//   report shows those names in red. Ordinary spaces and CJK/Hangul text are NOT
//   flagged.

// C0/C1 controls, NBSP, soft hyphen, Arabic letter mark, Mongolian vowel
// separator, zero-width + bidi controls, line/paragraph separators, word-joiner
// group, BOM, and interlinear annotation marks. Deliberately EXCLUDES the normal
// space (0x20) and the ideographic space (U+3000) so legitimate names are safe.
const INVISIBLE_CHARS_SOURCE =
  '[\\u0000-\\u001F\\u007F-\\u009F\\u00A0\\u00AD\\u061C\\u180E' +
  '\\u200B-\\u200F\\u2028\\u2029\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F' +
  '\\uFEFF\\uFFF9-\\uFFFB]';

const INVISIBLE_CHARS_REGEX = new RegExp(INVISIBLE_CHARS_SOURCE);

function hasInvisibleChars(s) {
  return typeof s === 'string' && INVISIBLE_CHARS_REGEX.test(s);
}

function decodeFileNameSafe(name) {
  if (typeof name !== 'string' || name.indexOf('%') === -1) return name;
  if (!/%[0-9A-Fa-f]{2}/.test(name)) return name;
  try {
    return decodeURIComponent(name);
  } catch (e) {
    // Malformed percent-encoding — leave the original untouched.
    return name;
  }
}

// Human-readable Unicode names for the invisible characters we flag. Anything not
// listed (rare C0/C1 controls) falls back to just its "U+XXXX" code point.
const INVISIBLE_CHAR_NAMES = {
  0x00: 'NULL', 0x09: 'TAB', 0x0a: 'LINE FEED', 0x0b: 'VERTICAL TAB',
  0x0c: 'FORM FEED', 0x0d: 'CARRIAGE RETURN', 0x1b: 'ESCAPE', 0x7f: 'DELETE',
  0xa0: 'NO-BREAK SPACE', 0xad: 'SOFT HYPHEN', 0x061c: 'ARABIC LETTER MARK',
  0x180e: 'MONGOLIAN VOWEL SEPARATOR',
  0x200b: 'ZERO WIDTH SPACE', 0x200c: 'ZERO WIDTH NON-JOINER',
  0x200d: 'ZERO WIDTH JOINER', 0x200e: 'LEFT-TO-RIGHT MARK',
  0x200f: 'RIGHT-TO-LEFT MARK', 0x2028: 'LINE SEPARATOR',
  0x2029: 'PARAGRAPH SEPARATOR', 0x202a: 'LEFT-TO-RIGHT EMBEDDING',
  0x202b: 'RIGHT-TO-LEFT EMBEDDING', 0x202c: 'POP DIRECTIONAL FORMATTING',
  0x202d: 'LEFT-TO-RIGHT OVERRIDE', 0x202e: 'RIGHT-TO-LEFT OVERRIDE',
  0x2060: 'WORD JOINER', 0x2061: 'FUNCTION APPLICATION',
  0x2062: 'INVISIBLE TIMES', 0x2063: 'INVISIBLE SEPARATOR',
  0x2064: 'INVISIBLE PLUS', 0x2066: 'LEFT-TO-RIGHT ISOLATE',
  0x2067: 'RIGHT-TO-LEFT ISOLATE', 0x2068: 'FIRST STRONG ISOLATE',
  0x2069: 'POP DIRECTIONAL ISOLATE', 0xfeff: 'ZERO WIDTH NO-BREAK SPACE (BOM)',
  0xfff9: 'INTERLINEAR ANNOTATION ANCHOR',
  0xfffa: 'INTERLINEAR ANNOTATION SEPARATOR',
  0xfffb: 'INTERLINEAR ANNOTATION TERMINATOR',
};

// Describe one invisible code point, e.g. "U+200B ZERO WIDTH SPACE".
function describeInvisibleChar(cp) {
  const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
  const name = INVISIBLE_CHAR_NAMES[cp];
  return name ? hex + ' ' + name : hex;
}

// Split a (decoded) filename into display segments: runs of visible text, and one
// segment per invisible character carrying its bracketed description. The caller
// renders visible segments normally and invisible ones in red (as plain text —
// nothing is ever rendered as HTML/markdown).
function fileNameSegments(name) {
  const decoded = decodeFileNameSafe(name);
  const segments = [];
  let buf = '';
  for (const ch of String(decoded)) {
    if (INVISIBLE_CHARS_REGEX.test(ch)) {
      if (buf) { segments.push({ invisible: false, text: buf }); buf = ''; }
      segments.push({ invisible: true, text: '[' + describeInvisibleChar(ch.codePointAt(0)) + ']' });
    } else {
      buf += ch;
    }
  }
  if (buf) segments.push({ invisible: false, text: buf });
  return segments;
}

// Plain-text display name (no colouring): the decoded name with each invisible
// character replaced by its bracketed "[U+XXXX NAME]". Suitable for a title=""
// attribute or JS-set text where per-character colouring is not possible.
function fileNamePlain(name) {
  return fileNameSegments(name).map(seg => seg.text).join('');
}

// The name to use when DOWNLOADING a file: URL-decoded and with every invisible
// character REMOVED, so the saved file has a clean, unambiguous name. Never empty.
function sanitizeDownloadFileName(name) {
  const decoded = decodeFileNameSafe(name);
  if (typeof decoded !== 'string') return 'download';
  const cleaned = decoded.replace(new RegExp(INVISIBLE_CHARS_SOURCE, 'g'), '').trim();
  return cleaned || 'download';
}

module.exports = {
  INVISIBLE_CHARS_SOURCE,
  INVISIBLE_CHARS_REGEX,
  INVISIBLE_CHAR_NAMES,
  hasInvisibleChars,
  decodeFileNameSafe,
  describeInvisibleChar,
  fileNameSegments,
  fileNamePlain,
  sanitizeDownloadFileName,
};
