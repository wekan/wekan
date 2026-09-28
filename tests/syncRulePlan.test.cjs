'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan: prepare, validateRulePlan: validate } = require('../server/lib/syncRulePlan');
const activity = { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' }, effectId = 'a'.repeat(64);
const rule = { _id: 'rule', boardId: 'board', actionId: 'action', triggerId: 'trigger', enabled: true };
const action = { _id: 'action', actionType: 'moveCard', boardId: 'destination' };
const options = { activity, effectId, assertCurrent: async () => {}, selectRules: async () => [rule], readAction: async () => action };
test('selection order, duplicate invocations and absent actions are captured before mutation', async () => {
  const selected = [{ ...rule }, { ...rule }, { ...rule, _id: 'missing', actionId: 'absent' }];
  const plan = await prepare({ ...options, selectRules: async () => selected, readAction: async id => {
    selected[1]._id = 'changed'; return id === 'absent' ? undefined : action;
  } });
  assert.deepEqual(plan.actions.map(row => row.rule._id), ['rule', 'rule', 'missing']);
  assert.equal(new Set(plan.actions.map(row => row.id)).size, 3);
  assert.equal(plan.actions[2].action, null);
  assert.equal(plan.actions[0].action.boardId, 'destination');
  plan.actions[0].action.actionType = 'modified'; assert.equal(action.actionType, 'moveCard');
});
test('foreign, disabled, malformed, oversized and mismatched selections cannot become plans', async () => {
  for (const bad of [{ ...rule, boardId: 'foreign' }, { ...rule, enabled: false }, { ...rule, triggerId: '' }]) {
    await assert.rejects(prepare({ ...options, selectRules: async () => [bad] }), /plan-invalid/);
  }
  await assert.rejects(prepare({ ...options, selectRules: async () => Array(1001).fill(rule) }), /plan-invalid/);
  await assert.rejects(prepare({ ...options, readAction: async () => ({ ...action, _id: 'other' }) }), /plan-invalid/);
  await assert.rejects(prepare({ ...options, readAction: async () => ({ ...action, body: 'x'.repeat(15 * 1024 * 1024) }) }), /plan-invalid/);
  const plan = await prepare(options);
  assert.throws(() => validate(plan, { ...activity, userId: 'other' }, effectId));
  assert.throws(() => validate(plan, activity, 'b'.repeat(64)));
});
test('empty selection is explicit and ownership loss prevents accepting preparation', async () => {
  assert.deepEqual((await prepare({ ...options, selectRules: async () => [] })).actions, []);
  let checks = 0;
  await assert.rejects(prepare({ ...options, assertCurrent: async () => { if (++checks === 2) throw new Error('lease lost'); } }), /lease lost/);
});
