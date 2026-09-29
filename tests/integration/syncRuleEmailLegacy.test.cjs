'use strict';
// Legacy rule email review on a real MongoDB: the list query finds unbound
// commands, skips ones already attempted, and a discard is final.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const L = require('../../server/lib/syncRuleEmailLegacy');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('list, skip attempted, discard once', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_legacy_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { commands: db.collection('commands'), plans: db.collection('plans'), attempts: db.collection('attempts'),
    resolutions: db.collection('resolutions'), operator: 'admin' };
  const plan = { version: 1, actions: [{ id: 'i'.repeat(64), rule: { _id: 'r' }, action: { _id: 'a', actionType: 'sendEmail' } }] };
  await f.plans.insertOne({ _id: 'p', plan, checksum: sha256(canonical(plan)) });
  const command = (id, extra = {}) => ({ _id: id, version: 1, planId: 'p', invocationId: 'i'.repeat(64), boardId: 'b', cardId: 'c',
    checksum: 'c'.repeat(64), mail: { to: 'x@example.org', from: 'w@example.org', subject: 'S', text: 'secret body' }, ...extra });
  await f.commands.insertMany([command('1'.repeat(64)), command('2'.repeat(64)),
    command('3'.repeat(64), { version: 2, sourceBinding: { version: 5 } })]);
  await f.attempts.insertOne({ _id: '2'.repeat(64), state: 'sending' });
  const list = await L.listLegacyRuleEmailCommands(f);
  assert.deepEqual(list.rows.map(row => row.commandId), ['1'.repeat(64)]);
  assert.ok(!JSON.stringify(list).includes('secret body'), 'the body is not listed');
  await L.discardLegacyRuleEmailCommand({ ...f, commandId: '1'.repeat(64) });
  assert.equal((await f.attempts.findOne({ _id: '1'.repeat(64) })).state, 'dropped');
  await assert.rejects(L.discardLegacyRuleEmailCommand({ ...f, commandId: '1'.repeat(64) }), /attempt-exists/);
  assert.equal(await f.resolutions.countDocuments({ decision: 'legacy-discard' }), 1);
  assert.equal((await L.listLegacyRuleEmailCommands(f)).total, 0);
});
