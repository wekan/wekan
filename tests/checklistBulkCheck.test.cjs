'use strict';
(async () => {

// Unit + negative tests for GitHub issue #2473: a "check all" / "uncheck
// all" bulk action on a checklist's action menu (client/components/cards/
// checklists.jade's .js-check-all-checklist-items / .js-uncheck-all-
// checklist-items, wired in checklists.js to Checklists.checkAllItems() /
// uncheckAllItems() in models/checklists.js).
// Run: node tests/checklistBulkCheck.test.cjs

const assert = require('assert');
const {
  selectBulkCheckItemIds,
  applyBulkCheck,
} = await import('../models/lib/checklistBulkCheck.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const items = [
  { _id: 'a1', checklistId: 'checklist-1', isFinished: false },
  { _id: 'a2', checklistId: 'checklist-1', isFinished: true },
  { _id: 'a3', checklistId: 'checklist-1', isFinished: false },
  { _id: 'b1', checklistId: 'checklist-2', isFinished: false },
  { _id: 'b2', checklistId: 'checklist-2', isFinished: true },
];

check('#2473: selectBulkCheckItemIds only returns the target checklist\'s items', () => {
  assert.deepStrictEqual(selectBulkCheckItemIds(items, 'checklist-1'), ['a1', 'a2', 'a3']);
  assert.deepStrictEqual(selectBulkCheckItemIds(items, 'checklist-2'), ['b1', 'b2']);
});

check('#2473: "check all" sets every item of the checklist to isFinished:true, regardless of starting state', () => {
  const result = applyBulkCheck(items, 'checklist-1', true);
  const targeted = result.filter(i => i.checklistId === 'checklist-1');
  assert.strictEqual(targeted.length, 3);
  assert.ok(targeted.every(i => i.isFinished === true),
    'every item of checklist-1 must end up finished, including the one that started finished');
});

check('#2473: "uncheck all" sets every item of the checklist to isFinished:false, regardless of starting state', () => {
  const result = applyBulkCheck(items, 'checklist-1', false);
  const targeted = result.filter(i => i.checklistId === 'checklist-1');
  assert.strictEqual(targeted.length, 3);
  assert.ok(targeted.every(i => i.isFinished === false),
    'every item of checklist-1 must end up unfinished, including the one that started unfinished');
});

check('#2473 negative: items belonging to a DIFFERENT checklist on the same card are untouched', () => {
  const result = applyBulkCheck(items, 'checklist-1', true);
  const other = result.filter(i => i.checklistId === 'checklist-2');
  assert.deepStrictEqual(other, [
    { _id: 'b1', checklistId: 'checklist-2', isFinished: false },
    { _id: 'b2', checklistId: 'checklist-2', isFinished: true },
  ], 'checklist-2 items must keep their original isFinished values untouched');
});

check('#2473 negative: an empty or missing checklistId selects nothing', () => {
  assert.deepStrictEqual(selectBulkCheckItemIds(items, ''), []);
  assert.deepStrictEqual(selectBulkCheckItemIds(items, undefined), []);
  assert.deepStrictEqual(selectBulkCheckItemIds([], 'checklist-1'), []);
  assert.deepStrictEqual(selectBulkCheckItemIds(null, 'checklist-1'), []);
});

check('#2473: the two new action labels exist in en.i18n.json and are real i18n keys, not placeholders', () => {
  const en = require('../imports/i18n/data/en.i18n.json');
  assert.strictEqual(en.checkAllItems, 'Check all items');
  assert.strictEqual(en.uncheckAllItems, 'Uncheck all items');
});

check('#2473: the checklist actions popup wires up both bulk actions', () => {
  const fs = require('fs');
  const jade = fs.readFileSync(
    require('path').join(__dirname, '../client/components/cards/checklists.jade'),
    'utf8',
  );
  assert.ok(jade.includes('js-check-all-checklist-items'), 'the check-all action class is present');
  assert.ok(jade.includes('js-uncheck-all-checklist-items'), 'the uncheck-all action class is present');
  assert.ok(jade.includes("{{_ \"checkAllItems\"}}"), 'the check-all label is rendered');
  assert.ok(jade.includes("{{_ \"uncheckAllItems\"}}"), 'the uncheck-all label is rendered');

  const js = fs.readFileSync(
    require('path').join(__dirname, '../client/components/cards/checklists.js'),
    'utf8',
  );
  assert.ok(js.includes("'click .js-check-all-checklist-items'"), 'the check-all click handler is registered');
  assert.ok(js.includes("'click .js-uncheck-all-checklist-items'"), 'the uncheck-all click handler is registered');
  assert.ok(js.includes('checklist.checkAllItems()'), 'the check-all handler calls checkAllItems()');
  assert.ok(js.includes('checklist.uncheckAllItems()'), 'the uncheck-all handler calls uncheckAllItems()');
});

console.log(`\nchecklistBulkCheck: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exitCode = 1; });
