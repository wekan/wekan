'use strict';
// Online writer-token recovery (maintainer decision of 2026-09-30): a History
// writer that died holding its token is taken over without stopping servers,
// and cannot write afterwards. Two clients stand in for two servers.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const G = require('../../server/lib/historyWriterGate');
const { migrateHistoryChain } = require('../../server/lib/historyChainMigration');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const LEASE = 1000;

async function setup(t) {
  const client = await new MongoClient(uri).connect(), other = await new MongoClient(uri).connect();
  const db = client.db(`history_recovery_${new ObjectId().toHexString()}`), next = other.db(db.databaseName);
  t.after(async () => { await db.dropDatabase(); await Promise.all([client.close(), other.close()]); });
  const on = d => ({ gates: d.collection('gates'), leases: d.collection('leases'), history: d.collection('history') });
  return { db, a: on(db), b: on(next), heads: next.collection('heads'), boardId: 'board' };
}
function gate() {
  let open; const opened = new Promise(resolve => { open = resolve; });
  let reach; const reached = new Promise(resolve => { reach = resolve; });
  return { opened, open, reached, reach };
}
function row(id, boardId, previousHash = null) {
  const r = { _id: id, boardId, entityType: 'card', entityId: 'card', userId: 'actor',
    newContent: { field: 'title', value: id }, createdAt: new Date(1000), previousHash, isCheckpoint: false };
  r.integrityHash = hashHistoryRow(r);
  return r;
}
const past = () => new Date(Date.now() - 10 * LEASE);

test('a writer that died after claiming a row is taken online, and its late insert fails', { skip: !uri }, async t => {
  const f = await setup(t), pause = gate();
  let writerId;
  const dead = G.withHistoryWriter({ ...f.a, boardId: f.boardId, leaseMs: LEASE, now: past,
    writeCoordinated: () => assert.fail(), writeLegacy: async writer => {
      writerId = writer.writerId;
      return writer.fencedInsert('late', async () => { pause.reach(); await pause.opened; return f.a.history.insertOne(row('late', f.boardId)); });
    } });
  await pause.reached;
  const result = await G.recoverExpiredHistoryWriters({ ...f.b, boardId: f.boardId, graceMs: LEASE });
  assert.deepEqual(result, { recovered: [writerId], alive: [], unleased: [] });
  assert.deepEqual((await f.b.gates.findOne({})).writers, [], 'the token is gone');
  assert.equal(await f.b.leases.findOne({ _id: writerId }), null, 'and so is the lease');
  assert.equal((await f.b.history.findOne({ _id: 'late' })).boardId, G.HISTORY_FENCE_BOARD, 'the claimed id is fenced');
  // The "dead" writer wakes up: its insert can no longer land.
  pause.open();
  await assert.rejects(dead, /duplicate key|E11000/);
  assert.equal(await f.a.history.countDocuments({ boardId: f.boardId }), 0, 'nothing reached the board History');
});

test('a slow writer that was fenced cannot claim a row afterwards (negative)', { skip: !uri }, async t => {
  const f = await setup(t), pause = gate();
  const slow = G.withHistoryWriter({ ...f.a, boardId: f.boardId, leaseMs: LEASE, now: past,
    writeCoordinated: () => assert.fail(), writeLegacy: async writer => {
      pause.reach(); await pause.opened;
      return writer.fencedInsert('slow', () => f.a.history.insertOne(row('slow', f.boardId)));
    } });
  await pause.reached;
  assert.equal((await G.recoverExpiredHistoryWriters({ ...f.b, boardId: f.boardId, graceMs: LEASE })).recovered.length, 1);
  pause.open();
  await assert.rejects(slow, /history-writer-ownership-lost/);
  assert.equal(await f.a.history.findOne({ _id: 'slow' }), null);
});

test('a row that landed before the fence is kept, not replaced', { skip: !uri }, async t => {
  const f = await setup(t), pause = gate();
  const landed = row('landed', f.boardId);
  const writer = G.withHistoryWriter({ ...f.a, boardId: f.boardId, leaseMs: LEASE, now: past,
    writeCoordinated: () => assert.fail(), writeLegacy: ({ fencedInsert }) => fencedInsert('landed', async () => {
      await f.a.history.insertOne(landed); pause.reach(); await pause.opened; return 'landed';
    }) });
  await pause.reached;
  assert.equal((await G.recoverExpiredHistoryWriters({ ...f.b, boardId: f.boardId, graceMs: LEASE })).recovered.length, 1);
  assert.deepEqual(await f.b.history.findOne({ _id: 'landed' }), landed, 'the real row stays as written');
  pause.open();
  await assert.rejects(writer, /history-writer-ownership-lost/, 'the writer learns it was taken over');
});

