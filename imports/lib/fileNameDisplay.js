'use strict';

// Filename safety helpers, isomorphic (used by client display, server download
// headers, and server upload hardening).
//
// The general display function is cleanFileName(): every filename shown anywhere
// in WeKan is URL-decoded, has all invisible/format characters removed, and has
// any HTML/script/XML/template-injection markup stripped out — so what is shown is
// always a plain, safe, readable name. (Blaze `{{ }}` also HTML-escapes, so a name
// is never rendered as markup; this additionally removes the markup text itself.)

// C0/C1 controls, NBSP, soft hyphen, Arabic letter mark, Mongolian vowel
// separator, zero-width + bidi controls, line/paragraph separators, word-joiner
// group, BOM, and interlinear annotation marks. Excludes the normal space (0x20)
// and the ideographic space (U+3000) so legitimate names are safe.
const INVISIBLE_CHARS_SOURCE =
  '[\\u0000-\\u001F\\u007F-\\u009F\\u00A0\\u00AD\\u061C\\u180E' +
  '\\u200B-\\u200F\\u2028\\u2029\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F' +
  '\\uFEFF\\uFFF9-\\uFFFB]';

const INVISIBLE_CHARS_REGEX = new RegExp(INVISIBLE_CHARS_SOURCE);
const INVISIBLE_CHARS_GLOBAL = new RegExp(INVISIBLE_CHARS_SOURCE, 'g');

function hasInvisibleChars(s) {
  return typeof s === 'string' && INVISIBLE_CHARS_REGEX.test(s);
}

// URL-decode a percent-encoded name (e.g. "%D0%93%D1%80" -> "Гр") when it looks
// encoded AND decodes cleanly; otherwise return it unchanged.
function decodeFileNameSafe(name) {
  if (typeof name !== 'string' || name.indexOf('%') === -1) return name;
  if (!/%[0-9A-Fa-f]{2}/.test(name)) return name;
  try {
    return decodeURIComponent(name);
  } catch (e) {
    return name; // malformed percent-encoding — leave as-is
  }
}

// Remove exploit-looking markup from a filename so the shown name is plain text:
// HTML/XML tags (incl. <script>, <svg>, <!ENTITY> billion-laughs, <!DOCTYPE>),
// php/asp processing instructions, CDATA, template-injection payloads, and
// dangerous URI schemes.
function stripExploitPatterns(s) {
  return String(s == null ? '' : s)
    .replace(/<\?[\s\S]*?(\?>|$)/g, '')                 // <?php … ?> / <?xml … ?>
    .replace(/<!\[[\s\S]*?(\]>|$)/g, '')                // <![CDATA[ … ]]>
    .replace(/\{\{[\s\S]*?\}\}|\$\{[\s\S]*?\}|<%[\s\S]*?%>/g, '') // template injection
    .replace(/<[^>]*>?/g, '')                           // any HTML/XML tag (incl. unclosed)
    .replace(/(javascript|vbscript|data)\s*:/gi, '')    // dangerous URI schemes
    .replace(/[<>]/g, '');                              // any stray angle brackets
}

// Confusable homoglyphs: characters from other scripts (mainly Cyrillic and
// Greek) that look identical or nearly identical to a common ASCII letter and
// are abused for typosquatting — e.g. a Cyrillic "а" (U+0430) inside
// "pаypal.exe", which reads as "paypal" but is a different string. Each maps to
// the standard ASCII letter it imitates.
const CONFUSABLES = {
  // Cyrillic lowercase
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c',
  'у': 'y', 'х': 'x', 'ѕ': 's', 'і': 'i', 'ј': 'j',
  'һ': 'h', 'ԁ': 'd', 'ӏ': 'l', 'ɡ': 'g', 'ı': 'i',
  // Cyrillic uppercase
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M',
  'Н': 'H', 'О': 'O', 'Р': 'P', 'С': 'C', 'Т': 'T',
  'У': 'Y', 'Х': 'X', 'Ѕ': 'S', 'І': 'I', 'Ј': 'J',
  'Ӏ': 'I', 'Ԛ': 'Q', 'Ԝ': 'W',
  // Greek lowercase
  'α': 'a', 'ο': 'o', 'ν': 'v', 'ρ': 'p',
  // Greek uppercase (visually identical to Latin capitals)
  'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H',
  'Ι': 'I', 'Κ': 'K', 'Μ': 'M', 'Ν': 'N', 'Ο': 'O',
  'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X',
};

