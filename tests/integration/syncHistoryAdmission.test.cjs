'use strict';
// Sync History writes rows hashed when they were planned, so it must write as
// a writer the board's History gate admits (server/lib/syncHistoryBatch.js).
// On a real MongoDB, with the real gate: a chain migration cannot start while
// a Sync batch is writing, and a board whose chain is coordinated refuses Sync
// History instead of forking it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareSyncFieldHistory, persistSyncFieldHistory } = require('../../server/lib/syncHistoryBatch');
const { withHistoryWriter, beginHistoryMigration, finishHistoryMigration, inspectHistoryWriters } = require('../../server/lib/historyWriterGate');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('Sync History holds a writer token, drains migration and refuses a coordinated board', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`sync_admission_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const gates = db.collection('gates'), events = db.collection('events');
  const boardId = 'board';
  // The same admission the production ChangeHistory adapter uses.
  const admit = ({ boardId: id, work }) => withHistoryWriter({ gates, boardId: id, writeLegacy: work,
    writeCoordinated: async () => { throw new Error('sync-history-coordination-required'); } });
  let during;
  const history = { admitHistoryWriter: admit,
    findOneAsync: query => events.findOne(typeof query === 'string' ? { _id: query } : query),
    insertAsync: async row => { during = await inspectHistoryWriters({ gates, boardId });
      await events.insertOne(row); return row._id; },
    updateAsync: (...args) => events.updateOne(...args) };
  const card = id => ({ _id: id, boardId, listId: 'list', title: 'Old', description: 'Old' });
  const update = id => ({ kind: 'update', cardId: id, before: card(id), after: { ...card(id), title: 'New' } });
  const step = update('card');
  const effectId = 'e'.repeat(64);
  const plan = prepareSyncFieldHistory({ step, effectId, userId: 'user', createdAt: new Date(1000), previousHash: null });

  assert.equal(await persistSyncFieldHistory({ history, plan, assertCurrent: async () => {} }), effectId);
  assert.equal(during.mode, 'legacy');
  assert.equal(during.writers.length, 1, 'the batch was written holding a writer token');
  assert.deepEqual((await inspectHistoryWriters({ gates, boardId })).writers, [], 'and released it after');

  // A migration that starts while a Sync batch is writing must wait for it.
  const migrationId = '11111111-1111-4111-8111-111111111111';
  let release;
  const slow = { ...history, insertAsync: async row => { await new Promise(resolve => { release = resolve; }); return events.insertOne(row); },
    findOneAsync: async query => (release ? events.findOne(typeof query === 'string' ? { _id: query } : query) : null) };
  const second = prepareSyncFieldHistory({ step: update('two'), effectId: 'f'.repeat(64), userId: 'user', createdAt: new Date(2000), previousHash: null });
  const writing = persistSyncFieldHistory({ history: slow, plan: second, assertCurrent: async () => {} });
  while (!release) await new Promise(resolve => setTimeout(resolve, 5));
  await assert.rejects(beginHistoryMigration({ gates, boardId, migrationId }).then(() =>
    beginHistoryMigration({ gates, boardId, migrationId })), /writers-pending/);
  // Draining: the batch already holding its token may finish; a new one may not start.
  const third = prepareSyncFieldHistory({ step: update('three'), effectId: 'c'.repeat(64), userId: 'user',
    createdAt: new Date(3000), previousHash: null });
  await assert.rejects(persistSyncFieldHistory({ history, plan: third, assertCurrent: async () => {} }), /migration-busy/);
  release();
  assert.equal(await writing, 'f'.repeat(64), 'the in-flight batch completes while the board drains');

  // Once coordinated, Sync History is refused, never appended around the head.
  const drained = await beginHistoryMigration({ gates, boardId, migrationId });
  assert.equal(drained.complete, false);
  await finishHistoryMigration({ gates, boardId, migrationId, assertHeadReady: async () => {} });
  const before = await events.countDocuments({});
  await assert.rejects(persistSyncFieldHistory({ history, plan: { ...plan, effectId: 'a'.repeat(64) }, assertCurrent: async () => {} }),
    /sync-history-coordination-required|sync-history-plan-invalid/);
  await assert.rejects(persistSyncFieldHistory({ history, plan, assertCurrent: async () => {} }), /sync-history-coordination-required/);
  assert.equal(await events.countDocuments({}), before, 'nothing written on a coordinated board');
});

test('an adapter without admission is refused (negative)', async () => {
  const before = { _id: 'card', boardId: 'b', listId: 'list', title: 'Old', description: 'Old' };
  const plan = prepareSyncFieldHistory({ step: { kind: 'update', cardId: 'card', before, after: { ...before, title: 'New' } },
    effectId: 'e'.repeat(64), userId: 'u', createdAt: new Date(1), previousHash: null });
  let writes = 0;
  const history = { findOneAsync: async () => null, insertAsync: async () => { writes++; }, updateAsync: async () => { writes++; } };
  await assert.rejects(persistSyncFieldHistory({ history, plan, assertCurrent: async () => {} }), /sync-history-plan-invalid/);
  assert.equal(writes, 0);
});

test('production ChangeHistory admits Sync as a legacy writer and refuses a coordinated board', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../server/lib/storedHistoryChain.js'), 'utf8');
  const at = src.indexOf('ChangeHistory.admitHistoryWriter');
  assert.ok(at > 0);
  const body = src.slice(at, src.indexOf('\n\n', at));
  assert.match(body, /withHistoryWriter\(\{\s*gates: HistoryWriterGates\.rawCollection\(\), boardId, writeLegacy: work,/);
  assert.match(body, /writeCoordinated: async \(\) => \{ throw new Error\('sync-history-coordination-required'\); \}/);
});
