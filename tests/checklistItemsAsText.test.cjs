'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for #4218 ("bulk-edit a checklist's items
// as plain text, one line per item").
// Run: node tests/checklistItemsAsText.test.cjs
//
// A checklist could previously only be edited one item at a time through its
// per-item HTML row - reordering, copying between checklists/cards, or a bulk
// rewording meant a click-drag or a click-edit-save per item. This pins the
// pure text <-> item conversion (models/lib/checklistItemsAsText.js): turning
// the current items into one `[x]`/`[ ]`-prefixed line per item, parsing that
// text back, and planning a replace that KEEPS an existing item's `_id` (and
// therefore any other metadata on it, e.g. the #4755 due date) when its title
// is unchanged, rather than deleting and recreating every item wholesale.

const assert = require('assert');
const {
  checklistItemsToText,
  parseChecklistItemsText,
  planChecklistItemsTextUpdate,
} = await import('../models/lib/checklistItemsAsText.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- checklistItemsToText: POSITIVE ------------------------------------------
test('#4218: an unchecked item becomes a "[ ] title" line', () => {
  assert.strictEqual(
    checklistItemsToText([{ title: 'Buy milk', isFinished: false }]),
    '[ ] Buy milk',
  );
});

test('#4218: a checked item becomes a "[x] title" line', () => {
  assert.strictEqual(
    checklistItemsToText([{ title: 'Done thing', isFinished: true }]),
    '[x] Done thing',
  );
});

test('#4218: multiple items become one line each, in order', () => {
  assert.strictEqual(
    checklistItemsToText([
      { title: 'a', isFinished: true },
      { title: 'b', isFinished: false },
      { title: 'c', isFinished: false },
    ]),
    '[x] a\n[ ] b\n[ ] c',
  );
});

test('empty/non-array input produces empty text', () => {
  assert.strictEqual(checklistItemsToText([]), '');
  assert.strictEqual(checklistItemsToText(null), '');
  assert.strictEqual(checklistItemsToText(undefined), '');
});

// --- parseChecklistItemsText: POSITIVE ---------------------------------------
test('#4218: "[x] title" parses to a checked item', () => {
  assert.deepStrictEqual(parseChecklistItemsText('[x] Done thing'), [
    { title: 'Done thing', isFinished: true },
  ]);
});

test('#4218: "[X] title" (uppercase X) also parses as checked', () => {
  assert.deepStrictEqual(parseChecklistItemsText('[X] Done thing'), [
    { title: 'Done thing', isFinished: true },
  ]);
});

test('#4218: "[ ] title" parses to an unchecked item', () => {
  assert.deepStrictEqual(parseChecklistItemsText('[ ] Todo item'), [
    { title: 'Todo item', isFinished: false },
  ]);
});

test('a plain line with no marker defaults to unchecked', () => {
  assert.deepStrictEqual(parseChecklistItemsText('Plain pasted line'), [
    { title: 'Plain pasted line', isFinished: false },
  ]);
});

test('#4218: multiple lines parse in order, mixed marker/no-marker', () => {
  assert.deepStrictEqual(
    parseChecklistItemsText('[x] a\n[ ] b\nc'),
    [
      { title: 'a', isFinished: true },
      { title: 'b', isFinished: false },
      { title: 'c', isFinished: false },
    ],
  );
});

test('surrounding whitespace on a line is trimmed', () => {
  assert.deepStrictEqual(parseChecklistItemsText('   [x]  a  \n'), [
    { title: 'a', isFinished: true },
  ]);
});

// --- parseChecklistItemsText: NEGATIVE ---------------------------------------
test('#4218: blank lines are skipped, not turned into items', () => {
  assert.deepStrictEqual(
    parseChecklistItemsText('[x] a\n\n   \n[ ] b'),
    [
      { title: 'a', isFinished: true },
      { title: 'b', isFinished: false },
    ],
  );
});

test('a marker with an empty title after it produces no item', () => {
  assert.deepStrictEqual(parseChecklistItemsText('[x]   \n[ ] real'), [
    { title: 'real', isFinished: false },
  ]);
});

test('non-string input is tolerated and produces no items', () => {
  assert.deepStrictEqual(parseChecklistItemsText(null), []);
  assert.deepStrictEqual(parseChecklistItemsText(undefined), []);
  assert.deepStrictEqual(parseChecklistItemsText(42), []);
});

// checklistItemsToText / parseChecklistItemsText round-trip.
test('round-trip: toText then parse recovers the same items', () => {
  const items = [
    { title: 'a', isFinished: true },
    { title: 'b', isFinished: false },
  ];
  assert.deepStrictEqual(parseChecklistItemsText(checklistItemsToText(items)), items);
});

// --- planChecklistItemsTextUpdate: POSITIVE (metadata preservation) ---------
test('#4218: an unchanged title is KEPT (same _id preserved, e.g. dueAt survives)', () => {
  const existing = [{ _id: 'i1', title: 'Buy milk' }];
  const parsed = [{ title: 'Buy milk', isFinished: true }];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, [{ _id: 'i1', sort: 0, isFinished: true }]);
  assert.deepStrictEqual(plan.insert, []);
  assert.deepStrictEqual(plan.remove, []);
});

