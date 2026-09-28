'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareScrumHistoryRequest: prepare } = require('../../server/lib/scrumHistoryRequest');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('independent request builders retain the first selected row and reconcile lost insert replies', { skip: !uri }, async t => {
  const clients = await Promise.all([new MongoClient(uri).connect(), new MongoClient(uri).connect()]);
  const name = `scrum_request_${new ObjectId().toHexString()}`;
  t.after(async () => { await clients[0].db(name).dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const stores = clients.map(client => {
    const collection = client.db(name).collection('requests');
    return { findOneAsync: _id => collection.findOne({ _id }),
      insertAsync: async document => { await collection.insertOne(document); throw new Error('lost reply'); } };
  });
  const context = { userId: 'user', boardId: 'board', direction: 'undo', requestId: 'shared-request-123' };
  const rows = ['first', 'second'].map(_id => {
    const row = { _id, userId: 'user', boardId: 'board', entityType: 'scrum', createdAt: new Date(0) };
    row.integrityHash = hashHistoryRow(row); return row;
  });
  const args = { context, assertAccess: async () => {}, assertUnused: async () => {} };
  const results = await Promise.all(stores.map((requests, index) =>
    prepare({ ...args, requests, select: async () => rows[index] })));
  assert.deepEqual(results[0], results[1]);
  const replay = await prepare({ ...args, requests: stores[1],
    select: async () => { throw new Error('must not select another row'); } });
  assert.deepEqual(replay, results[0]);
  assert.equal(await clients[0].db(name).collection('requests').countDocuments(), 1);
  await assert.rejects(prepare({ ...args, requests: stores[1], context: { ...context, direction: 'redo' } }), /conflict/);
  await clients[0].db(name).collection('requests').updateOne({ _id: replay._id }, { $set: { 'selection.rowId': 'changed' } });
  await assert.rejects(prepare({ ...args, requests: stores[1] }), /conflict/);
});