const NON_ASCII_GLOBAL = /[^\u0000-\u007F]/g;
const NON_ASCII_TEST = /[^\u0000-\u007F]/;

// Rough "is this a letter" test for a non-ASCII character (excludes punctuation,
// symbols and the CJK space) so genuine non-Latin scripts can be weighed against
// Latin letters below.
function isNonAsciiLetter(ch) {
  return /[À-ɏͰ-ϿЀ-ӿ԰-῿぀-퟿]/.test(ch);
}

// Normalize a name to generally-used characters:
//   1. Unicode NFKC — folds compatibility variants (fullwidth "ＡＢＣ", ligatures
//      "ﬁ", circled/enclosed forms, etc.) into their canonical characters.
//   2. Confusable folding — replaces disguised homoglyphs (Cyrillic/Greek letters
//      that imitate ASCII) with the ASCII letter they imitate, but ONLY inside a
//      predominantly-Latin name (the typosquatting case). A genuinely non-Latin
//      name (e.g. an all-Cyrillic or all-Greek filename) has no Latin majority
//      and is returned untouched, so real names in other scripts are preserved.
function normalizeConfusables(name) {
  const s = String(name == null ? '' : name);
  let n = typeof s.normalize === 'function' ? s.normalize('NFKC') : s;
  if (!NON_ASCII_TEST.test(n)) return n; // pure ASCII: nothing to fold
  // Weigh Latin vs non-Latin letters over the BASE name only (excluding the
  // extension) — a Latin extension like ".txt" must not tip a genuinely non-Latin
  // name (e.g. Cyrillic "Гр.txt") into being folded to look-alike Latin.
  const dot = n.lastIndexOf('.');
  const base = dot > 0 ? n.slice(0, dot) : n;
  const latin = (base.match(/[A-Za-z]/g) || []).length;
  const nonLatin = (base.match(NON_ASCII_GLOBAL) || []).filter(isNonAsciiLetter).length;
  if (latin > 0 && latin >= nonLatin) {
    n = n.replace(NON_ASCII_GLOBAL, ch => CONFUSABLES[ch] || ch);
  }
  return n;
}

// Classify WHAT KIND of exploit markup a string contains, as human-readable labels
// for the Admin Panel → Problems log (e.g. "JavaScript code", "XML loop (billion
// laughs)"). Order matters: the most specific kinds are checked before the generic
// "HTML code" fallback. Returns [] when nothing dangerous is present.
function classifyExploitKinds(text) {
  const s = String(text == null ? '' : text);
  const kinds = [];
  if (/<!doctype|<!entity/i.test(s)) kinds.push('XML loop (billion laughs)');
  if (/<\?xml|<!\[cdata|<\?xml-stylesheet/i.test(s)) kinds.push('XML code');
  if (/<\s*script\b|javascript:|vbscript:|\son\w+\s*=|^on\w+\s*=/i.test(s)) kinds.push('JavaScript code');
  if (/<\?php|<\?=|<%/i.test(s)) kinds.push('server-side code (PHP/ASP)');
  if (/\{\{[\s\S]*?\}\}|\$\{[\s\S]*?\}/.test(s)) kinds.push('template injection');
  if (kinds.length === 0 && /<[^>]+>|[<>]/.test(s)) kinds.push('HTML code');
  return kinds;
}

// The general filename DISPLAY function: decoded, normalized (NFKC + confusable
// homoglyphs folded), invisible chars removed, exploit markup removed, whitespace
// collapsed. Used everywhere a filename is shown.
function cleanFileName(name) {
  let n = decodeFileNameSafe(String(name == null ? '' : name));
  n = normalizeConfusables(n);
  n = n.replace(INVISIBLE_CHARS_GLOBAL, '');
  n = stripExploitPatterns(n);
  return n.replace(/\s+/g, ' ').trim();
}

// The name to use when DOWNLOADING a file: the cleaned name, never empty.
function sanitizeDownloadFileName(name) {
  return cleanFileName(name) || 'download';
}

module.exports = {
  INVISIBLE_CHARS_SOURCE,
  INVISIBLE_CHARS_REGEX,
  INVISIBLE_CHARS_GLOBAL,
  hasInvisibleChars,
  decodeFileNameSafe,
  stripExploitPatterns,
  classifyExploitKinds,
  normalizeConfusables,
  cleanFileName,
  sanitizeDownloadFileName,
};