test('a brand-new title (no existing match) is an INSERT', () => {
  const existing = [];
  const parsed = [{ title: 'New item', isFinished: false }];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, []);
  assert.deepStrictEqual(plan.insert, [{ title: 'New item', isFinished: false, sort: 0 }]);
  assert.deepStrictEqual(plan.remove, []);
});

test('a title dropped from the text is a REMOVE', () => {
  const existing = [{ _id: 'i1', title: 'Gone' }];
  const parsed = [];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, []);
  assert.deepStrictEqual(plan.insert, []);
  assert.deepStrictEqual(plan.remove, ['i1']);
});

test('reordering existing (unchanged) titles keeps both _ids with new sort order', () => {
  const existing = [
    { _id: 'i1', title: 'a' },
    { _id: 'i2', title: 'b' },
  ];
  const parsed = [
    { title: 'b', isFinished: false },
    { title: 'a', isFinished: false },
  ];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, [
    { _id: 'i2', sort: 0, isFinished: false },
    { _id: 'i1', sort: 1, isFinished: false },
  ]);
  assert.deepStrictEqual(plan.insert, []);
  assert.deepStrictEqual(plan.remove, []);
});

test('duplicate identical titles match existing items 1:1, not many-to-one', () => {
  const existing = [
    { _id: 'i1', title: 'dup' },
    { _id: 'i2', title: 'dup' },
  ];
  const parsed = [
    { title: 'dup', isFinished: false },
    { title: 'dup', isFinished: true },
  ];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, [
    { _id: 'i1', sort: 0, isFinished: false },
    { _id: 'i2', sort: 1, isFinished: true },
  ]);
  assert.deepStrictEqual(plan.remove, []);
});

test('a mix of keep/insert/remove is planned correctly together', () => {
  const existing = [
    { _id: 'i1', title: 'keep me' },
    { _id: 'i2', title: 'remove me' },
  ];
  const parsed = [
    { title: 'keep me', isFinished: true },
    { title: 'brand new', isFinished: false },
  ];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, [{ _id: 'i1', sort: 0, isFinished: true }]);
  assert.deepStrictEqual(plan.insert, [{ title: 'brand new', isFinished: false, sort: 1 }]);
  assert.deepStrictEqual(plan.remove, ['i2']);
});

// --- planChecklistItemsTextUpdate: NEGATIVE ----------------------------------
test('an edited (changed) title is NOT kept - it is a remove+insert pair, not a rename', () => {
  const existing = [{ _id: 'i1', title: 'old text' }];
  const parsed = [{ title: 'new text', isFinished: false }];
  const plan = planChecklistItemsTextUpdate(existing, parsed);
  assert.deepStrictEqual(plan.keep, []);
  assert.deepStrictEqual(plan.insert, [{ title: 'new text', isFinished: false, sort: 0 }]);
  assert.deepStrictEqual(plan.remove, ['i1']);
});

test('non-array input is tolerated and produces an all-empty plan', () => {
  assert.deepStrictEqual(planChecklistItemsTextUpdate(null, null), {
    keep: [],
    insert: [],
    remove: [],
  });
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });
