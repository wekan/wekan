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
const { appendHistoryChain } = require('../../server/lib/historyChainAppend');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('Sync History holds a writer token, drains migration, and appends through the head once coordinated', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`sync_admission_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const gates = db.collection('gates'), events = db.collection('events');
  const boardId = 'board';
  // The same admission the production ChangeHistory adapter uses
  // (server/lib/storedHistoryChain.js): legacy holds a token for the batch;
  // coordinated appends each row through the chain head.
  const heads = db.collection('heads');
  const admit = ({ boardId: id, work }) => withHistoryWriter({ gates, boardId: id,
    writeLegacy: ({ assertCurrent }) => work({ mode: 'legacy', assertCurrent }),
    writeCoordinated: () => work({ mode: 'coordinated', assertCurrent: async () => {} }) });
  let during;
  const modes = [];
  const history = { admitHistoryWriter: admit,
    // `this` is whichever adapter the caller passed (the slow one below too).
    async appendSyncHistoryRow({ row, mode, assertCurrent }) {
      modes.push(mode);
      if (mode === 'coordinated') {
        const tip = await events.findOne({ boardId }, { sort: { createdAt: -1 } });
        return appendHistoryChain({ heads, history: { findOne: q => events.findOne(q), insertOne: r => events.insertOne(r) },
          row, initialHash: tip ? tip.integrityHash : null, assertCurrent });
      }
      if (await events.findOne({ _id: row._id })) return row._id;
      const saved = { ...row, previousHash: null }; saved.integrityHash = hashHistoryRow(saved);
      await this.insertAsync(saved); return row._id;
    },
    findOneAsync: query => events.findOne(typeof query === 'string' ? { _id: query } : query),
    insertAsync: async row => { during = await inspectHistoryWriters({ gates, boardId });
      await events.insertOne(row); return row._id; },
    updateAsync: (...args) => events.updateOne(...args) };
  const card = id => ({ _id: id, boardId, listId: 'list', title: 'Old', description: 'Old' });
  const update = id => ({ kind: 'update', cardId: id, before: card(id), after: { ...card(id), title: 'New' } });
  const step = update('card');
  const effectId = 'e'.repeat(64);
  const plan = prepareSyncFieldHistory({ step, effectId, userId: 'user', createdAt: new Date(1000), });

  assert.equal(await persistSyncFieldHistory({ history, plan, assertCurrent: async () => {} }), effectId);
  assert.equal(during.mode, 'legacy');
  assert.equal(during.writers.length, 1, 'the batch was written holding a writer token');
  assert.deepEqual((await inspectHistoryWriters({ gates, boardId })).writers, [], 'and released it after');

  // A migration that starts while a Sync batch is writing must wait for it.
  const migrationId = '11111111-1111-4111-8111-111111111111';
  let release;
  const slow = { ...history, insertAsync: async row => { await new Promise(resolve => { release = resolve; }); return events.insertOne(row); },
    findOneAsync: async query => (release ? events.findOne(typeof query === 'string' ? { _id: query } : query) : null) };
  const second = prepareSyncFieldHistory({ step: update('two'), effectId: 'f'.repeat(64), userId: 'user', createdAt: new Date(2000), });
  const writing = persistSyncFieldHistory({ history: slow, plan: second, assertCurrent: async () => {} });
  while (!release) await new Promise(resolve => setTimeout(resolve, 5));
  await assert.rejects(beginHistoryMigration({ gates, boardId, migrationId }).then(() =>
    beginHistoryMigration({ gates, boardId, migrationId })), /writers-pending/);
  // Draining: the batch already holding its token may finish; a new one may not start.
  const third = prepareSyncFieldHistory({ step: update('three'), effectId: 'c'.repeat(64), userId: 'user',
    createdAt: new Date(3000), });
  await assert.rejects(persistSyncFieldHistory({ history, plan: third, assertCurrent: async () => {} }), /migration-busy/);
  release();
  assert.equal(await writing, 'f'.repeat(64), 'the in-flight batch completes while the board drains');

  // Once coordinated, Sync History is refused, never appended around the head.
  const drained = await beginHistoryMigration({ gates, boardId, migrationId });
  assert.equal(drained.complete, false);
  await finishHistoryMigration({ gates, boardId, migrationId, assertHeadReady: async () => {} });
  // Once coordinated, Sync History is appended through the chain head, like an
  // ordinary edit (maintainer decision of 2026-09-30) - not refused, and no fork.
  const fourth = prepareSyncFieldHistory({ step: update('four'), effectId: 'd'.repeat(64), userId: 'user',
    createdAt: new Date(4000) });
  modes.length = 0;
  assert.equal(await persistSyncFieldHistory({ history, plan: fourth, assertCurrent: async () => {} }), 'd'.repeat(64));
  assert.deepEqual(modes, ['coordinated']);
  const appended = await events.findOne({ _id: fourth.rows[0]._id });
  const head = await heads.findOne({});
  assert.equal(head.hash, appended.integrityHash, 'the head advanced to the Sync row');
  assert.equal(await persistSyncFieldHistory({ history, plan: fourth, assertCurrent: async () => {} }), 'd'.repeat(64),
    'a replay finds its row');
  assert.equal(await events.countDocuments({ _id: fourth.rows[0]._id }), 1);
});

test('an adapter without admission or linking is refused (negative)', async () => {
  const before = { _id: 'card', boardId: 'b', listId: 'list', title: 'Old', description: 'Old' };
  const plan = prepareSyncFieldHistory({ step: { kind: 'update', cardId: 'card', before, after: { ...before, title: 'New' } },
    effectId: 'e'.repeat(64), userId: 'u', createdAt: new Date(1), });
  let writes = 0;
  const history = { findOneAsync: async () => null, insertAsync: async () => { writes++; }, updateAsync: async () => { writes++; } };
  await assert.rejects(persistSyncFieldHistory({ history, plan, assertCurrent: async () => {} }), /sync-history-plan-invalid/);
  assert.equal(writes, 0);
});

test('production ChangeHistory admits Sync in either mode and links each row when it appends it', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../server/lib/storedHistoryChain.js'), 'utf8');
  const at = src.indexOf('ChangeHistory.admitHistoryWriter');
  assert.ok(at > 0);
  const body = src.slice(at, src.indexOf('\n};', src.indexOf('ChangeHistory.appendSyncHistoryRow')));
  // Online writer recovery (2026-09-30): the legacy writer also hands Sync its
  // fence, and every legacy row is inserted through it, so a batch whose
  // writer died mid-insert can be taken over without stopping servers.
  assert.match(body, /writeLegacy: \(\{ assertCurrent, fencedInsert \}\) => work\(\{ mode: 'legacy', assertCurrent, fencedInsert \}\)/);
  assert.match(body, /if \(typeof fencedInsert !== 'function'\) throw new Error\('history-writer-fence-required'\);/);
  assert.match(body, /await fencedInsert\(prepared\._id, \(\) => ChangeHistory\.insertAsync\(saved/);
  assert.match(body, /existing\.boardId !== prepared\.boardId\) throw new Error\('history-writer-fenced'\)/,
    'a fence tombstone is never taken for the planned row');
  assert.match(body, /writeCoordinated: \(\) => work\(\{ mode: 'coordinated'/);
  assert.match(body, /if \(mode === 'coordinated'\) return appendStoredHistoryChain\(\{ row, assertCurrent \}\);/);
  // The legacy link goes after the chain's TIP, walking successors, not after
  // whatever row is newest by createdAt (one batch shares a createdAt).
  assert.match(body, /previousHash: previous\.integrityHash \}/);
  assert.doesNotMatch(src, /sync-history-coordination-required/, 'a coordinated board is no longer refused');
});
