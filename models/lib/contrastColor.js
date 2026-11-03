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

// WCAG contrast ratio (1..21) between two colors (hex or named), or null when
// either cannot be parsed.
function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h, s, l) {
  const hue = (p, q, t) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  let r;
  let g;
  let b;
  if (s === 0) {
    r = l; g = l; b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const part = v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

// Make a color readable against the given background(s): the same hue and
// saturation, with its lightness moved - away from the background's lightness -
// by the smallest step that reaches `min` (4.5 is WCAG 1.4.3 AA for text) against
// EVERY background in the list. The color is returned unchanged when it already
// does. When the backgrounds lie on both sides of it (a light one and a dark one)
// no color can reach `min` against both; then the better of black and white for
// the worst background is returned, which is the best that can be done.
//
// This is the one place a user's free color choice is turned into one that is
// legible: a custom theme accent against the header's white text, the text color
// a member picks against the surface it is drawn on. (A custom label, card, list
// or swimlane color is the other way round - its TEXT is derived, by contrastText.)
// Returns the input (normalized) when it cannot be parsed.
function ensureContrast(color, backgrounds, min = 4.5) {
  const hex = toHex(color);
  if (!hex) return typeof color === 'string' ? color : '';
  const list = (Array.isArray(backgrounds) ? backgrounds : [backgrounds]).filter(b => toHex(b));
  if (!list.length) return hex;
  const worst = candidate => Math.min(...list.map(b => contrastRatio(candidate, b)));
  if (worst(hex) >= min) return hex;
  const [h, s, l0] = hexToHsl(hex);
  // Which way: toward black when the backgrounds are lighter than the color's
  // own lightness would reach, toward white otherwise.
  const meanLum = list.reduce((sum, b) => sum + relativeLuminance(b), 0) / list.length;
  const direction = meanLum > 0.179 ? -1 : 1;
  for (let step = 1; step <= 100; step += 1) {
    const l = Math.max(0, Math.min(1, l0 + direction * step * 0.01));
    const candidate = hslToHex(h, s, l);
    if (worst(candidate) >= min) return candidate;
  }
  const black = worst('#000000');
  const white = worst('#ffffff');
  return black >= white ? '#000000' : '#ffffff';
}

// A custom accent (a theme's header and buttons) is drawn with white text on it,
// and the header's button labels are #f2f2f2, a shade below: darken the accent,
// if it needs, until both are at AA.
function readableAccent(color, min = 4.5) {
  return ensureContrast(color, ['#ffffff', '#f2f2f2'], min);
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
  contrastRatio,
  ensureContrast,
  readableAccent,
};
