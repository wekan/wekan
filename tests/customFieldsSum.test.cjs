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

const { sumCustomFieldValues } = await import('../models/lib/customFieldsSum.js');

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

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
