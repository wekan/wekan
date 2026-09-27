'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { readSyncTarget, replaceSyncTarget, nextSyncTargetId } = require('../../server/lib/listSyncTarget');
const { listSyncCardId } = require('../../server/lib/listSyncCardId');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('replacement decisions survive races, lost acknowledgements and another database client', { skip: !uri }, async t => {
  const clients = [new MongoClient(uri), new MongoClient(uri)];
  await Promise.all(clients.map(client => client.connect()));
  const name = `sync_targets_${new ObjectId().toHexString()}`;
  const db = clients[0].db(name);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const targets = clients.map(client => {
    const collection = client.db(name).collection('targets');
    return {
      findOneAsync: selector => collection.findOne(selector),
      insertAsync: doc => collection.insertOne(doc),
      updateAsync: async (selector, changes) => (await collection.updateOne(selector, changes)).matchedCount,
    };
  });
  const read = (client = 0) => readSyncTarget(targets[client], 'list', 'source', 'item');
  const original = await read();
  assert.equal(original.targetId, listSyncCardId('list', 'source', 'item'));
  const oldCard = { _id: original.targetId, listId: 'moved-list', title: 'Local work', description: 'Keep me' };
  await db.collection('cards').insertOne(oldCard);
  const race = await Promise.all(targets.map(target => replaceSyncTarget(target, original)));
  assert.deepEqual(race.sort(), [false, true]);
  const selected = await read(1);
  assert.equal(selected.targetId, nextSyncTargetId(original.targetId));
  assert.equal(await replaceSyncTarget(targets[0], original), false);
  // An acknowledged write is not required for the chosen target to survive.
  await assert.rejects(replaceSyncTarget({ ...targets[0], updateAsync: async (...args) => {
    await targets[0].updateAsync(...args); throw new Error('lost acknowledgement');
  } }, selected), /lost acknowledgement/);
  const next = await read(1);
  assert.equal(next.targetId, nextSyncTargetId(selected.targetId));
  assert.equal(await replaceSyncTarget(targets[1], selected), false);
  const creates = await Promise.allSettled(clients.map(client => client.db(name).collection('cards')
    .insertOne({ _id: next.targetId, listId: 'list', title: 'Replacement' })));
  assert.equal(creates.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(creates.find(result => result.status === 'rejected').reason.code, 11000);
  assert.deepEqual(await db.collection('cards').findOne({ _id: oldCard._id }), oldCard);
  assert.equal(await db.collection('cards').countDocuments({}), 2);
  for (const tuple of [['other', 'source', 'item'], ['list', 'other', 'item'], ['list', 'source', 'other']]) {
    const isolated = await readSyncTarget(targets[1], ...tuple);
    assert.equal(isolated.targetId, isolated.baseId);
    assert.notEqual(isolated.targetId, original.targetId);
  }
  const fresh = await readSyncTarget(targets[0], 'fresh', 'source', 'item');
  await assert.rejects(replaceSyncTarget({ ...targets[0], insertAsync: async doc => {
    await targets[0].insertAsync(doc); throw new Error('lost insert acknowledgement');
  } }, fresh), /lost insert acknowledgement/);
  assert.equal((await readSyncTarget(targets[1], 'fresh', 'source', 'item')).targetId, nextSyncTargetId(fresh.targetId));
  assert.equal(await replaceSyncTarget(targets[1], fresh), false);
  await db.collection('targets').updateOne({ _id: original.baseId }, { $set: { sourceKey: 'wrong' } });
  await assert.rejects(read(), /Invalid Sync replacement target/);
});
