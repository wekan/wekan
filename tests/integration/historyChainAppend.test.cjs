'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { appendHistoryChain: append } = require('../../server/lib/historyChainAppend');
const { rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('independent Mongo clients serialize equal-time appends and finish an interrupted predecessor', { skip: !uri }, async t => {
  const clients = await Promise.all(Array.from({ length: 4 }, () => new MongoClient(uri).connect()));
  const name = `history_chain_${new ObjectId().toHexString()}`, db = clients[0].db(name);
  t.after(async () => { await db.dropDatabase(); await Promise.all(clients.map(client => client.close())); });
  const options = client => ({ heads: client.db(name).collection('heads'), history: client.db(name).collection('history'),
    initialHash: null, assertCurrent: async () => {} });
  const row = _id => ({ _id, boardId: 'board', userId: 'actor', entityType: 'card', entityId: 'card',
    group: 'title', changeType: 'edited', newContent: { field: 'title', value: _id }, createdAt: new Date(1000), isCheckpoint: false });
  const first = options(clients[0]), replace = first.heads.replaceOne.bind(first.heads);
  // Persist the History row, then simulate termination before head advancement.
  first.heads = { findOne: (...args) => db.collection('heads').findOne(...args),
    insertOne: (...args) => db.collection('heads').insertOne(...args), replaceOne: async (selector, document) => {
      if (document.pending === null) throw Error('process stopped'); return replace(selector, document);
    } };
  await assert.rejects(append({ ...first, row: row('interrupted') }), /process stopped/);
  assert.equal(await db.collection('history').countDocuments({}), 1);
  await Promise.all(Array.from({ length: 16 }, (_, i) => append({ ...options(clients[i % 4]), row: row(`row-${i}`) })));
  const rows = await db.collection('history').find({}).toArray(), successors = new Map();
  assert.equal(rows.length, 17);
  for (const saved of rows) {
    assert.ok(rowHashIsValid(saved)); assert.ok(!successors.has(saved.previousHash));
    successors.set(saved.previousHash, saved.integrityHash);
  }
  let hash = null, count = 0;
  while (successors.has(hash)) { hash = successors.get(hash); count++; }
  assert.equal(count, 17);
  const head = await db.collection('heads').findOne({});
  assert.equal(head.hash, hash); assert.equal(head.pending, null); assert.equal(head.pendingHash, null);
  assert.equal(await append({ ...options(clients[3]), row: row('interrupted') }), 'interrupted');
  assert.equal(await db.collection('history').countDocuments({}), 17);
});
