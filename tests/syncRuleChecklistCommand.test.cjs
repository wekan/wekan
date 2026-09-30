'use strict';
// Durable rule checklist actions (server/lib/syncRuleChecklistCommand.js).
// Run: node tests/syncRuleChecklistCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const C = require('../server/lib/syncRuleChecklistCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', checklistName: 'List', ...action }) });
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane' };
  f.checklist = { _id: 'cl', title: 'List', hideAllChecklistItems: false };
  f.items = [{ _id: 'i1', title: 'One', isFinished: false }, { _id: 'i2', title: 'Two', isFinished: true }];
  f.prepare = over => C.prepareRuleChecklistCommand({ plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0,
    card: f.card, checklist: f.checklist, items: f.items, targetIds: ['i1', 'i2'], createdAt: new Date(1000), ...over });
  return f;
}
const kinds = unit => [...unit.beforeActivities, ...unit.afterActivities].map(row => row.activity.activityType);

test('checkAll follows the ordinary writes and hooks item by item', async () => {
  const f = await fixture({ actionType: 'checkAll' }), command = f.prepare();
  assert.deepEqual(command.units.map(unit => [unit.itemId, unit.before, unit.after]),
    [['i1', { isFinished: false }, { isFinished: true }], ['i2', { isFinished: true }, { isFinished: true }]]);
  // i1: now everything is finished -> completeChecklist. i2 (already checked):
  // the list was finished before -> uncompleteChecklist, then checked again and
  // complete again - the hooks fire on every write, changed or not.
  assert.deepEqual(command.units.map(kinds),
    [['checkedItem', 'completeChecklist'], ['uncompleteChecklist', 'checkedItem', 'completeChecklist']]);
  assert.deepEqual(command.units.map(unit => unit.history.rows.length), [1, 0], 'History only where isFinished changed');
  const row = command.units[0].history.rows[0];
  assert.deepEqual([row.entityType, row.entityId, row.cardId, row.group], ['checklistItem', 'i1', 'card', 'checklists']);
  assert.equal(command.units[0].afterActivities[0].activity.checklistItemName, 'One');
});

test('uncheckAll, hidden-all lists and redo go where the ordinary code puts them', async () => {
  const f = await fixture({ actionType: 'uncheckAll' });
  f.items = f.items.map(item => ({ ...item, isFinished: true }));
  const command = f.prepare({ redoRows: [] });
  assert.deepEqual(command.units.map(kinds), [['uncompleteChecklist', 'uncheckedItem'], ['uncheckedItem']]);
  const hidden = await fixture({ actionType: 'uncheckAll' }); hidden.checklist.hideAllChecklistItems = true;
  assert.deepEqual(hidden.prepare().units.map(kinds),
    [['uncompleteChecklist', 'uncheckedItem', 'completeChecklist'], ['uncompleteChecklist', 'uncheckedItem', 'completeChecklist']]);
});

test('a missing checklist or item is a saved no-op, as ordinarily', async () => {
  const f = await fixture({ actionType: 'checkItem', checkItemName: 'Nope' });
  const none = f.prepare({ checklist: null, items: [], targetIds: [] });
  assert.deepEqual(none.units, []);
  const one = f.prepare({ targetIds: ['i1'] });
  assert.deepEqual(one.units.map(kinds), [['checkedItem', 'completeChecklist']]);
});

test('tampering and inconsistent snapshots are refused (negative)', async () => {
  const f = await fixture({ actionType: 'checkAll' }), command = f.prepare();
  const context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  for (const change of [{ targetIds: ['i1'] }, { items: [f.items[0]] }, { units: command.units.slice(1) }, { cardId: 'x' }]) {
    const { checksum, ...content } = { ...command, ...change };
    assert.throws(() => C.validateRuleChecklistCommand({ ...content, checksum: sha256(canonical(content)) }, context), /command-invalid/);
  }
  assert.throws(() => f.prepare({ targetIds: ['ghost'] }), /snapshot-invalid/);
  assert.throws(() => f.prepare({ checklist: null }), /snapshot-invalid/);
  const other = await fixture({ actionType: 'addLabel' });
  assert.throws(() => other.prepare(), /sync-rule-checklist-invalid/);
  assert.deepEqual(Object.keys(C.RULE_CHECKLIST_ACTIONS), ['checkAll', 'uncheckAll', 'checkItem', 'uncheckItem']);
});
