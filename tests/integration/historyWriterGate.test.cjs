'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
const { withHistoryWriter: write, beginHistoryMigration: begin, finishHistoryMigration: finish } = require('../../server/lib/historyWriterGate');
const { initializeHistoryChain } = require('../../server/lib/historyChainBootstrap');
const { appendHistoryChain, historyChainId, validateHistoryChainHead } = require('../../server/lib/historyChainAppend');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('separate clients drain a legacy write, bootstrap its actual head and switch to coordinated append', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), other = await new MongoClient(uri).connect();
  const db = client.db(`history_gate_${new ObjectId().toHexString()}`), next = other.db(db.databaseName);
  t.after(async () => { await db.dropDatabase(); await Promise.all([client.close(), other.close()]); });
  const boardId = 'board', migrationId = randomUUID();
  const oldOptions = { gates: db.collection('gates'), boardId }, migrationOptions = { gates: next.collection('gates'), boardId, migrationId };
  let started, release;
  const entered = new Promise(resolve => { started = resolve; });
  const paused = new Promise(resolve => { release = resolve; });
  const old = { _id: 'old', boardId, entityType: 'card', entityId: 'card', userId: 'actor',
    newContent: { field: 'title', value: 'old' }, createdAt: new Date(1000), previousHash: null, isCheckpoint: false };
  old.integrityHash = hashHistoryRow(old);
  const running = write({ ...oldOptions, writeCoordinated: () => assert.fail(), writeLegacy: async ({ assertCurrent }) => {
    started(); await paused; await assertCurrent(); await db.collection('history').insertOne(old); return old._id;
  } });
  await entered;
  await assert.rejects(begin(migrationOptions), /writers-pending/);
  await assert.rejects(write({ ...oldOptions, writeLegacy: () => assert.fail('no admission after draining'),
    writeCoordinated: () => assert.fail() }), /migration-busy/);
  release(); assert.equal(await running, 'old');
  const reservation = await begin(migrationOptions);
  const head = await initializeHistoryChain({ heads: next.collection('heads'), history: next.collection('history'),
    boardId, assertExclusive: reservation.assertExclusive });
  assert.equal(head.hash, old.integrityHash);
  await finish({ ...migrationOptions, assertHeadReady: async () => {
    validateHistoryChainHead(await next.collection('heads').findOne({ _id: historyChainId(boardId) }), boardId);
  } });
  const row = { ...old, _id: 'new', newContent: { field: 'title', value: 'new' } };
  delete row.previousHash; delete row.integrityHash;
  assert.equal(await write({ ...oldOptions, writeLegacy: () => assert.fail('must never fall back'),
    writeCoordinated: () => appendHistoryChain({ heads: db.collection('heads'), history: db.collection('history'),
      row, initialHash: null, assertCurrent: async () => {} }) }), 'new');
  assert.equal((await db.collection('history').findOne({ _id: 'new' })).previousHash, old.integrityHash);
  assert.equal((await db.collection('gates').findOne({})).writers.length, 0);
});

test('offline command inspects and retires a lost-reply token without changing stored History', { skip: !uri }, async t => {
  const { promisify } = require('node:util');
  const exec = promisify(require('node:child_process').execFile);
  const path = require('node:path');
  const client = await new MongoClient(uri).connect();
  const db = client.db(`history_retire_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const boardId = 'board', migrationId = randomUUID(), gates = db.collection('historyWriterGates');
  let writerId;
  const row = { _id: 'persisted', boardId, entityType: 'card', entityId: 'card', userId: 'actor',
    newContent: { field: 'title', value: 'saved' }, createdAt: new Date(), previousHash: null, isCheckpoint: false };
  row.integrityHash = hashHistoryRow(row);
  await assert.rejects(write({ gates, boardId, writeCoordinated: () => assert.fail(),
    writeLegacy: async writer => { writerId = writer.writerId; await db.collection('history').insertOne(row); throw Error('reply lost'); } }), /reply lost/);
  await assert.rejects(begin({ gates, boardId, migrationId }), /writers-pending/);
  const url = new URL(uri); url.pathname = `/${db.databaseName}`;
  const run = args => exec(process.execPath, [path.resolve(__dirname, '../../releases/recover-history-writer.cjs'), ...args],
    { env: { ...process.env, MONGO_URL: url.toString() } });
  assert.deepEqual(JSON.parse((await run(['--board', boardId])).stdout).writers, [writerId]);
  await assert.rejects(run(['--board', boardId, '--retire', writerId]));
  await assert.rejects(run(['--board', boardId, '--retire', writerId, '--offline', '--migration', randomUUID()]));
  assert.deepEqual((await gates.findOne({ boardId })).writers, [writerId]);
  const args = ['--board', boardId, '--retire', writerId, '--offline', '--migration', migrationId];
  assert.deepEqual(JSON.parse((await run(args)).stdout).writers, []);
  assert.deepEqual(JSON.parse((await run(args)).stdout).writers, []);
  assert.deepEqual(await db.collection('history').findOne({ _id: row._id }), row);
  const reservation = await begin({ gates, boardId, migrationId });
  const head = await initializeHistoryChain({ heads: db.collection('heads'), history: db.collection('history'),
    boardId, assertExclusive: reservation.assertExclusive });
  assert.equal(head.hash, row.integrityHash);
});
