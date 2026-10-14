'use strict';

// Board keys (#2449, #2450; decided 2026-10-14: every board has one). A key is
// 2-10 capital letters and digits, starting with a letter, unique in the
// instance - "DEV", "OPS2" - and a card's number shows as KEY-7 instead of #7.
// The per-board card numbers themselves are unchanged (an atomic counter on
// the board, models/boards.js), so a key only changes how a number is shown
// and found. Pure: tests/boardKey.test.cjs.

const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;
const KEY_MAX = 10;

function isValidKey(key) {
  return typeof key === 'string' && KEY_PATTERN.test(key);
}

// Latin letters and digits of a title, accents removed: "Ålands Öppna" -> "ALANDS OPPNA".
function asciiWords(title) {
  return String(title || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

/**
 * A key suggested from a title, not in `taken` (a Set of keys in use):
 * the initials of a multi-word title ("Development Team" -> "DT"), else the
 * start of a one-word title ("Marketing" -> "MARK"), else "BOARD"; a number
 * is added until it is free ("DT2", "DT3").
 */
function suggestKey(title, taken = new Set()) {
  // Words that start with a letter; a leading number ("2026 plans") is not an initial.
  const words = asciiWords(title).filter(w => /^[A-Z]/.test(w));
  let base;
  if (words.length >= 2) {
    base = words.map(w => w[0]).join('').slice(0, 6);
  } else if (words.length === 1) {
    base = words[0].slice(0, 4);
  }
  if (!base || !/^[A-Z]/.test(base) || base.length < 2) {
    base = base && /^[A-Z]/.test(base) ? `${base}B` : 'BOARD';
  }
  base = base.replace(/[^A-Z0-9]/g, '').slice(0, KEY_MAX);
  if (!taken.has(base) && isValidKey(base)) return base;
  for (let n = 2; ; n += 1) {
    const suffix = String(n);
    const candidate = base.slice(0, KEY_MAX - suffix.length) + suffix;
    if (!taken.has(candidate) && isValidKey(candidate)) return candidate;
  }
}

/** How a card's number is shown: KEY-7, or #7 for a board without a key yet. */
function formatCardKey(key, number) {
  if (number === undefined || number === null || number === '') return '';
  return isValidKey(key) ? `${key}-${number}` : `#${number}`;
}

/** "DEV-7" (any case, surrounding spaces) -> { key: 'DEV', number: 7 }, else null. */
function parseCardKey(text) {
  const m = /^\s*([A-Za-z][A-Za-z0-9]{1,9})-(\d{1,9})\s*$/.exec(String(text || ''));
  if (!m) return null;
  return { key: m[1].toUpperCase(), number: Number(m[2]) };
}

/** A key a person typed, cleaned: upper case, spaces removed. */
function normalizeKey(input) {
  return String(input || '').trim().toUpperCase();
}

module.exports = { KEY_PATTERN, KEY_MAX, isValidKey, suggestKey, formatCardKey, parseCardKey, normalizeKey };
