'use strict';

// Plain-Node unit test (no Meteor) for the board-import card date helper.
// Run: node tests/importedCardDates.test.cjs
//
// Covers #1992 "Some cards and dates missing when exporting from Sandstorm
// Wekan and importing to Standalone Wekan": the importer must restore ALL
// card dates carried in the export (createdAt, receivedAt, startAt, dueAt,
// endAt), falling back to the card's own createdAt when the export has no
// createCard activity (typical of Sandstorm and old/pruned exports), and a
// corrupt date value must degrade to null instead of an Invalid Date that
// would abort the card insert (a missing card).

const assert = require('assert');
const {
  importedCardDates,
  toValidDateOrNull,
} = require('../models/lib/importedCardDates');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const NOW = new Date('2026-07-17T10:00:00.000Z');

// --- positive: all dates present in the export are restored ------------------
test('restores receivedAt, startAt, dueAt and endAt from the exported card', () => {
  const card = {
    receivedAt: '2018-11-01T08:00:00.000Z',
    startAt: '2018-11-02T09:00:00.000Z',
    dueAt: '2018-11-05T17:00:00.000Z',
    endAt: '2018-11-04T16:30:00.000Z',
  };
  const dates = importedCardDates(card, null, NOW);
  assert.strictEqual(dates.receivedAt.toISOString(), '2018-11-01T08:00:00.000Z');
  assert.strictEqual(dates.startAt.toISOString(), '2018-11-02T09:00:00.000Z');
  assert.strictEqual(dates.dueAt.toISOString(), '2018-11-05T17:00:00.000Z');
  assert.strictEqual(dates.endAt.toISOString(), '2018-11-04T16:30:00.000Z');
});

test('createCard activity date wins for createdAt when present (historical behaviour)', () => {
  const card = { createdAt: '2018-10-01T00:00:00.000Z' };
  const dates = importedCardDates(card, '2018-09-15T12:00:00.000Z', NOW);
  assert.strictEqual(dates.createdAt.toISOString(), '2018-09-15T12:00:00.000Z');
});

test('falls back to the card\'s own createdAt when there is no createCard activity (Sandstorm export)', () => {
  const card = { createdAt: '2018-10-01T00:00:00.000Z' };
  const dates = importedCardDates(card, null, NOW);
  assert.strictEqual(dates.createdAt.toISOString(), '2018-10-01T00:00:00.000Z');
});

test('accepts Date objects as well as ISO strings (board clone path)', () => {
  const card = { startAt: new Date('2020-01-01T00:00:00.000Z') };
  const dates = importedCardDates(card, null, NOW);
  assert.strictEqual(dates.startAt.toISOString(), '2020-01-01T00:00:00.000Z');
});

// --- negative: missing/corrupt data degrades safely --------------------------
test('createdAt falls back to the import time when neither activity nor card has it', () => {
  const dates = importedCardDates({}, null, NOW);
  assert.strictEqual(dates.createdAt.getTime(), NOW.getTime());
});

test('absent optional dates come back as null (not undefined, not Invalid Date)', () => {
  const dates = importedCardDates({}, null, NOW);
  assert.strictEqual(dates.receivedAt, null);
  assert.strictEqual(dates.startAt, null);
  assert.strictEqual(dates.dueAt, null);
  assert.strictEqual(dates.endAt, null);
});

test('a corrupt date string becomes null instead of an Invalid Date', () => {
  const card = { dueAt: 'not-a-date', endAt: '2018-13-99Tgarbage' };
  const dates = importedCardDates(card, null, NOW);
  assert.strictEqual(dates.dueAt, null);
  assert.strictEqual(dates.endAt, null);
});

test('a corrupt createdAt on the card falls through to the import time', () => {
  const dates = importedCardDates({ createdAt: 'garbage' }, null, NOW);
  assert.strictEqual(dates.createdAt.getTime(), NOW.getTime());
});

test('a corrupt activity date falls through to the card createdAt', () => {
  const card = { createdAt: '2019-05-05T05:05:05.000Z' };
  const dates = importedCardDates(card, 'garbage', NOW);
  assert.strictEqual(dates.createdAt.toISOString(), '2019-05-05T05:05:05.000Z');
});

test('handles a null/undefined card without throwing', () => {
  const dates = importedCardDates(null, null, NOW);
  assert.strictEqual(dates.createdAt.getTime(), NOW.getTime());
  assert.strictEqual(dates.dueAt, null);
});

test('an invalid `now` fallback is replaced by a real current date', () => {
  const dates = importedCardDates({}, null, new Date('garbage'));
  assert.ok(dates.createdAt instanceof Date && !isNaN(dates.createdAt.getTime()));
});

// --- toValidDateOrNull unit checks -------------------------------------------
test('toValidDateOrNull: falsy values give null', () => {
  assert.strictEqual(toValidDateOrNull(null), null);
  assert.strictEqual(toValidDateOrNull(undefined), null);
  assert.strictEqual(toValidDateOrNull(''), null);
  assert.strictEqual(toValidDateOrNull(0), null);
});

test('toValidDateOrNull: valid ISO string gives the matching Date', () => {
  const d = toValidDateOrNull('2021-06-01T12:00:00.000Z');
  assert.strictEqual(d.toISOString(), '2021-06-01T12:00:00.000Z');
});

console.log(`\n${passed} tests passed`);
