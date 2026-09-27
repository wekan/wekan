'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { listSyncCardId } = require('../../server/lib/listSyncCardId');

const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('database rejects concurrent Sync creations and retry after moving a card', { skip: !uri }, async t => {
  const clients = [new MongoClient(uri), new MongoClient(uri)];
  const name = `sync_creation_${new ObjectId().toHexString()}`;
  t.after(async () => {
    await clients[0].db(name).dropDatabase();
    await Promise.all(clients.map(client => client.close()));
  });
  await Promise.all(clients.map(client => client.connect()));
  const collections = clients.map(client => client.db(name).collection('cards'));
  const card = { _id: listSyncCardId('list', 'source', 'issue'), listId: 'list', title: 'Original' };
  const results = await Promise.allSettled(collections.map(cards => cards.insertOne({ ...card })));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.code, 11000);
  assert.equal(await collections[0].countDocuments({}), 1);
  await collections[0].updateOne({ _id: card._id }, { $set: { listId: 'moved', title: 'Local edit' } });
  await assert.rejects(collections[1].insertOne({ ...card }), error => error.code === 11000);
  assert.equal(await collections[0].countDocuments({}), 1);
  assert.equal((await collections[0].findOne({ _id: card._id })).title, 'Local edit');
  // Identical external IDs in another project are independent cards.
  await collections[1].insertOne({ ...card, _id: listSyncCardId('list', 'other-source', 'issue') });
  assert.equal(await collections[0].countDocuments({}), 2);
});
