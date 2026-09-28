'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { ensureScrumHistoryOperation: ensure, assertScrumHistoryOperation: owned,
  scrumHistorySelector } = require('../../server/lib/scrumHistoryOwnership');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('independent clients upgrade one legacy checkpoint and fence replaced plans', { skip: !uri }, async t => {
  const clients = await Promise.all([new MongoClient(uri).connect(), new MongoClient(uri).connect()]);
  const db = clients[0].db(`scrum_owner_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const stores = clients.map(client => client.db(db.databaseName).collection('scrumHistoryPending'));
  const adapters = stores.map(collection => ({ findOneAsync: query => collection.findOne(query),
    updateAsync: async (query, modifier) => (await collection.updateOne(query, modifier)).matchedCount }));
  const journal = { _id: 'board', rowId: 'row', userId: 'actor', direction: 'undo',
    content: { records: [{ date: new Date(1234) }] }, before: { records: [{}] }, revisions: [1] };
  await stores[0].insertOne(journal);
  const [a, b] = await Promise.all(adapters.map(adapter => ensure(adapter, journal)));
  assert.equal(a.operationId, b.operationId); await owned(adapters[1], a);
  const saved = await stores[0].findOne({ _id: 'board' }); assert.deepEqual(a, saved);
  // A replacement reusing identity fields still cannot be removed by the old
  // worker because cleanup predicates include the full before/after plan.
  await stores[1].updateOne({ _id: 'board' }, { $set: { revisions: [2] } });
  await assert.rejects(owned(adapters[0], a), /conflict/);
  assert.equal((await stores[0].deleteOne(scrumHistorySelector(a))).deletedCount, 0);
  assert.deepEqual((await stores[0].findOne({ _id: 'board' })).revisions, [2]);
});
