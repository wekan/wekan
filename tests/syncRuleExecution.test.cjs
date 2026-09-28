'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareRulePlan, planId } = require('../server/lib/syncRulePlan');
const { executeRulePlan: execute } = require('../server/lib/syncRuleExecution');
async function fixture(types = ['first', 'second']) {
  const activity = { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' }, effectId = 'a'.repeat(64);
  const assertCurrent = async () => {};
  const plan = await prepareRulePlan({ activity, effectId, assertCurrent,
    selectRules: async () => types.map((type, i) => ({ _id: `rule${i}`, boardId: 'board', triggerId: 'trigger', actionId: String(i) })),
    readAction: async id => types[Number(id)] === null ? null : { _id: id, actionType: types[Number(id)] } });
  const rows = new Map(), calls = [];
  const receipts = { findOne: async ({ _id }) => structuredClone(rows.get(_id)),
    insertOne: async row => { if (rows.has(row._id)) throw new Error('duplicate'); rows.set(row._id, structuredClone(row)); } };
  const adapters = Object.fromEntries(types.filter(Boolean).map(type => [type, async ({ invocation }) => { calls.push(invocation.id); return invocation.id; }]));
  return { activity, effectId, plan, assertCurrent, receipts, adapters, rows, calls };
}
test('ordered checkpoints resume without repeating confirmed actions, including duplicate types', async () => {
  const f = await fixture(['first', 'second', 'first']);
  f.adapters.second = async () => { throw new Error('interrupted'); };
  await assert.rejects(execute(f), /interrupted/);
  assert.deepEqual(f.calls, [f.plan.actions[0].id]);
  assert.equal(f.rows.size, 1);
  f.adapters.second = async ({ invocation }) => { f.calls.push(invocation.id); return invocation.id; };
  assert.equal(await execute(f), f.effectId);
  assert.deepEqual(f.calls, f.plan.actions.map(row => row.id));
  assert.equal(await execute({ ...f, adapters: {} }), f.effectId);
  assert.equal(f.rows.size, 4);
});
test('empty and missing-action selections persist explicit receipts without adapters', async () => {
  for (const types of [[], [null]]) {
    const f = await fixture(types);
    assert.equal(await execute({ ...f, adapters: {} }), f.effectId);
    assert.equal(f.rows.size, types.length + 1);
  }
});
test('preflight rejects unsupported actions and corrupted later receipts before any dispatch', async () => {
  const f = await fixture(); delete f.adapters.second;
  await assert.rejects(execute(f), /adapter-required/);
  assert.deepEqual(f.calls, []);
  f.rows.set(f.plan.actions[1].id, { _id: f.plan.actions[1].id });
  await assert.rejects(execute(f), /receipt-invalid/);
  assert.deepEqual(f.calls, []);
});
test('false action acknowledgements and lost ownership cannot create completion receipts', async () => {
  for (const ack of [undefined, true, 'wrong']) {
    const f = await fixture(); f.adapters.first = async () => ack;
    await assert.rejects(execute(f), /action-unconfirmed/); assert.equal(f.rows.size, 0);
  }
  const f = await fixture(); let current = true;
  f.assertCurrent = async () => { if (!current) throw new Error('lease lost'); };
  f.adapters.first = async ({ invocation }) => { current = false; return invocation.id; };
  await assert.rejects(execute(f), /lease lost/); assert.equal(f.rows.size, 0);
});
test('lost receipt replies reconcile; false writes require adapter-owned idempotent replay', async () => {
  const f = await fixture(['first']), insert = f.receipts.insertOne;
  f.receipts.insertOne = async row => { await insert(row); throw new Error('reply lost'); };
  assert.equal(await execute(f), f.effectId);
  const other = await fixture(['first']); other.receipts.insertOne = async () => ({ acknowledged: true });
  await assert.rejects(execute(other), /receipt-unconfirmed/);
  assert.equal(other.rows.size, 0);
});
test('receipt identity binds the whole plan and aggregate completion requires every invocation', async () => {
  const f = await fixture(); await execute(f);
  f.plan.actions[0].action.extra = 'changed';
  await assert.rejects(execute(f), /receipt-invalid/);
  delete f.plan.actions[0].action.extra;
  f.rows.delete(f.plan.actions[0].id);
  await assert.rejects(execute(f), /receipt-incomplete/);
  assert.ok(f.rows.has(planId(f.effectId, f.activity._id)));
});
test('adapter mutations cannot rewrite captured action identities or sibling inputs', async () => {
  const f = await fixture();
  f.adapters.first = async ({ invocation, activity }) => { const id = invocation.id; invocation.id = 'changed'; activity.cardId = 'other'; return id; };
  f.adapters.second = async ({ invocation, activity }) => { assert.equal(activity.cardId, 'card'); return invocation.id; };
  assert.equal(await execute(f), f.effectId);
  assert.notEqual(f.plan.actions[0].id, 'changed');
});

test('a receipt gap cannot replay a missing earlier invocation', async () => {
  const f = await fixture(); await execute(f);
  f.rows.delete(planId(f.effectId, f.activity._id));
  f.rows.delete(f.plan.actions[0].id);
  f.calls.length = 0;
  await assert.rejects(execute(f), /receipt-incomplete/);
  assert.deepEqual(f.calls, []);
});
