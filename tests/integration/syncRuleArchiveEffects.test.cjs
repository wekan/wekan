'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { ensureRuleArchiveCommand } = require('../../server/lib/syncRuleArchiveCommand');
const { applyRuleArchiveEffects: apply, prepareRuleArchiveEffects, ensureRuleArchiveEffects } = require('../../server/lib/syncRuleArchiveEffects');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('stored History and activities resume after delivery interruption without duplicate card writes or events', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`archive_effects_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards'), receipts = db.collection('receipts');
  await cards.insertMany(['root', 'child'].map(_id => ({ _id, boardId: 'board', listId: 'list',
    swimlaneId: 'lane', title: _id, archived: false, ...(_id === 'child' ? { parentId: 'root', archivedAt: null } : {}) })));
  const f = { activity: { _id: 'activity', boardId: 'board', cardId: 'root', userId: 'actor' },
    effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {}, assertCard: async () => {} };
  f.plan = await prepareRulePlan({ ...f,
    selectRules: async () => [{ _id: 'rule', boardId: 'board', triggerId: 'trigger', actionId: 'action' }],
    readAction: async () => ({ _id: 'action', actionType: 'archive' }) });
  f.command = await ensureRuleArchiveCommand({ ...f, commands: db.collection('commands'),
    readCard: id => cards.findOne({ _id: id }), readChildren: id => cards.find({ parentId: id }).toArray(),
    now: () => new Date(1000) });
  f.policy = { activities: true, notifications: false };
  const prepared = prepareRuleArchiveEffects({ ...f, username: 'Actor', lists: [{ _id: 'list', boardId: 'board', title: 'Saved list' }] });
  f.effects = await ensureRuleArchiveEffects({ ...f, effects: db.collection('effects'), build: async () => prepared });
  const collectionAdapter = collection => ({ admitHistoryWriter: ({ work }) => work({ assertCurrent: async () => {} }),
    findOneAsync: selector => collection.findOne(typeof selector === 'string' ? { _id: selector } : selector),
    insertAsync: async row => { await collection.insertOne(row); return row._id; },
    updateAsync: async (selector, modifier) => (await collection.updateOne(selector, modifier)).modifiedCount });
  f.history = collectionAdapter(db.collection('history'));
  f.activities = collectionAdapter(db.collection('activities')); f.readPolicy = async () => f.policy;
  const writes = [], delivered = [];
  const wrap = collection => ({ findOne: (...args) => collection.findOne(...args),
    updateOne: async (selector, modifier) => {
      const result = await collection.updateOne(selector, modifier);
      if (result.modifiedCount) writes.push(selector._id);
      throw Error('lost write reply');
    } });
  f.cards = wrap(cards); f.receipts = receipts;
  f.completeDelivery = async () => { throw Error('interrupted effects'); };
  await assert.rejects(apply(f), /interrupted effects/);
  assert.deepEqual(writes, ['child']); assert.equal(await receipts.countDocuments({}), 0);
  assert.equal((await cards.findOne({ _id: 'root' })).archived, false);
  assert.equal(await db.collection('history').countDocuments({}), 1);
  assert.equal(await db.collection('activities').countDocuments({}), 1);
  const restarted = await new MongoClient(uri).connect();
  try {
    const next = restarted.db(db.databaseName);
    f.cards = wrap(next.collection('cards')); f.receipts = next.collection('receipts');
    f.history = collectionAdapter(next.collection('history')); f.activities = collectionAdapter(next.collection('activities'));
    f.effects = await ensureRuleArchiveEffects({ ...f, effects: next.collection('effects'), build: () => assert.fail('must not rebuild') });
    f.completeDelivery = async ({ activity, effectId }) => { delivered.push(activity.cardId); return effectId; };
    assert.equal(await apply(f), f.command.invocationId);
    assert.deepEqual(writes, ['child', 'root']); assert.deepEqual(delivered, ['child', 'root']);
    await apply(f); assert.equal(writes.length, 2); assert.equal(delivered.length, 2);
    assert.equal(await receipts.countDocuments({}), 3);
    assert.equal(await db.collection('history').countDocuments({}), 2);
    assert.equal(await db.collection('activities').countDocuments({}), 2);
    assert.equal(await db.collection('activities').countDocuments({ listName: 'Saved list' }), 2);
    const rows = await db.collection('history').find({}).sort({ cardId: 1 }).toArray();
    assert.equal(rows[1].previousHash, rows[0].integrityHash);
    assert.equal(await cards.countDocuments({ archived: true, archivedAt: new Date(1000) }), 2);
  } finally { await restarted.close(); }
});
