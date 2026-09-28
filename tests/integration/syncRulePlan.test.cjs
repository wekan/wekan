'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan, ensureRulePlan: ensure, planId } = require('../../server/lib/syncRulePlan');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`sync_rules_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { plans: db.collection('plans'), activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), assertCurrent: async () => {} };
  f.build = activity => prepareRulePlan({ ...f, activity,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'addLabel', labelId: 'original' }) });
  return f;
}
test('stored selection survives changed configuration and an empty selection cannot acquire new rules', { skip: !uri }, async t => {
  const f = await fixture(t), original = await ensure(f);
  assert.deepEqual(await ensure({ ...f, build: () => assert.fail('must reuse saved selection') }), original);
  const other = { ...f, effectId: 'b'.repeat(64) };
  other.build = activity => prepareRulePlan({ ...other, activity, selectRules: async () => [], readAction: () => assert.fail() });
  const empty = await ensure(other);
  assert.deepEqual(await ensure({ ...other, build: () => assert.fail('saved no-op cannot select newly added rules') }), empty);
});
test('uncertain writes reconcile but false acknowledgements and corrupt storage cannot complete', { skip: !uri }, async t => {
  const f = await fixture(t);
  const plans = { findOne: (...args) => f.plans.findOne(...args), insertOne: async () => ({ acknowledged: true }) };
  await assert.rejects(ensure({ ...f, plans }), /unconfirmed/);
  plans.insertOne = async (...args) => { await f.plans.insertOne(...args); throw new Error('lost reply'); };
  assert.equal((await ensure({ ...f, plans })).actions.length, 1);
  await f.plans.updateOne({ _id: planId(f.effectId, f.activity._id) }, { $set: { 'plan.actions.0.action.labelId': 'tampered' } });
  await assert.rejects(ensure(f), /plan-invalid/);
});
test('concurrent first builders agree on one persisted selection and bind the original activity and actor', { skip: !uri }, async t => {
  const f = await fixture(t);
  const [first, second] = await Promise.all([ensure(f), ensure({ ...f, build: async activity => {
    const candidate = await f.build(activity); candidate.actions[0].action.labelId = 'other'; return candidate;
  } })]);
  assert.deepEqual(first, second);
  assert.equal(await f.plans.countDocuments({}), 1);
  await assert.rejects(ensure({ ...f, activity: { ...f.activity, userId: 'other' } }), /plan-invalid/);
  await assert.rejects(ensure({ ...f, activity: { ...f.activity, cardId: 'other' } }), /plan-invalid/);
});