test('a live writer and a token without a lease are reported, never taken (negative)', { skip: !uri }, async t => {
  const f = await setup(t), live = gate(), old = gate();
  const running = G.withHistoryWriter({ ...f.a, boardId: f.boardId, leaseMs: LEASE,
    writeCoordinated: () => assert.fail(), writeLegacy: async ({ fencedInsert }) => {
      live.reach(); await live.opened; return fencedInsert('live', () => f.a.history.insertOne(row('live', f.boardId)));
    } });
  // An older server: no lease at all.
  const unleased = G.withHistoryWriter({ gates: f.a.gates, boardId: f.boardId,
    writeCoordinated: () => assert.fail(), writeLegacy: async () => { old.reach(); await old.opened; return 'old'; } });
  await Promise.all([live.reached, old.reached]);
  // Past the lease itself but inside the grace period: still alive.
  await new Promise(resolve => setTimeout(resolve, LEASE + 200));
  const result = await G.recoverExpiredHistoryWriters({ ...f.b, boardId: f.boardId, graceMs: LEASE });
  assert.deepEqual([result.recovered.length, result.alive.length, result.unleased.length], [0, 1, 1]);
  assert.equal((await f.b.gates.findOne({})).writers.length, 2);
  live.open(); old.open();
  assert.equal((await running).insertedId, 'live', 'the renewed writer finishes normally');
  assert.equal(await unleased, 'old');
  assert.deepEqual([(await f.b.gates.findOne({})).writers, await f.b.leases.countDocuments()], [[], 0], 'both released');
});

test('a chain migration drains a dead writer online and completes', { skip: !uri }, async t => {
  const f = await setup(t);
  const first = row('first', f.boardId);
  await f.a.history.insertOne(first);
  await assert.rejects(G.withHistoryWriter({ ...f.a, boardId: f.boardId, leaseMs: LEASE, now: past,
    writeCoordinated: () => assert.fail(),
    writeLegacy: ({ fencedInsert }) => fencedInsert('lost', async () => { throw new Error('process died'); }) }), /process died/);
  const migrationId = randomUUID();
  // Without leases, the abandoned token blocks the migration as before.
  await assert.rejects(migrateHistoryChain({ gates: f.b.gates, heads: f.heads, history: f.b.history, boardId: f.boardId,
    migrationId, assertDeploymentExclusive: async () => {} }), /writers-pending/);
  assert.equal(await migrateHistoryChain({ ...f.b, graceMs: LEASE, heads: f.heads, boardId: f.boardId,
    migrationId, assertDeploymentExclusive: async () => {} }), migrationId);
  const gateRow = await f.b.gates.findOne({});
  assert.deepEqual([gateRow.mode, gateRow.writers], ['coordinated', []]);
  assert.equal((await f.heads.findOne({})).hash, first.integrityHash, 'the head is the real chain, not the fence');
  assert.equal((await f.b.history.findOne({ _id: 'lost' })).boardId, G.HISTORY_FENCE_BOARD);
});

test('the lease policy is bounded, and the production writers use leases', () => {
  assert.deepEqual(G.historyWriterLeasePolicy({}), { leaseMs: 30000, graceMs: 30000 });
  for (const bad of ['999', '600001', 'x']) assert.throws(() => G.historyWriterLeasePolicy({ HISTORY_WRITER_LEASE_MS: bad }));
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../server/lib/storedHistoryChain.js'), 'utf8');
  assert.equal((src.match(/withHistoryWriter\(\{ \.\.\.writerStorage\(\)/g) || []).length, 1);
  assert.match(src, /admitHistoryWriter = \(\{ boardId, work \}\) => withHistoryWriter\(\{\n  \.\.\.writerStorage\(\)/);
  // Every legacy insert in the server binding goes through the fence.
  assert.equal((src.match(/fencedInsert\(/g) || []).length, 2);
  assert.doesNotMatch(src, /gates: HistoryWriterGates\.rawCollection\(\), boardId,\n\s+writeLegacy/);
});
