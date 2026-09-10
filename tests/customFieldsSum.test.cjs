'use strict';
(async () => {

// Plain-Node regression test (no Meteor) for issue #3319:
// "Feature Suggestion: sum a numeric field for a column and/or swimlane".
//
// models/lib/customFieldsSum.js holds the pure sum computation used by
// numberFieldsSum() in client/components/lists/listHeader.js, which sums the
// value(s) of the board's numeric custom field(s) marked
// showSumAtTopOfList=true across a list's (optionally swimlane-scoped) cards
// and renders it as the "∑ <n>" badge next to the existing card-count badge.
//
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/customFieldsSum.test.cjs

const assert = require('assert');

const {
  sumCustomFieldValues,
  numberFieldStats,
  dateFieldRange,
} = await import('../models/lib/customFieldsSum.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const FIELD_A = 'field-a';
const FIELD_B = 'field-b';

function card(customFields) {
  return { customFields };
}

test('sums a numeric field across cards', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 3 }]),
    card([{ _id: FIELD_A, value: 4.5 }]),
    card([{ _id: FIELD_A, value: 2 }]),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A]), 9.5);
});

test('sums several flagged fields together, per card', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 2 }, { _id: FIELD_B, value: 3 }]),
    card([{ _id: FIELD_A, value: 1 }]),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A, FIELD_B]), 6);
});

test('accepts a numeric-looking string value (comma or dot decimal)', () => {
  const cards = [
    card([{ _id: FIELD_A, value: '2.5' }]),
    card([{ _id: FIELD_A, value: '1,5' }]),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A]), 4);
});

test('ignores a card missing the field entirely', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 5 }]),
    card([{ _id: FIELD_B, value: 100 }]), // different field, not summed
    card([]),
    card(undefined),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A]), 5);
});

test('ignores a null/undefined value without treating it as 0-that-hides-a-bug', () => {
  const cards = [
    card([{ _id: FIELD_A, value: null }]),
    card([{ _id: FIELD_A, value: undefined }]),
    card([{ _id: FIELD_A, value: 7 }]),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A]), 7);
});

test('ignores a non-numeric string value rather than throwing or counting it', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 'not a number' }]),
    card([{ _id: FIELD_A, value: 3 }]),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A]), 3);
});

test('returns 0 for an empty card list', () => {
  assert.strictEqual(sumCustomFieldValues([], [FIELD_A]), 0);
});

test('returns 0 when no field is flagged/selected', () => {
  const cards = [card([{ _id: FIELD_A, value: 5 }])];
  assert.strictEqual(sumCustomFieldValues(cards, []), 0);
  assert.strictEqual(sumCustomFieldValues(cards, undefined), 0);
});

test('returns 0 for null/undefined cards input', () => {
  assert.strictEqual(sumCustomFieldValues(null, [FIELD_A]), 0);
  assert.strictEqual(sumCustomFieldValues(undefined, [FIELD_A]), 0);
});

// #2075: broader list-level custom-field summary, EXTENDING #3319's sum-only
// mechanism (same flagged field(s), same swimlane-scoped card set) rather
// than replacing it - numberFieldStats() adds min/max + "N of M cards have
// a value" alongside the sum, and dateFieldRange() does the earliest/latest
// equivalent for a date-type field.

test('#3319 regression: sumCustomFieldValues is completely unaffected by the #2075 additions', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 3 }]),
    card([{ _id: FIELD_A, value: 4.5 }]),
    card([{ _id: FIELD_A, value: 2 }]),
  ];
  assert.strictEqual(sumCustomFieldValues(cards, [FIELD_A]), 9.5);
  // And numberFieldStats()'s own sum must agree with it, not just coexist.
  assert.strictEqual(numberFieldStats(cards, [FIELD_A]).sum, 9.5);
});

test('numberFieldStats computes sum, min and max across cards', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 3 }]),
    card([{ _id: FIELD_A, value: 10 }]),
    card([{ _id: FIELD_A, value: -2 }]),
  ];
  const stats = numberFieldStats(cards, [FIELD_A]);
  assert.strictEqual(stats.sum, 11);
  assert.strictEqual(stats.min, -2);
  assert.strictEqual(stats.max, 10);
});

test('numberFieldStats combines several flagged fields, per card, for min/max too', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 2 }, { _id: FIELD_B, value: 9 }]),
    card([{ _id: FIELD_A, value: 1 }]),
  ];
  const stats = numberFieldStats(cards, [FIELD_A, FIELD_B]);
  assert.strictEqual(stats.sum, 12);
  assert.strictEqual(stats.min, 1);
  assert.strictEqual(stats.max, 9);
});

