'use strict';

// #2110: a lasting colour per person on initials avatars, so the same person
// is recognised at a glance on every minicard, board and member list - the
// same colour everywhere and every time, from the user id alone. Each colour
// keeps its initials readable (contrast at least 4.5:1, WCAG AA).
// Pure: tests/avatarColor.test.cjs.

// [background, text]
const PALETTE = [
  ['#c62828', '#ffffff'], ['#ad1457', '#ffffff'], ['#6a1b9a', '#ffffff'], ['#4527a0', '#ffffff'],
  ['#283593', '#ffffff'], ['#1565c0', '#ffffff'], ['#00695c', '#ffffff'], ['#2e7d32', '#ffffff'],
  ['#9e9d24', '#000000'], ['#f9a825', '#000000'], ['#ef6c00', '#000000'], ['#4e342e', '#ffffff'],
  ['#37474f', '#ffffff'], ['#80deea', '#000000'], ['#a5d6a7', '#000000'], ['#ce93d8', '#000000'],
];

// FNV-1a: small, stable across runs and platforms.
function hash(text) {
  let h = 0x811c9dc5;
  for (const ch of String(text || '')) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** [background, text] colours for a user id; the same id, the same colours. */
function avatarColors(userId) {
  return PALETTE[hash(userId) % PALETTE.length];
}

function avatarColorStyle(userId) {
  if (!userId) return '';
  const [background, text] = avatarColors(userId);
  return `background-color: ${background}; color: ${text};`;
}

module.exports = { PALETTE, avatarColors, avatarColorStyle, hash };
