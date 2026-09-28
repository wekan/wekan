'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const { initializeHistoryChain } = require('../../server/lib/historyChainBootstrap');
const { appendHistoryChain } = require('../../server/lib/historyChainAppend');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('validated Mongo bootstrap preserves legacy rows and supports fresh-connection append', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`history_bootstrap_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const history = db.collection('history'), heads = db.collection('heads');
  let previousHash = null; const rows = [];
  for (let i = 0; i < 300; i++) {
    const row = { _id: `old-${i}`, boardId: 'board', entityType: 'card', entityId: 'card', userId: 'actor',
      newContent: { field: 'title', value: String(i) }, createdAt: new Date(300 - i), previousHash, isCheckpoint: false };
    row.integrityHash = hashHistoryRow(row); previousHash = row.integrityHash; rows.push(row);
  }
  const legacy = { _id: 'legacy', boardId: 'board', createdAt: new Date(9999) };
  await history.insertMany([legacy, ...rows.reverse()]);
  const head = await initializeHistoryChain({ heads, history, boardId: 'board', assertExclusive: async () => {} });
  assert.equal(head.hash, previousHash);
  assert.deepEqual(await history.findOne({ _id: 'legacy' }), legacy);
  const restarted = await new MongoClient(uri).connect();
  try {
    const next = restarted.db(db.databaseName);
    await appendHistoryChain({ heads: next.collection('heads'), history: next.collection('history'),
      initialHash: null, assertCurrent: async () => {}, row: { _id: 'new', boardId: 'board', entityType: 'card',
        entityId: 'card', userId: 'actor', newContent: { field: 'title', value: 'new' }, createdAt: new Date(0), isCheckpoint: false } });
  } finally { await restarted.close(); }
  assert.equal((await history.findOne({ _id: 'new' })).previousHash, previousHash);
  assert.equal(await history.countDocuments({}), 302);
  const fork = { ...rows[0], _id: 'fork', newContent: { field: 'title', value: 'fork' } };
  fork.integrityHash = hashHistoryRow(fork); await history.insertOne(fork);
  // Test a not-yet-initialized head namespace. Existing heads are never reset.
  await assert.rejects(initializeHistoryChain({ heads: db.collection('otherHeads'), history,
    boardId: 'board', assertExclusive: async () => {} }), /bootstrap-fork/);
  assert.equal(await db.collection('otherHeads').countDocuments({}), 0);
});