test('numberFieldStats counts how many cards have the field set, out of the total', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 5 }]),
    card([{ _id: FIELD_A, value: null }]),
    card([{ _id: FIELD_B, value: 7 }]), // different field, not counted
    card([]),
  ];
  const stats = numberFieldStats(cards, [FIELD_A]);
  assert.strictEqual(stats.count, 1);
  assert.strictEqual(stats.total, 4);
});

test('numberFieldStats ignores a non-numeric value for min/max/count, same as the sum', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 'not a number' }]),
    card([{ _id: FIELD_A, value: 6 }]),
  ];
  const stats = numberFieldStats(cards, [FIELD_A]);
  assert.strictEqual(stats.count, 1);
  assert.strictEqual(stats.min, 6);
  assert.strictEqual(stats.max, 6);
});

test('numberFieldStats returns null min/max/0 sum/count for an empty card list', () => {
  const stats = numberFieldStats([], [FIELD_A]);
  assert.strictEqual(stats.sum, 0);
  assert.strictEqual(stats.min, null);
  assert.strictEqual(stats.max, null);
  assert.strictEqual(stats.count, 0);
  assert.strictEqual(stats.total, 0);
});

test('numberFieldStats returns null min/max when no field is flagged', () => {
  const cards = [card([{ _id: FIELD_A, value: 5 }])];
  const stats = numberFieldStats(cards, []);
  assert.strictEqual(stats.min, null);
  assert.strictEqual(stats.max, null);
  assert.strictEqual(stats.total, 1);
});

test('dateFieldRange computes earliest/latest among the cards', () => {
  const cards = [
    card([{ _id: FIELD_A, value: '2026-03-01T00:00:00.000Z' }]),
    card([{ _id: FIELD_A, value: '2026-01-15T00:00:00.000Z' }]),
    card([{ _id: FIELD_A, value: '2026-02-10T00:00:00.000Z' }]),
  ];
  const range = dateFieldRange(cards, [FIELD_A]);
  assert.strictEqual(range.earliest, Date.parse('2026-01-15T00:00:00.000Z'));
  assert.strictEqual(range.latest, Date.parse('2026-03-01T00:00:00.000Z'));
});

test('dateFieldRange accepts a Date instance as well as an ISO string', () => {
  const cards = [
    card([{ _id: FIELD_A, value: new Date('2026-05-01T00:00:00.000Z') }]),
    card([{ _id: FIELD_A, value: '2026-04-01T00:00:00.000Z' }]),
  ];
  const range = dateFieldRange(cards, [FIELD_A]);
  assert.strictEqual(range.earliest, Date.parse('2026-04-01T00:00:00.000Z'));
  assert.strictEqual(range.latest, Date.parse('2026-05-01T00:00:00.000Z'));
});

test('dateFieldRange counts how many cards have the field set, out of the total', () => {
  const cards = [
    card([{ _id: FIELD_A, value: '2026-01-01T00:00:00.000Z' }]),
    card([{ _id: FIELD_A, value: null }]),
    card([]),
  ];
  const range = dateFieldRange(cards, [FIELD_A]);
  assert.strictEqual(range.count, 1);
  assert.strictEqual(range.total, 3);
});

test('dateFieldRange ignores an unparseable date value rather than corrupting the range', () => {
  const cards = [
    card([{ _id: FIELD_A, value: 'not a date' }]),
    card([{ _id: FIELD_A, value: '2026-06-01T00:00:00.000Z' }]),
  ];
  const range = dateFieldRange(cards, [FIELD_A]);
  assert.strictEqual(range.count, 1);
  assert.strictEqual(range.earliest, Date.parse('2026-06-01T00:00:00.000Z'));
  assert.strictEqual(range.latest, Date.parse('2026-06-01T00:00:00.000Z'));
});

test('dateFieldRange returns null earliest/latest for an empty card list or no flagged field', () => {
  assert.strictEqual(dateFieldRange([], [FIELD_A]).earliest, null);
  const cards = [card([{ _id: FIELD_A, value: '2026-01-01T00:00:00.000Z' }])];
  const range = dateFieldRange(cards, []);
  assert.strictEqual(range.earliest, null);
  assert.strictEqual(range.latest, null);
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
