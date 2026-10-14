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
  return keyWithNumber(keyBase(title), taken, 2).key;
}

/** The key a title starts from, before any number is added. */
function keyBase(title) {
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
  return base.replace(/[^A-Z0-9]/g, '').slice(0, KEY_MAX);
}

// The base itself when free, else the base with the first free number from
// `from` up; { key, n } so a caller can go on from n + 1 next time.
function keyWithNumber(base, taken, from) {
  if (from <= 2 && !taken.has(base) && isValidKey(base)) return { key: base, n: 1 };
  for (let n = Math.max(2, from); ; n += 1) {
    const suffix = String(n);
    const candidate = base.slice(0, KEY_MAX - suffix.length) + suffix;
    if (!taken.has(candidate) && isValidKey(candidate)) return { key: candidate, n };
  }
}

/**
 * Keys for many boards at once (#6767): [{ _id, key }], each unique against
 * `taken` (the keys in use, a Set this adds to) and against each other.
 * Linear: the keys in use are read once by the caller, and each base keeps
 * the next number to try, so a thousand boards called "Board" do not each
 * count up from 2 again.
 */
function planBoardKeys(boards, taken = new Set()) {
  const next = new Map();
  const plan = [];
  for (const board of Array.isArray(boards) ? boards : []) {
    if (!board || !board._id) continue;
    const base = keyBase(board.title);
    const { key, n } = keyWithNumber(base, taken, next.get(base) || 2);
    next.set(base, n + 1);
    taken.add(key);
    plan.push({ _id: board._id, key });
  }
  return plan;
}

/**
 * The shortest start every key suggested from this title has, whatever
 * number is added: a single board's lookup reads only keys beginning with
 * it, not every key (#6767).
 */
function keyPrefix(title) {
  return keyBase(title).slice(0, KEY_MAX - 6);
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

module.exports = { KEY_PATTERN, KEY_MAX, isValidKey, suggestKey, keyBase, keyPrefix, planBoardKeys, formatCardKey, parseCardKey, normalizeKey };
