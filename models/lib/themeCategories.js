'use strict';

// "Select Color" theme categories (docs/Theme/Theme.md). The board/global theme
// colors fall into four categories; many of them differ only by one or two accent
// colors. The color picker uses this to offer two-level dropdowns (category ->
// theme) and to decide where custom colors are allowed:
//   - flat   : single-accent flat designs        -> 1 custom color
//   - clear  : two-color "color slide" (gradient) -> 2 custom colors
//   - dark   : fixed dark designs                 -> no custom colors
//   - special: fixed special designs              -> no custom colors
//
// Single source of truth for both the Board Settings and Member Settings pickers
// and for server-side validation. Pure + CommonJS so it is unit-testable and
// importable everywhere (Meteor reads the named exports off module.exports).

// Category -> ordered theme color names. The UNION must equal ALLOWED_BOARD_COLORS
// (config/const.js), guarded by tests. Order here is the 2nd-level dropdown order.
const THEME_CATEGORIES = {
  flat: [
    'belize',
    'nephritis',
    'pomegranate',
    'pumpkin',
    'wisteria',
    'moderatepink',
    'strongcyan',
    'limegreen',
    'natural',
  ],
  clear: ['clearblue'],
  dark: ['midnight', 'dark', 'moderndark', 'exodark', 'cleandark'],
  special: ['relax', 'corteza', 'modern', 'cleanlight'],
};

// 1st-level dropdown order.
const THEME_CATEGORY_ORDER = ['flat', 'clear', 'dark', 'special'];

// How many custom colors each category accepts. flat = 1 base accent; clear = 2
// (a color slide / gradient like clearblue). dark/special = fixed, no custom colors.
const CUSTOM_COLOR_COUNT = { flat: 1, clear: 2 };

// The category a theme color belongs to, or null if unknown.
function categoryOf(color) {
  for (const cat of THEME_CATEGORY_ORDER) {
    if (THEME_CATEGORIES[cat].indexOf(color) !== -1) return cat;
  }
  return null;
}

// Ordered theme colors in a category (copy, safe to mutate).
function colorsInCategory(category) {
  return THEME_CATEGORIES[category] ? THEME_CATEGORIES[category].slice() : [];
}

// Does this category let the user choose custom colors?
function allowsCustomColor(category) {
  return (CUSTOM_COLOR_COUNT[category] || 0) > 0;
}

// How many custom colors this category accepts (0 = none).
function customColorCount(category) {
  return CUSTOM_COLOR_COUNT[category] || 0;
}

// Is `color` a known theme color name?
function isKnownThemeColor(color) {
  return categoryOf(color) !== null;
}

// Validate a custom-colors array for a theme color: it must belong to a category
// that allows custom colors, and the array length must be exactly that category's
// count with every entry a #rrggbb hex. Returns true/false (pure; the caller throws).
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
function isValidCustomColors(color, customColors) {
  const cat = categoryOf(color);
  const count = customColorCount(cat);
  if (count === 0) return false; // dark/special/unknown: no custom colors
  if (!Array.isArray(customColors) || customColors.length !== count) return false;
  return customColors.every(c => typeof c === 'string' && HEX_RE.test(c));
}

module.exports = {
  THEME_CATEGORIES,
  THEME_CATEGORY_ORDER,
  CUSTOM_COLOR_COUNT,
  categoryOf,
  colorsInCategory,
  allowsCustomColor,
  customColorCount,
  isKnownThemeColor,
  isValidCustomColors,
};
