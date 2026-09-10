'use strict';
(async () => {

// Plain-Node unit test (no Meteor/database) for #4017 "apply a checklist
// template to an already-existing card". Run: node tests/checklistTemplateCopy.test.cjs
//
// WeKan could already copy a template card's checklists onto a NEW card
// (Cards.copy() -> Checklists.copy(), used when creating a card from a
// template) but had no way to append them onto a card that already exists.
// The new "Copy Checklist From Template" action
// (client/components/cards/checklists.js/.jade) and
// Checklists.copyAllFromCardToCard() (models/checklists.js) build on the
// same per-checklist copy, using the pure document builders in
// models/lib/checklistTemplateCopy.js this suite exercises directly.

const assert = require('assert');
const {
  buildCopiedChecklistDoc,
  buildCopiedItemDoc,
  firstAppendSort,
} = await import('../models/lib/checklistTemplateCopy.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const TEMPLATE_CHECKLIST = {
  _id: 'templateChecklist1',
  cardId: 'templateCard',
  boardId: 'templateBoard',
  title: 'Onboarding',
  sort: 3,
  hideCheckedChecklistItems: true,
};

const TEMPLATE_ITEM_UNCHECKED = {
  _id: 'templateItem1',
  checklistId: 'templateChecklist1',
  cardId: 'templateCard',
  boardId: 'templateBoard',
  title: 'Send welcome email',
  sort: 0,
  isFinished: false,
};

const TEMPLATE_ITEM_CHECKED = {
  _id: 'templateItem2',
  checklistId: 'templateChecklist1',
  cardId: 'templateCard',
  boardId: 'templateBoard',
  title: 'Order laptop',
  sort: 1,
  isFinished: true,
};

// --- POSITIVE: the copied checklist matches the template's content ---------

test('the copied checklist keeps the template title and per-checklist settings', () => {
  const copy = buildCopiedChecklistDoc(TEMPLATE_CHECKLIST, {
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    sort: 5,
  });
  assert.strictEqual(copy.title, 'Onboarding');
  assert.strictEqual(copy.hideCheckedChecklistItems, true);
});

test('the copied checklist is re-homed onto the destination card/board', () => {
  const copy = buildCopiedChecklistDoc(TEMPLATE_CHECKLIST, {
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    sort: 5,
  });
  assert.strictEqual(copy.cardId, 'existingCard');
  assert.strictEqual(copy.boardId, 'existingBoard');
});

test('the copied checklist has no _id - the insert assigns a fresh one (negative)', () => {
  const copy = buildCopiedChecklistDoc(TEMPLATE_CHECKLIST, {
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    sort: 5,
  });
  assert.ok(!('_id' in copy), 'a copy must not carry the source _id forward');
});

test('the copied checklist is placed at the given (append) sort position', () => {
  const copy = buildCopiedChecklistDoc(TEMPLATE_CHECKLIST, {
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    sort: 5,
  });
  assert.strictEqual(copy.sort, 5);
});

// --- POSITIVE: copied items match the template's content -------------------

test('a copied item keeps the template title', () => {
  const copy = buildCopiedItemDoc(TEMPLATE_ITEM_UNCHECKED, {
    newChecklistId: 'newChecklist1',
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    resetChecked: true,
  });
  assert.strictEqual(copy.title, 'Send welcome email');
});

test('a copied item is re-homed onto the new checklist/card/board', () => {
  const copy = buildCopiedItemDoc(TEMPLATE_ITEM_UNCHECKED, {
    newChecklistId: 'newChecklist1',
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    resetChecked: true,
  });
  assert.strictEqual(copy.checklistId, 'newChecklist1');
  assert.strictEqual(copy.cardId, 'existingCard');
  assert.strictEqual(copy.boardId, 'existingBoard');
});

test('a copied item has no _id - the insert assigns a fresh one (negative)', () => {
  const copy = buildCopiedItemDoc(TEMPLATE_ITEM_UNCHECKED, {
    newChecklistId: 'newChecklist1',
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    resetChecked: true,
  });
  assert.ok(!('_id' in copy), 'a copy must not carry the source _id forward');
});

// --- POSITIVE / the defining rule of #4017: always unchecked ---------------

test('an already-unchecked template item copies as unchecked', () => {
  const copy = buildCopiedItemDoc(TEMPLATE_ITEM_UNCHECKED, {
    newChecklistId: 'newChecklist1',
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    resetChecked: true,
  });
  assert.strictEqual(copy.isFinished, false);
});

test('a CHECKED template item still copies as unchecked when resetChecked is set', () => {
  const copy = buildCopiedItemDoc(TEMPLATE_ITEM_CHECKED, {
    newChecklistId: 'newChecklist1',
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    resetChecked: true,
  });
  assert.strictEqual(copy.isFinished, false,
    'applying a template must never pre-check the card it lands on');
});

// --- NEGATIVE: resetChecked defaults to false, so ordinary checklist copy --
// (the pre-existing "Copy Checklist" popup, and Cards.copy() when creating a
// card from a template) is UNCHANGED and keeps the source's checked state.

test('without resetChecked, a checked source item stays checked (negative)', () => {
  const copy = buildCopiedItemDoc(TEMPLATE_ITEM_CHECKED, {
    newChecklistId: 'newChecklist1',
    newCardId: 'existingCard',
    boardId: 'existingBoard',
    // resetChecked omitted - defaults to falsy/undefined
  });
  assert.strictEqual(copy.isFinished, true,
    'ordinary checklist copy must keep preserving the source checked state');
});

// --- POSITIVE: appended checklists land after whatever the card already ----
// has, so its existing checklists are never touched/overwritten.

test('with no existing checklists on the target card, appending starts at sort 0', () => {
  assert.strictEqual(firstAppendSort([]), 0);
});

test('appending continues after the target card\'s own last checklist', () => {
  const existing = [
    { _id: 'existing1', sort: 0 },
    { _id: 'existing2', sort: 1 },
  ];
  assert.strictEqual(firstAppendSort(existing), 2);
});

test('existing checklists on the target are untouched by computing the append sort (negative)', () => {
  const existing = [
    { _id: 'existing1', sort: 0, title: 'Kept as-is' },
  ];
  const before = JSON.parse(JSON.stringify(existing));
  firstAppendSort(existing);
  assert.deepStrictEqual(existing, before,
    'firstAppendSort must only READ the target checklists, never mutate them');
});

console.log(`checklistTemplateCopy: ${passed} tests passed`);

})();
