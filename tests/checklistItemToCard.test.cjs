'use strict';
(async () => {

// Unit + negative tests for GitHub issue #3294: dragging a checklist item
// out of its checklist and dropping it onto a list creates a new card
// titled from the item's text, in that list, WITHOUT touching the original
// checklist item.
// Run: node tests/checklistItemToCard.test.cjs

const assert = require('assert');
const {
  buildCardFromChecklistItem,
} = await import('../models/lib/checklistItemToCard.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const item = { _id: 'item1', title: 'Buy milk', isFinished: false };
const list = { _id: 'list1', boardId: 'board1', swimlaneId: 'swimlane1' };

// ── buildCardFromChecklistItem ──────────────────────────────────────────────

check('#3294: title matches the checklist item text', () => {
  const doc = buildCardFromChecklistItem(item, list, 'swimlane1', 5);
  assert.strictEqual(doc.title, 'Buy milk');
});

check('#3294: lands in the target list and its board', () => {
  const doc = buildCardFromChecklistItem(item, list, 'swimlane1', 5);
  assert.strictEqual(doc.listId, 'list1');
  assert.strictEqual(doc.boardId, 'board1');
});

check('#3294: carries the given sort position', () => {
  const doc = buildCardFromChecklistItem(item, list, 'swimlane1', 5);
  assert.strictEqual(doc.sort, 5);
});

check('#3294: uses the passed swimlaneId over the list default when given', () => {
  const doc = buildCardFromChecklistItem(item, list, 'otherSwimlane', 0);
  assert.strictEqual(doc.swimlaneId, 'otherSwimlane');
});

check('falls back to the list\'s own swimlaneId when none is given', () => {
  const doc = buildCardFromChecklistItem(item, list, undefined, 0);
  assert.strictEqual(doc.swimlaneId, 'swimlane1');
});

check('a missing/NaN sort defaults to 0', () => {
  const doc = buildCardFromChecklistItem(item, list, 'swimlane1', NaN);
  assert.strictEqual(doc.sort, 0);
  const doc2 = buildCardFromChecklistItem(item, list, 'swimlane1');
  assert.strictEqual(doc2.sort, 0);
});

check('#3294: does not mutate or return the original item', () => {
  const before = JSON.stringify(item);
  const doc = buildCardFromChecklistItem(item, list, 'swimlane1', 0);
  assert.strictEqual(JSON.stringify(item), before);
  assert.notStrictEqual(doc, item);
  assert.strictEqual(doc.isFinished, undefined);
  assert.strictEqual(doc._id, undefined);
});

// ── negative cases ──────────────────────────────────────────────────────────

check('(negative) no item returns null', () => {
  assert.strictEqual(buildCardFromChecklistItem(null, list, 'swimlane1', 0), null);
});

check('(negative) an item with a blank/whitespace-only title returns null', () => {
  assert.strictEqual(buildCardFromChecklistItem({ title: '   ' }, list, 'swimlane1', 0), null);
  assert.strictEqual(buildCardFromChecklistItem({ title: '' }, list, 'swimlane1', 0), null);
});

check('(negative) no target list returns null', () => {
  assert.strictEqual(buildCardFromChecklistItem(item, null, 'swimlane1', 0), null);
  assert.strictEqual(buildCardFromChecklistItem(item, {}, 'swimlane1', 0), null);
  assert.strictEqual(buildCardFromChecklistItem(item, { _id: 'list1' }, 'swimlane1', 0), null);
});

// ── source guard: checklists.js wires the drop into this pure function,
// and creates a card rather than guessing "Done" from the target list ─────
check('checklists.js\'s checklist-item drag handler uses buildCardFromChecklistItem on drop, and never inspects the target list\'s title/name to decide "Done"', () => {
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'client', 'components', 'cards', 'checklists.js'),
    'utf8',
  );
  assert.ok(/buildCardFromChecklistItem\(/.test(src),
    'the checklist-item sortable stop handler must build the new card via buildCardFromChecklistItem');
  assert.ok(/Cards\.insert\(cardDoc\)/.test(src),
    'the drop handler must actually insert the built card document');
  assert.ok(!/dropTarget\.list\.title/.test(src) && !/list\.title\.toLowerCase\(\).*done/i.test(src),
    'must not guess a "Done" list from its title - see the #3294 scope decision');
});

console.log(`\nchecklistItemToCard: ${passed} checks passed`);

})().catch(e => { console.error(e); process.exit(1); });
