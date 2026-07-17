'use strict';

// Plain-Node unit test (no Meteor) for the date-picker default-time logic.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/datePickerDefaultTime.test.cjs
//
// Regression guard for #1502 ("Add Feature: Set default time for time
// field"): each date popup configures a default time (17:00 for due dates,
// "now" for received/start/end), but the rendered logic only applied it when
// the card ALREADY had a date — where the input was already filled with that
// date's own time. For a card without a date the time input stayed empty and
// submitting stored a hard-coded 12:00 instead of the configured default.

const assert = require('assert');
const {
  isValidDate,
  formatTime,
  initialTimeValue,
  fallbackSubmitTime,
} = require('../imports/lib/datePickerTime');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const INVALID = new Date('invalid');
const DUE_DEFAULT = '1970-01-01 17:00:00'; // cardDate.js due-date default
const NOW_DEFAULT = '2026-07-17 09:05'; // formatDateTime(now()) shape

// --- formatTime / isValidDate -------------------------------------------------
test('formatTime renders 24-hour zero-padded HH:mm', () => {
  assert.strictEqual(formatTime(new Date(2026, 6, 17, 15, 0)), '15:00');
  assert.strictEqual(formatTime(new Date(2026, 6, 17, 9, 5)), '09:05');
  assert.strictEqual(formatTime(new Date(2026, 6, 17, 0, 0)), '00:00');
});

test('formatTime of an invalid date is empty, never "NaN:NaN"', () => {
  assert.strictEqual(formatTime(INVALID), '');
  assert.strictEqual(formatTime(undefined), '');
});

test('isValidDate accepts real Dates and rejects the rest', () => {
  assert.strictEqual(isValidDate(new Date(2026, 0, 1)), true);
  assert.strictEqual(isValidDate(INVALID), false);
  assert.strictEqual(isValidDate('2026-01-01'), false);
  assert.strictEqual(isValidDate(null), false);
});

// --- initialTimeValue: POSITIVE (the #1502 core) -------------------------------
test('card without a due date pre-fills the configured 17:00 default (#1502)', () => {
  assert.strictEqual(initialTimeValue(INVALID, DUE_DEFAULT), '17:00');
});

test('received/start/end style "now" default (full timestamp) also works', () => {
  assert.strictEqual(initialTimeValue(INVALID, NOW_DEFAULT), '09:05');
});

test('no default configured leaves the input empty', () => {
  assert.strictEqual(initialTimeValue(INVALID, undefined), '');
  assert.strictEqual(initialTimeValue(INVALID, ''), '');
});

// --- initialTimeValue: NEGATIVE ------------------------------------------------
test('NEGATIVE: an existing card date keeps its OWN time, default must not win', () => {
  const existing = new Date(2026, 6, 17, 8, 30);
  assert.strictEqual(initialTimeValue(existing, DUE_DEFAULT), '08:30');
});

test('NEGATIVE: an unparseable default never yields "NaN:NaN"', () => {
  assert.strictEqual(initialTimeValue(INVALID, 'not a time'), '');
});

// --- fallbackSubmitTime ---------------------------------------------------------
test('empty time at submit stores the configured default, not 12:00 (#1502)', () => {
  assert.strictEqual(fallbackSubmitTime(DUE_DEFAULT), '17:00');
});

test('NEGATIVE: without (or with a broken) default the legacy 12:00 remains', () => {
  assert.strictEqual(fallbackSubmitTime(undefined), '12:00');
  assert.strictEqual(fallbackSubmitTime(''), '12:00');
  assert.strictEqual(fallbackSubmitTime('garbage'), '12:00');
});

console.log(`\n${passed} tests passed`);
