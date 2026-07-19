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

module.exports = {
  INVISIBLE_CHARS_SOURCE,
  INVISIBLE_CHARS_REGEX,
  hasInvisibleChars,
  decodeFileNameSafe,
};
