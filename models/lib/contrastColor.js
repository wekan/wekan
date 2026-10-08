'use strict';

// Pure, dependency-free color helpers for #5514 (custom color-wheel / RGB hex
// picker with automatically readable text). Kept Meteor-free and CommonJS so the
// exact same logic runs on client, server and in plain-Node unit tests
// (mirrors models/lib/boardSortReorder.js).
//
// Two jobs:
//  1. Validate / normalize a color value that may be either a named palette
//     color (e.g. 'green') or a custom '#rrggbb' hex chosen from the color wheel.
//  2. Given any background color, return the text color ('#ffffff' or '#000000')
//     that stays readable on it, using sRGB relative luminance.

// Canonical hex for every named palette color WeKan offers (config/const.js
// ALLOWED_COLORS). Used so named colors get correct contrast too, and so a
// named background can be turned into an inline background-color when needed.
const NAMED_COLOR_HEX = {
  white: '#ffffff',
  green: '#3cb500',
  yellow: '#fad900',
  orange: '#ff9f19',
  red: '#eb4646',
  purple: '#a632db',
  blue: '#0079bf',
  sky: '#00c2e0',
  lime: '#51e898',
  pink: '#ff78cb',
  black: '#4d4d4d',
  silver: '#c0c0c0',
  peachpuff: '#ffdab9',
  crimson: '#dc143c',
  plum: '#dda0dd',
  darkgreen: '#006400',
  slateblue: '#6a5acd',
  magenta: '#ff00ff',
  gold: '#ffd700',
  navy: '#000080',
  gray: '#808080',
  saddlebrown: '#8b4513',
  paleturquoise: '#afeeee',
  mistyrose: '#ffe4e1',
  indigo: '#4b0082',
};

const HEX6_RE = /^#([0-9a-fA-F]{6})$/;
const HEX3_RE = /^#([0-9a-fA-F]{3})$/;

// True for a full 6-digit '#rrggbb' hex string (the form the color wheel and
// the schema store). Shorthand '#rgb' is NOT considered a valid stored value.
function isHexColor(value) {
  return typeof value === 'string' && HEX6_RE.test(value);
}

// Normalize any accepted hex ('#rgb' or '#rrggbb', any case) to lower-case
// '#rrggbb', or null when the input is not a hex color.
function normalizeHex(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (HEX6_RE.test(v)) return v.toLowerCase();
  if (HEX3_RE.test(v)) {
    const h = v.slice(1);
    return ('#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]).toLowerCase();
  }
  return null;
}

// Resolve any color value (named palette color or hex) to a '#rrggbb' hex, or
// null when it can't be resolved.
function toHex(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  const named = NAMED_COLOR_HEX[v.toLowerCase()];
  if (named) return named;
  return normalizeHex(v);
}

// Turn one sRGB channel (0..255) into its linear-light value, per the sRGB
// transfer function used by the WCAG relative-luminance formula.
function linearize(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// Relative luminance (0..1) of a '#rrggbb'/'#rgb'/named color, or null when the
// input can't be parsed.
function relativeLuminance(value) {
  const hex = toHex(value);
  if (!hex) return null;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// Main helper: return the text color that is readable on the given background.
// Accepts '#rrggbb', '#rgb' shorthand, or a known named palette color. Returns
// '#ffffff' on dark backgrounds and '#000000' on light ones. Falls back safely
// to '#000000' on unknown / garbage input (black text on the page default).
function contrastText(bgHexOrNamed) {
  const luminance = relativeLuminance(bgHexOrNamed);
  if (luminance === null) return '#000000';
  // 0.179 is the sRGB luminance where the WCAG contrast ratio against white
  // text equals the ratio against black text ((L+0.05)^2 = 1.05*0.05); above it
  // black text has the higher contrast, below it white text does.
  return luminance > 0.179 ? '#000000' : '#ffffff';
}

// The one rule for what a card's `color` may hold, shared by the Cards schema
// (models/cards.js, enforced on the server for every write) and the color
// popups: empty, one of the named palette colors, or a strict '#rrggbb' hex.
// Anything else - 'red;background:url(x)', '</style>', 'javascript:...', a
// '#rgb' shorthand, an rgb() expression - is refused, so a stored color can
// only ever be a palette class name or a plain hex inside the inline style.
function isAllowedCardColor(value, namedColors) {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string') return false;
  if (Array.isArray(namedColors) && namedColors.includes(value)) return true;
  return isHexColor(value);
}

// The custom '#rrggbb' colors already used on a board's cards, so the color
// popups (one card, and Multi-Selection) can offer them beside the ready-made
// palette: pick a lighter yellow once, and it is one click away for the next
// cards. Most used first, ties in first-seen order, lower-cased, de-duplicated,
// capped at `max`. Named palette colors and invalid values are skipped - the
// palette already shows the former, and the latter must never be rendered.
function customColorsInUse(values, max = 12) {
  const counts = new Map();
  for (const value of Array.isArray(values) ? values : []) {
    if (!isHexColor(value)) continue;
    const hex = value.toLowerCase();
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  // Map keys keep insertion order, so the index is the first-seen position.
  const firstSeen = new Map([...counts.keys()].map((hex, i) => [hex, i]));
  return [...counts.keys()]
    .sort((a, b) => counts.get(b) - counts.get(a) || firstSeen.get(a) - firstSeen.get(b))
    .slice(0, Math.max(0, max));
}

export {
  NAMED_COLOR_HEX,
  isAllowedCardColor,
  customColorsInUse,
  isHexColor,
  normalizeHex,
  toHex,
  relativeLuminance,
  contrastText,
};
