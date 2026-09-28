'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { ensureRuleEmailCommand } = require('../../server/lib/syncRuleEmailCommand');
const { dispatchRuleEmail: dispatch } = require('../../server/lib/syncRuleEmailDispatch');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL, composerPath = process.env.WEKAN_TEST_MAILCOMPOSER;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_dispatch_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { activity: { _id: 'a', boardId: 'b', cardId: 'c', userId: 'u' }, effectId: 'a'.repeat(64), index: 0,
    assertCurrent: async () => {}, attempts: db.collection('attempts'), MailComposer: require(composerPath), calls: 0 };
  f.plan = await prepareRulePlan({ ...f, selectRules: async () => [{ _id: 'r', boardId: 'b', actionId: 'a', triggerId: 't' }],
    readAction: async () => ({ _id: 'a', actionType: 'sendEmail' }) });
  f.command = await ensureRuleEmailCommand({ ...f, commands: db.collection('commands'),
    prepare: async () => ({ to: 'Person <external@example.org>', from: 'sender@example.org', subject: 'Subject', text: 'Body' }) });
  f.send = async () => { f.calls++; return { accepted: ['external@example.org'] }; };
  return { f, db };
}
test('MongoDB dispatch readback recovers lost completion response and fresh connections do not resend', { skip: !uri || !composerPath }, async t => {
  const { f, db } = await fixture(t), original = f.attempts;
  assert.equal(await dispatch({ ...f, attempts: { findOne: (...args) => original.findOne(...args),
    insertOne: async row => { await original.insertOne(row); throw new Error('lost insert reply'); },
    replaceOne: async (...args) => { await original.replaceOne(...args); throw new Error('lost completion reply'); } } }), f.command.invocationId);
  const restarted = await new MongoClient(uri).connect();
  try {
    assert.equal(await dispatch({ ...f, attempts: restarted.db(db.databaseName).collection('attempts'), send: () => assert.fail('must not resend') }), f.command.invocationId);
  } finally { await restarted.close(); }
  assert.equal(await original.countDocuments({ state: 'sent' }), 1);
});
test('a persisted uncertain attempt survives connection restart without automatic resend', { skip: !uri || !composerPath }, async t => {
  const { f, db } = await fixture(t), original = f.attempts;
  await assert.rejects(dispatch({ ...f, attempts: { findOne: (...args) => original.findOne(...args),
    insertOne: row => original.insertOne(row), replaceOne: async () => ({ acknowledged: true }) } }), /completion-unconfirmed/);
  const restarted = await new MongoClient(uri).connect();
  try {
    await assert.rejects(dispatch({ ...f, attempts: restarted.db(db.databaseName).collection('attempts'), send: () => assert.fail('uncertain send repeated') }), /delivery-uncertain/);
  } finally { await restarted.close(); }
  assert.equal(f.calls, 1);
  assert.equal(await original.countDocuments({ state: 'sending' }), 1);
});
