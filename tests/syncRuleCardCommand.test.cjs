'use strict';
// Durable rule card-field actions (server/lib/syncRuleCardCommand.js).
// Run: node tests/syncRuleCardCommand.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan } = require('../server/lib/syncRulePlan');
const C = require('../server/lib/syncRuleCardCommand');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');

async function fixture(action) {
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', boardId: 'board', ...action }) });
  f.card = { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'T', labelIds: ['old'], color: 'red',
    dueComplete: false };
  f.prepare = over => C.prepareRuleCardCommand({ plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0,
    card: f.card, createdAt: new Date(1000), ...over });
  return f;
}

test('each action changes exactly its field, as the ordinary action would', async () => {
  const cases = [
    [{ actionType: 'addLabel', labelId: 'new' }, { labelIds: ['old', 'new'] }],
    [{ actionType: 'addLabel', labelId: 'old' }, { labelIds: ['old'] }],
    [{ actionType: 'removeLabel', labelId: 'old' }, { labelIds: [] }],
    [{ actionType: 'removeAllLabels' }, { labelIds: [] }],
    [{ actionType: 'setColor', selectedColor: 'green' }, { color: 'green' }],
    [{ actionType: 'setColor', selectedColor: 'white' }, { color: null }],
    [{ actionType: 'markCardComplete' }, { dueComplete: true }],
    [{ actionType: 'markCardIncomplete' }, { dueComplete: false }],
  ];
  for (const [action, after] of cases) {
    const f = await fixture(action), command = f.prepare();
    assert.deepEqual(command.after, after, action.actionType);
    assert.equal(command._id, C.commandId(f.plan.actions[0].id));
    assert.deepEqual(C.validateRuleCardCommand(command, { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 }), command);
  }
});

test('History records the changed field; label activities only when the label really changed', async () => {
  const added = (await fixture({ actionType: 'addLabel', labelId: 'new' })).prepare();
  assert.deepEqual(added.effects.history.rows.map(row => [row.group, row.newContent.field]), [['labels', 'labelIds']]);
  assert.deepEqual(added.effects.activities.map(row => [row.activity.activityType, row.activity.labelId]), [['addedLabel', 'new']]);
  const removed = (await fixture({ actionType: 'removeLabel', labelId: 'old' })).prepare();
  assert.deepEqual(removed.effects.activities.map(row => row.activity.activityType), ['removedLabel']);
  const same = (await fixture({ actionType: 'addLabel', labelId: 'old' })).prepare();
  assert.deepEqual([same.effects.history.rows.length, same.effects.activities.length], [0, 0], 'nothing changed, nothing recorded');
  // The ordinary removeAllLabels writes $set, which records no removedLabel activity.
  const cleared = (await fixture({ actionType: 'removeAllLabels' })).prepare();
  assert.deepEqual([cleared.effects.history.rows.length, cleared.effects.activities.length], [1, 0]);
  const colour = (await fixture({ actionType: 'setColor', selectedColor: 'blue' })).prepare();
  assert.equal(colour.effects.history.rows[0].group, 'title');
});

test('a missing field stays missing on removeLabel, and selectors tell absent from null', async () => {
  const f = await fixture({ actionType: 'removeLabel', labelId: 'x' });
  delete f.card.labelIds;
  const command = f.prepare();
  assert.deepEqual([command.before, command.after], [{}, {}]);
  assert.deepEqual(C.fieldSelector(command, command.before), { _id: 'card', boardId: 'board', labelIds: { $exists: false } });
  const g = await fixture({ actionType: 'addLabel', labelId: 'x' });
  const added = g.prepare();
  assert.deepEqual(C.fieldSelector(added, added.after).labelIds, { $eq: ['old', 'x'] });
});

test('tampering, linked cards and other action types are refused (negative)', async () => {
  const f = await fixture({ actionType: 'addLabel', labelId: 'new' }), command = f.prepare();
  const context = { plan: f.plan, activity: f.activity, effectId: f.effectId, index: 0 };
  for (const change of [{ after: { labelIds: ['evil'] } }, { cardId: 'other' }, { field: 'color' }, { extra: 1 }]) {
    const tampered = { ...command, ...change };
    const { checksum, ...content } = tampered;
    assert.throws(() => C.validateRuleCardCommand({ ...tampered, checksum: sha256(canonical(content)) }, context), /command-invalid/);
  }
  assert.throws(() => C.validateRuleCardCommand({ ...command, checksum: 'f'.repeat(64) }, context), /command-invalid/);
  assert.throws(() => f.prepare({ card: { ...f.card, type: 'cardType-linkedCard' } }), /card-invalid/);
  assert.throws(() => f.prepare({ card: { ...f.card, boardId: 'other' } }), /card-invalid/);
  const other = await fixture({ actionType: 'moveCardToTop' });
  assert.throws(() => other.prepare(), /sync-rule-card-invalid/);
  assert.deepEqual(Object.keys(C.RULE_CARD_ACTIONS).sort(),
    ['addLabel', 'markCardComplete', 'markCardIncomplete', 'removeAllLabels', 'removeLabel', 'setColor']);
});
