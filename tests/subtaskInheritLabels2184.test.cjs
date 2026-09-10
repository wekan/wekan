'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for #2184 "optionally inherit the parent
// card's labels when creating a subtask".
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/subtaskInheritLabels2184.test.cjs
//
// The "Add a new subtask" popup (client/components/cards/subtasks.jade,
// template `addSubtaskCardForm`) gets an "Inherit parent's labels" checkbox,
// default UNCHECKED. The Meteor method `addSubtaskCard` (server/models/cards.js)
// takes a third `inheritLabels` argument and computes the new subtask's
// `labelIds` via the pure helper `computeSubtaskLabelIds` in
// models/lib/subtaskLabelInheritance.js, so this can be tested without a
// database. This is a ONE-TIME copy at creation time, not an ongoing sync.

const assert = require('assert');
const { computeSubtaskLabelIds } = await import('../models/lib/subtaskLabelInheritance.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- NEGATIVE / regression: unchecked (default) keeps current behaviour ----

test('NEGATIVE/regression: inheritLabels=false (default, unchanged) yields an empty labelIds, matching current behaviour', () => {
  const parentCard = { _id: 'parent1', labelIds: ['red', 'blue', 'green'] };
  assert.deepStrictEqual(computeSubtaskLabelIds(parentCard, false), []);
});

test('NEGATIVE/regression: inheritLabels omitted (undefined) also yields an empty labelIds', () => {
  const parentCard = { _id: 'parent1', labelIds: ['red', 'blue'] };
  assert.deepStrictEqual(computeSubtaskLabelIds(parentCard, undefined), []);
});

test('NEGATIVE/regression: a parent card with no labels at all still yields an empty labelIds when unchecked', () => {
  const parentCard = { _id: 'parent1', labelIds: [] };
  assert.deepStrictEqual(computeSubtaskLabelIds(parentCard, false), []);
});

// --- POSITIVE: checked copies the parent's CURRENT labels exactly ----------

test('checked: the subtask labelIds exactly matches the parent labelIds at creation time', () => {
  const parentCard = { _id: 'parent1', labelIds: ['red', 'blue', 'green'] };
  const labelIds = computeSubtaskLabelIds(parentCard, true);
  assert.deepStrictEqual(labelIds, ['red', 'blue', 'green']);
});

test('checked: a parent with no labels yields an empty labelIds too (nothing to inherit)', () => {
  const parentCard = { _id: 'parent1', labelIds: [] };
  assert.deepStrictEqual(computeSubtaskLabelIds(parentCard, true), []);
});

test('checked: a parent with a missing/non-array labelIds field is treated as no labels (defensive)', () => {
  const parentCard = { _id: 'parent1' };
  assert.deepStrictEqual(computeSubtaskLabelIds(parentCard, true), []);
});

// --- POSITIVE: this is a ONE-TIME copy, not an ongoing sync ----------------

test('one-time copy: mutating the RETURNED array does not affect the parent card labelIds (independent copy)', () => {
  const parentCard = { _id: 'parent1', labelIds: ['red', 'blue'] };
  const subtaskLabelIds = computeSubtaskLabelIds(parentCard, true);
  subtaskLabelIds.push('purple');
  assert.deepStrictEqual(parentCard.labelIds, ['red', 'blue'], 'the parent card must be untouched');
});

test('one-time copy: a LATER change to the parent labelIds does not retroactively affect the already-created subtask', () => {
  const parentCard = { _id: 'parent1', labelIds: ['red', 'blue'] };
  // Subtask created now, while the parent has red+blue.
  const subtaskLabelIds = computeSubtaskLabelIds(parentCard, true);
  assert.deepStrictEqual(subtaskLabelIds, ['red', 'blue']);

  // Parent's labels change afterwards (as if by a real update on the parent
  // card document) -- this must not be visible through the subtask's
  // already-computed labelIds, because it is not sharing the same array.
  parentCard.labelIds.push('yellow');
  parentCard.labelIds.shift();
  assert.deepStrictEqual(
    subtaskLabelIds,
    ['red', 'blue'],
    'the already-created subtask must keep the snapshot taken at creation time',
  );
  assert.deepStrictEqual(parentCard.labelIds, ['blue', 'yellow']);
});

console.log(`\n${passed} passing`);

})().catch(e => { console.error(e); process.exit(1); });
