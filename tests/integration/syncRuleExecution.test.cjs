'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { executeRulePlan: execute } = require('../../server/lib/syncRuleExecution');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('MongoDB rule checkpoints survive lost replies and a fresh coordinator resumes remaining actions', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_execution_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f, selectRules: async () => ['a', 'b'].map(_id => ({ _id, boardId: 'board', actionId: _id, triggerId: 'trigger' })),
    readAction: async _id => ({ _id, actionType: _id }) });
  const receipts = db.collection('receipts'), calls = [];
  const adapters = { a: async ({ invocation }) => { calls.push('a'); return invocation.id; },
    b: async () => { throw new Error('interrupted'); } };
  await assert.rejects(execute({ ...f, adapters, receipts: {
    findOne: (...args) => receipts.findOne(...args),
    insertOne: async row => { await receipts.insertOne(row); throw new Error('lost reply'); },
  } }), /interrupted/);
  assert.equal(await receipts.countDocuments({}), 1);
  // A fresh connection has no in-memory knowledge of the first dispatch.
  const restarted = await new MongoClient(uri).connect();
  try {
    assert.equal(await execute({ ...f, receipts: restarted.db(db.databaseName).collection('receipts'), adapters: {
      a: () => assert.fail('confirmed action repeated'),
      b: async ({ invocation }) => { calls.push('b'); return invocation.id; },
    } }), f.effectId);
  } finally { await restarted.close(); }
  assert.deepEqual(calls, ['a', 'b']);
  assert.equal(await receipts.countDocuments({}), 3);
  assert.equal(await execute({ ...f, receipts, adapters: {} }), f.effectId);
  await receipts.updateOne({ _id: f.plan.actions[1].id }, { $set: { checksum: 'corrupt' } });
  await assert.rejects(execute({ ...f, receipts, adapters }), /receipt-invalid/);
});
