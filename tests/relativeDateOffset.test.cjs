'use strict';

// Plain-Node unit test (no Meteor) for the Rules relative/custom-time helper.
// Run: node tests/relativeDateOffset.test.cjs
//
// Covers #5621 Part A: the "set a date field to now + <value> <unit> later"
// action, where unit is minute/hour/day/week/month. The offset math lives in a
// pure helper so it is testable without a Meteor build. Backward compat: rules
// created before the unit selector have no `unit`, which must mean DAYS.

const assert = require('assert');
const { relativeDateOffset, normalizeUnit } = require('../models/lib/relativeDateOffset');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const base = new Date('2020-01-15T12:00:00.000Z');

// --- minutes / hours / days / weeks add -------------------------------------
test('minutes add the right number of milliseconds', () => {
  assert.strictEqual(
    relativeDateOffset(base, 30, 'minutes').getTime(),
    base.getTime() + 30 * 60 * 1000,
  );
});

test('hours add the right number of milliseconds', () => {
  assert.strictEqual(
    relativeDateOffset(base, 5, 'hours').getTime(),
    base.getTime() + 5 * 60 * 60 * 1000,
  );
});

test('days add the right number of milliseconds', () => {
  assert.strictEqual(
    relativeDateOffset(base, 3, 'days').getTime(),
    base.getTime() + 3 * 24 * 60 * 60 * 1000,
  );
});

test('weeks add 7 days each', () => {
  assert.strictEqual(
    relativeDateOffset(base, 2, 'weeks').getTime(),
    base.getTime() + 2 * 7 * 24 * 60 * 60 * 1000,
  );
});

// --- month add (calendar-aware) ---------------------------------------------
test('month add keeps the same day-of-month for a normal month', () => {
  const out = relativeDateOffset(new Date('2020-03-15T12:00:00.000Z'), 1, 'months');
  assert.strictEqual(out.getFullYear(), 2020);
  assert.strictEqual(out.getMonth(), 3); // April (0-based)
  assert.strictEqual(out.getDate(), 15);
});

test('month add crosses a year boundary', () => {
  const out = relativeDateOffset(new Date('2020-12-10T00:00:00'), 2, 'months');
  assert.strictEqual(out.getFullYear(), 2021);
  assert.strictEqual(out.getMonth(), 1); // February
  assert.strictEqual(out.getDate(), 10);
});

test('Jan 31 + 1 month overflows into March (JS Date behaviour, not a 30-day fudge)', () => {
  // Jan 31 + 1 month => no Feb 31, so setMonth rolls forward. In 2021 (Feb has
  // 28 days) this lands on Mar 3. The point: it is a real calendar add, not
  // base + 30 days (which would be Mar 2).
  const out = relativeDateOffset(new Date('2021-01-31T00:00:00'), 1, 'months');
  assert.strictEqual(out.getMonth(), 2); // March
  const plus30 = new Date(new Date('2021-01-31T00:00:00').getTime() + 30 * 24 * 60 * 60 * 1000);
  assert.notStrictEqual(out.getTime(), plus30.getTime());
});

// --- negative values ("earlier") --------------------------------------------
test('negative days move the date earlier', () => {
  assert.strictEqual(
    relativeDateOffset(base, -3, 'days').getTime(),
    base.getTime() - 3 * 24 * 60 * 60 * 1000,
  );
});

test('negative months move to a previous month', () => {
  const out = relativeDateOffset(new Date('2020-03-15T12:00:00.000Z'), -2, 'months');
  assert.strictEqual(out.getMonth(), 0); // January
  assert.strictEqual(out.getDate(), 15);
});

// --- backward compatibility: no unit => days --------------------------------
test('unit absent (undefined) defaults to days (backward compat with old rules)', () => {
  assert.strictEqual(
    relativeDateOffset(base, 4, undefined).getTime(),
    base.getTime() + 4 * 24 * 60 * 60 * 1000,
  );
});

test('unknown unit string falls back to days', () => {
  assert.strictEqual(
    relativeDateOffset(base, 1, 'fortnights').getTime(),
    base.getTime() + 1 * 24 * 60 * 60 * 1000,
  );
});

test('non-numeric value is treated as 0 (no offset)', () => {
  assert.strictEqual(
    relativeDateOffset(base, '', 'days').getTime(),
    base.getTime(),
  );
});

test('string numeric value is parsed', () => {
  assert.strictEqual(
    relativeDateOffset(base, '7', 'days').getTime(),
    base.getTime() + 7 * 24 * 60 * 60 * 1000,
  );
});

// --- normalizeUnit ----------------------------------------------------------
test('normalizeUnit passes known units through and maps the rest to days', () => {
  assert.strictEqual(normalizeUnit('minutes'), 'minutes');
  assert.strictEqual(normalizeUnit('months'), 'months');
  assert.strictEqual(normalizeUnit(undefined), 'days');
  assert.strictEqual(normalizeUnit('nope'), 'days');
});

// --- helper must not mutate the passed-in base date -------------------------
test('relativeDateOffset does not mutate its base Date argument', () => {
  const arg = new Date('2020-06-01T00:00:00.000Z');
  const snapshot = arg.getTime();
  relativeDateOffset(arg, 5, 'months');
  assert.strictEqual(arg.getTime(), snapshot);
});

console.log(`\n${passed} tests passed`);
