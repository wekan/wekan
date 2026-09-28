'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { ensureRuleEmailCommand: ensure } = require('../../server/lib/syncRuleEmailCommand');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_mail_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { commands: db.collection('commands'), activity: { _id: 'activity', boardId: 'board', cardId: 'card', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'sendEmail' }) });
  f.prepare = async () => ({ to: 'external@example.org', from: 'wekan@example.org', subject: 'Subject', text: 'Body', html: '<p>Body</p>', replyTo: 'reply@example.org' });
  return { f, db };
}
test('competing command builders converge on the first persisted recipient and content', { skip: !uri }, async t => {
  const { f } = await fixture(t);
  const [a, b] = await Promise.all([ensure(f), ensure({ ...f,
    prepare: async () => ({ ...await f.prepare(), to: 'other@example.org', text: 'Other body' }) })]);
  assert.deepEqual(a, b);
  assert.equal(await f.commands.countDocuments({}), 1);
});
test('lost insert replies survive a fresh connection; corrupt content never becomes a command', { skip: !uri }, async t => {
  const { f, db } = await fixture(t);
  const saved = await ensure({ ...f, commands: { findOne: (...args) => f.commands.findOne(...args),
    insertOne: async row => { await f.commands.insertOne(row); throw new Error('lost reply'); } } });
  const restarted = await new MongoClient(uri).connect();
  try {
    assert.deepEqual(await ensure({ ...f, commands: restarted.db(db.databaseName).collection('commands'),
      prepare: () => assert.fail('a persisted command must not be rebuilt') }), saved);
  } finally { await restarted.close(); }
  await f.commands.updateOne({ _id: saved._id }, { $set: { 'mail.text': 'tampered' } });
  await assert.rejects(ensure(f), /command-invalid/);
});
