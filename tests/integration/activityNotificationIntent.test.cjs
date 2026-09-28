'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { ensureActivityNotificationIntent: ensure, persistActivityWithNotificationIntent: persist,
  readActivityForNotificationIntent: recover } = require('../../server/lib/activityNotificationIntent');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`activity_intent_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { intents: db.collection('intents'), activities: db.collection('activities'), assertCurrent: async () => {},
    activity: { _id: 'event', activityType: 'createCard', userId: 'actor', boardId: 'board', cardId: 'card',
      createdAt: new Date('2026-01-01'), modifiedAt: new Date('2026-01-01') } };
  f.insert = activity => f.activities.insertOne(activity);
  return f;
}
test('intent is durable before activity insertion; lost acknowledgements reconcile without duplicates', { skip: !uri }, async t => {
  const f = await fixture(t);
  const intents = { findOne: (...args) => f.intents.findOne(...args), insertOne: async row => {
    await f.intents.insertOne(row); throw new Error('lost intent reply');
  } };
  const row = await persist({ ...f, intents, insert: async activity => {
    assert.equal(await f.intents.countDocuments({ state: 'pending' }), 1);
    await f.activities.insertOne(activity); throw new Error('lost activity reply');
  } });
  assert.deepEqual(await recover({ ...f, intentId: row._id }), f.activity);
  await assert.rejects(recover({ ...f, intentId: row._id, expectedDispatchUserId: 'other' }), /intent-invalid/);
  await assert.rejects(recover({ ...f, intentId: row._id, expectedActivity: { ...f.activity, userId: 'other' } }), /intent-invalid/);
  await persist({ ...f, insert: () => assert.fail('replay must not insert twice') });
  assert.equal(await f.intents.countDocuments({}), 1);
  assert.equal(await f.activities.countDocuments({}), 1);
});
test('failure to persist intent prevents activity insertion; cancellation leaves a recoverable orphan', { skip: !uri }, async t => {
  const f = await fixture(t);
  await assert.rejects(persist({ ...f, intents: { findOne: async () => null, insertOne: async () => { throw new Error('storage failed'); } },
    insert: () => assert.fail('must not write without durable intent') }), /storage failed/);
  await assert.rejects(persist({ ...f, insert: async () => false }), /activity-unconfirmed/);
  const row = await f.intents.findOne({});
  await assert.rejects(recover({ ...f, intentId: row._id }), /activity-unconfirmed/);
  assert.equal(await f.activities.countDocuments({}), 0);
  await assert.rejects(persist({ ...f, insert: () => assert.fail('orphan replay cannot recreate') }), /activity-unconfirmed/);
});
test('changed identity, damaged intent, deleted activity and lost ownership cannot authorize recovery', { skip: !uri }, async t => {
  const f = await fixture(t), row = await persist(f);
  await assert.rejects(ensure({ ...f, activity: { ...f.activity, userId: 'other' } }), /intent-invalid/);
  await f.activities.updateOne({ _id: 'event' }, { $set: { activityType: 'different' } });
  await assert.rejects(recover({ ...f, intentId: row._id }), /activity-unconfirmed/);
  await f.activities.deleteOne({ _id: 'event' });
  await assert.rejects(recover({ ...f, intentId: row._id }), /activity-unconfirmed/);
  await f.intents.updateOne({ _id: row._id }, { $set: { activityHash: 'wrong' } });
  await assert.rejects(recover({ ...f, intentId: row._id }), /intent-invalid/);
  await assert.rejects(ensure({ ...f, assertCurrent: async () => { throw new Error('ownership lost'); } }), /ownership lost/);
});
test('concurrent writers share an immutable intent and reject invalid or oversized activities before writes', { skip: !uri }, async t => {
  const f = await fixture(t);
  const rows = await Promise.all([ensure(f), ensure(f)]);
  assert.deepEqual(rows[0], rows[1]);
  assert.equal(await f.intents.countDocuments({}), 1);
  for (const activity of [{ ...f.activity, _id: '' }, { ...f.activity, createdAt: '2026-01-01' },
    { ...f.activity, modifiedAt: new Date(NaN) }, { ...f.activity, content: 'x'.repeat(14 * 1024 * 1024) }]) {
    await assert.rejects(ensure({ ...f, activity }), /intent-invalid/);
  }
  assert.equal(await f.intents.countDocuments({}), 1);
});
test('completion compacts confirmed intents, reconciles lost replies and binds the dispatch actor', { skip: !uri }, async t => {
  const { completeActivityNotificationIntent: complete } = require('../../server/lib/activityNotificationIntent');
  const f = await fixture(t), row = await persist(f);
  await assert.rejects(complete({ ...f, dispatchUserId: 'other-dispatcher' }), /intent-invalid/);
  const intents = { findOne: (...args) => f.intents.findOne(...args), replaceOne: async (...args) => {
    await f.intents.replaceOne(...args); throw new Error('lost completion reply');
  } };
  assert.equal(await complete({ ...f, intents }), row._id);
  const receipt = await f.intents.findOne({ _id: row._id });
  assert.equal(receipt.state, 'completed'); assert.equal(receipt.activity, undefined);
  assert.equal(await complete(f), row._id);
  assert.equal((await ensure(f)).state, 'completed');
  await assert.rejects(recover({ ...f, intentId: row._id }), /intent-invalid/);
});
test('unacknowledged completion retains pending state and changed activities cannot be acknowledged', { skip: !uri }, async t => {
  const { completeActivityNotificationIntent: complete } = require('../../server/lib/activityNotificationIntent');
  const f = await fixture(t), row = await persist(f);
  await assert.rejects(complete({ ...f, intents: { findOne: (...args) => f.intents.findOne(...args),
    replaceOne: async () => ({ matchedCount: 1 }) } }), /completion-unconfirmed/);
  assert.equal((await f.intents.findOne({ _id: row._id })).state, 'pending');
  await f.activities.updateOne({ _id: f.activity._id }, { $set: { userId: 'other' } });
  await assert.rejects(complete(f), /activity-unconfirmed/);
});
