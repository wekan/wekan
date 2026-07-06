'use strict';

// Plain-Node unit test (no Meteor) for the minicard/card-detail "add checklist
// item" text parsing and payload builder.
// Run: node tests/checklistItemTitles.test.cjs
//
// Regression guard for #6440 ("'+' add-item button on minicard checklist does
// nothing"): the Save button now has an explicit click handler (the native form
// `submit` never fires inside the `a.minicard-wrapper` anchor). This module holds
// the pure decision of WHICH item title(s) that click creates — it must trim and
// drop blank input (so whitespace-only input creates NOTHING) and target the
// correct checklist/card in the insert payload.

const assert = require('assert');
const {
  parseChecklistItemTitles,
  buildChecklistItemPayload,
} = require('../models/lib/checklistItemTitles');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- parseChecklistItemTitles: POSITIVE -------------------------------------
test('#6440: a typed word becomes a single item', () => {
  assert.deepStrictEqual(parseChecklistItemTitles('test'), ['test']);
});

test('#6440: surrounding whitespace is trimmed', () => {
  assert.deepStrictEqual(parseChecklistItemTitles('  test  '), ['test']);
});

test('by default newlines do NOT split (single item, minicard behavior)', () => {
  assert.deepStrictEqual(parseChecklistItemTitles('a\nb'), ['a\nb']);
});

test('newlineBecomesNewChecklistItem splits into one item per non-blank line', () => {
  assert.deepStrictEqual(
    parseChecklistItemTitles('a\nb\nc', { newlineBecomesNewChecklistItem: true }),
    ['a', 'b', 'c'],
  );
});

test('newline split trims each line and drops blank lines', () => {
  assert.deepStrictEqual(
    parseChecklistItemTitles(' a \n\n  \n b ', { newlineBecomesNewChecklistItem: true }),
    ['a', 'b'],
  );
});

test('reverse flips the resulting order (top-insert without originOrder)', () => {
  assert.deepStrictEqual(
    parseChecklistItemTitles('a\nb\nc', {
      newlineBecomesNewChecklistItem: true,
      reverse: true,
    }),
    ['c', 'b', 'a'],
  );
});

// --- parseChecklistItemTitles: NEGATIVE (guards the bug) ---------------------
test('#6440: blank input creates NO item', () => {
  assert.deepStrictEqual(parseChecklistItemTitles(''), []);
});

test('#6440: whitespace-only input creates NO item', () => {
  assert.deepStrictEqual(parseChecklistItemTitles('   \n\t  '), []);
});

test('whitespace-only input with newline-split still creates NO item', () => {
  assert.deepStrictEqual(
    parseChecklistItemTitles('  \n  \n', { newlineBecomesNewChecklistItem: true }),
    [],
  );
});

test('non-string input is tolerated and creates NO item', () => {
  assert.deepStrictEqual(parseChecklistItemTitles(null), []);
  assert.deepStrictEqual(parseChecklistItemTitles(undefined), []);
  assert.deepStrictEqual(parseChecklistItemTitles(42), []);
});

// --- buildChecklistItemPayload: POSITIVE ------------------------------------
test('#6440: payload targets the correct checklist and card', () => {
  const checklist = { _id: 'chk1', cardId: 'card9' };
  const payload = buildChecklistItemPayload('test', checklist, 3);
  assert.deepStrictEqual(payload, {
    title: 'test',
    checklistId: 'chk1',
    cardId: 'card9',
    sort: 3,
  });
});

// --- buildChecklistItemPayload: NEGATIVE ------------------------------------
test('payload does NOT target a different checklist/card', () => {
  const checklist = { _id: 'chk1', cardId: 'card9' };
  const payload = buildChecklistItemPayload('test', checklist, 0);
  assert.notStrictEqual(payload.checklistId, 'chk2');
  assert.notStrictEqual(payload.cardId, 'card8');
});

console.log(`\n${passed} tests passed`);
