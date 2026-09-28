'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { finishScrumHistory } = require('../../server/lib/scrumHistoryFinalizer');
const { saveScrumHistoryCompletion } = require('../../server/lib/scrumHistoryCompletion');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('durable Scrum completion survives uncertain cleanup and fresh-client replay', { skip: !uri }, async t => {
  const clients = await Promise.all([new MongoClient(uri).connect(), new MongoClient(uri).connect()]);
  const db = clients[0].db(`scrum_completion_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const adapt = collection => ({
    findOneAsync: query => collection.findOne(typeof query === 'string' ? { _id: query } : query),
    insertAsync: async doc => (await collection.insertOne(doc)).insertedId,
    updateAsync: async (query, modifier) => (await collection.updateOne(query, modifier)).matchedCount,
    removeAsync: async query => (await collection.deleteOne(query)).deletedCount,
  });
  const stores = clients.map(client => {
    const database = client.db(db.databaseName);
    return { history: adapt(database.collection('history')), pending: adapt(database.collection('pending')),
      completions: adapt(database.collection('completions')) };
  });
  const row = { _id: 'row', boardId: 'board', userId: 'author', entityType: 'scrum',
    createdAt: new Date(0), previousContent: {}, newContent: {}, undone: false, undoneAt: null, superseded: false };
  row.integrityHash = hashHistoryRow(row);
  const journal = { _id: 'board', rowId: row._id, userId: row.userId, operationId: 'operation', direction: 'undo',
    content: { records: [] }, before: { records: [] }, revisions: [] };
  await stores[0].history.insertAsync(row); await stores[0].pending.insertAsync(journal);
  const find = stores[0].pending.findOneAsync; let deleted = false;
  stores[0].pending.removeAsync = async query => {
    await db.collection('pending').deleteOne(query); deleted = true;
    throw new Error('lost deletion acknowledgement');
  };
  stores[0].pending.findOneAsync = query => {
    if (deleted) throw new Error('confirmation unavailable');
    return find(query);
  };
  await assert.rejects(finishScrumHistory({ ...stores[0], row, journal }), /confirmation unavailable/);
  assert.equal(await db.collection('pending').findOne({ _id: 'board' }), null);
  const receipt = await db.collection('completions').findOne({ _id: journal.operationId });
  assert.equal(receipt.rowId, row._id);
  // A new operation and newer History state do not change the old result.
  const successor = { ...journal, operationId: 'successor', direction: 'redo' };
  await stores[1].pending.insertAsync(successor);
  await db.collection('history').updateOne({ _id: row._id }, { $set: { undone: false, undoneAt: null } });
  await finishScrumHistory({ ...stores[1], row, journal });
  assert.deepEqual(await db.collection('pending').findOne({ _id: 'board' }), successor);
  assert.deepEqual(await db.collection('completions').findOne({ _id: journal.operationId }), receipt);
  assert.equal((await db.collection('history').findOne({ _id: row._id })).undone, false);
  await assert.rejects(finishScrumHistory({ ...stores[1], row, journal: { ...journal, revisions: [1] } }), /conflict/);
  assert.deepEqual(await db.collection('pending').findOne({ _id: 'board' }), successor);
  // Both clients retain the first persisted completion, never overwrite its
  // original time, and reject a competing plan that reused the operation ID.
  const receipts = await Promise.all(stores.map((store, index) =>
    saveScrumHistoryCompletion(store.completions, journal, row, () => new Date(9000 + index))));
  assert.deepEqual(receipts, [receipt, receipt]);
  await assert.rejects(saveScrumHistoryCompletion(stores[1].completions,
    { ...journal, userId: 'other-actor' }, row, () => new Date()), /completion conflict/);
  assert.deepEqual(await db.collection('completions').findOne({ _id: journal.operationId }), receipt);
});
