'use strict';

// Member Settings / Font (#4759, docs/Theme/Theme.md). A curated whitelist of common
// cross-platform UI fonts. The picker offers only those DETECTED as actually
// installed in the user's browser (client/lib/fontDetector.js); the server validates
// the saved value against this same whitelist, so an arbitrary string can never reach
// a CSS font-family. The font name is plain text — never rendered as HTML/markdown —
// and every entry matches SAFE_FONT_RE (letters/digits/spaces/hyphens only), so it is
// safe to interpolate into a quoted `font-family` value.
//
// Pure + CommonJS: unit-testable and importable on both client and server.

const UI_FONTS = [
  // Windows / cross-platform
  'Arial',
  'Arial Black',
  'Helvetica',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Segoe UI',
  'Georgia',
  'Times New Roman',
  'Palatino',
  'Garamond',
  'Bookman',
  'Courier New',
  'Consolas',
  'Comic Sans MS',
  'Impact',
  'Lucida Sans',
  'Lucida Console',
  // macOS
  'Monaco',
  'Menlo',
  // Linux common
  'DejaVu Sans',
  'Liberation Sans',
  'Ubuntu',
  'Cantarell',
  'Noto Sans',
  // Popular web fonts that are often installed locally
  'Roboto',
  'Open Sans',
  'Lato',
  'Inter',
];

// A font name is safe to use in CSS if it starts with a letter/digit and contains
// only letters, digits, spaces and hyphens (max 49 chars). No quotes, semicolons,
// braces, url(), angle brackets, etc. — nothing that could break out of a quoted
// font-family value or inject markup.
const SAFE_FONT_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{0,48}$/;

function isSafeFontName(name) {
  return typeof name === 'string' && SAFE_FONT_RE.test(name);
}

// Is `name` one of the curated fonts? (Also implies it is safe.)
function isKnownFont(name) {
  return UI_FONTS.indexOf(name) !== -1;
}

// The CSS `font-family` value for a chosen font, quoted + with a generic fallback.
// Returns '' for an unknown/empty font so callers apply nothing.
function fontFamilyValue(name) {
  if (!isKnownFont(name)) return '';
  return `"${name}", sans-serif`;
}

// Member Settings / Font / Size (#4759): named preset sizes only — the user picks
// from a dropdown, never types a number. `default` = the stock size (no override /
// unset). Values are percentages applied to the UI font-size, so they scale relative
// to whatever the base is.
const UI_FONT_SIZES = [
  { key: 'default', percent: 100 },
  { key: 'smaller', percent: 80 },
  { key: 'small', percent: 90 },
  { key: 'large', percent: 115 },
  { key: 'larger', percent: 130 },
  { key: 'largest', percent: 150 },
];

const UI_FONT_SIZE_KEYS = UI_FONT_SIZES.map(s => s.key);

// Is `key` a known preset? (Includes 'default'.)
function isKnownFontSize(key) {
  return UI_FONT_SIZE_KEYS.indexOf(key) !== -1;
}

// The CSS font-size value for a preset, or '' for 'default'/unknown (apply nothing).
function fontSizeValue(key) {
  const s = UI_FONT_SIZES.find(x => x.key === key);
  if (!s || s.key === 'default') return '';
  return `${s.percent}%`;
}

// Member Settings / Font / Color (#4759): the text color and text background color
// are free choices from a color wheel, so they are validated as #rrggbb hex (not a
// whitelist). Only a strict hex passes, so there is no CSS-injection surface.
const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

function isHexColor6(value) {
  return typeof value === 'string' && HEX6_RE.test(value);
}

// The color if it is a valid hex, else '' (apply nothing / default).
function colorValue(value) {
  return isHexColor6(value) ? value : '';
}

module.exports = {
  UI_FONTS,
  SAFE_FONT_RE,
  isSafeFontName,
  isKnownFont,
  fontFamilyValue,
  UI_FONT_SIZES,
  UI_FONT_SIZE_KEYS,
  isKnownFontSize,
  fontSizeValue,
  isHexColor6,
  colorValue,
};
