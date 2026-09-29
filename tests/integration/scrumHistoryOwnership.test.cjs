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

test('two server processes resuming one operation: the newer claim displaces the older', { skip: !uri }, async t => {
  const { claimScrumHistoryWorker: claim, assertScrumHistoryWorker: current } = require('../../server/lib/scrumHistoryOwnership');
  const clients = await Promise.all([new MongoClient(uri).connect(), new MongoClient(uri).connect()]);
  const db = clients[0].db(`scrum_worker_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const stores = clients.map(client => client.db(db.databaseName).collection('scrumHistoryPending'));
  const adapters = stores.map(collection => ({ findOneAsync: query => collection.findOne(query),
    updateAsync: async (query, modifier) => (await collection.updateOne(query, modifier)).matchedCount }));
  const journal = { _id: 'board', rowId: 'row', userId: 'actor', direction: 'undo', operationId: 'op',
    content: { records: [{ date: new Date(1234) }] }, before: { records: [{}] }, revisions: [1] };
  await stores[0].insertOne(journal);
  const older = await claim(adapters[0], journal);
  await current(adapters[0], journal, older);
  const newer = await claim(adapters[1], journal);
  assert.notEqual(newer, older);
  await current(adapters[1], journal, newer);
  await assert.rejects(current(adapters[0], journal, older), /conflict/, 'the older process stops at its next guard');
  await owned(adapters[0], journal);
  assert.equal((await stores[0].findOne({ _id: 'board' })).worker, newer);
});
