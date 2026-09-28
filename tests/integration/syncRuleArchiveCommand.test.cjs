'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { ensureRuleArchiveCommand: ensure } = require('../../server/lib/syncRuleArchiveCommand');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('concurrent cascade capture converges and survives fresh-connection replay after child changes', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_archive_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards'), commands = db.collection('commands');
  await cards.insertMany(['root', 'child'].map(_id => ({ _id, boardId: 'board', listId: 'list',
    swimlaneId: 'swimlane', title: _id, archived: false, ...(_id === 'child' ? { parentId: 'root' } : {}) })));
  const f = { commands, activity: { _id: 'activity', boardId: 'board', cardId: 'root', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {}, assertCard: async () => {},
    readCard: id => cards.findOne({ _id: id }), readChildren: id => cards.find({ parentId: id }).toArray() };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'archive' }) });
  const uncertain = { findOne: (...args) => commands.findOne(...args),
    insertOne: async row => { await commands.insertOne(row); throw Error('lost reply'); } };
  const [a, b] = await Promise.all([ensure({ ...f, commands: uncertain }), ensure(f)]);
  assert.deepEqual(a, b); assert.equal(await commands.countDocuments({}), 1);
  assert.deepEqual(a.cards.map(card => card._id), ['child', 'root']);
  await cards.deleteOne({ _id: 'child' });
  const restarted = await new MongoClient(uri).connect();
  try {
    assert.deepEqual(await ensure({ ...f, commands: restarted.db(db.databaseName).collection('commands'),
      readCard: () => assert.fail('must not rebuild') }), a);
  } finally { await restarted.close(); }
  assert.equal((await cards.findOne({ _id: 'root' })).archived, false);
  await commands.updateOne({ _id: a._id }, { $set: { 'cards.0.parentId': 'other' } });
  await assert.rejects(ensure(f), /command-invalid/);
});
