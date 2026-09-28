'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { canonical } = require('../models/lib/changeHistoryIntegrity');
const { withHistoryWriter: write, beginHistoryMigration: begin, finishHistoryMigration: finish } = require('../server/lib/historyWriterGate');
function fixture() {
  const rows = new Map();
  const gates = { findOne: async ({ _id }) => structuredClone(rows.get(_id)),
    insertOne: async row => { if (rows.has(row._id)) throw Error('duplicate'); rows.set(row._id, structuredClone(row)); },
    replaceOne: async (query, row) => {
      const current = rows.get(query._id);
      if (!current || !Object.entries(query).every(([key, value]) => canonical(current[key]) ===
          canonical(value && typeof value === 'object' && '$eq' in value ? value.$eq : value))) return;
      rows.set(row._id, structuredClone(row));
    } };
  return { rows, options: { gates, boardId: 'board', migrationId: randomUUID() } };
}
test('migration drains existing legacy writers and refuses new ones before switching modes', async () => {
  const f = fixture(); let entered, release;
  const started = new Promise(resolve => { entered = resolve; });
  const waiting = new Promise(resolve => { release = resolve; });
  const running = write({ ...f.options, writeLegacy: async ({ assertCurrent }) => {
    entered(); await waiting; await assertCurrent(); return 'legacy result';
  }, writeCoordinated: () => assert.fail() });
  await started;
  await assert.rejects(begin(f.options), /writers-pending/);
  await assert.rejects(write({ ...f.options, writeLegacy: () => assert.fail('must not admit new writer'),
    writeCoordinated: () => assert.fail() }), /migration-busy/);
  release(); assert.equal(await running, 'legacy result');
  const migration = await begin(f.options); await migration.assertExclusive();
  await assert.rejects(finish({ ...f.options, assertHeadReady: async () => { throw Error('head invalid'); } }), /head invalid/);
  await migration.assertExclusive();
  assert.equal(await finish({ ...f.options, assertHeadReady: async () => {} }), f.options.migrationId);
  await assert.rejects(migration.assertExclusive(), /ownership-lost/);
  assert.equal(await write({ ...f.options, writeLegacy: () => assert.fail(), writeCoordinated: async () => 'new result' }), 'new result');
});
test('uncertain failed writes retain tokens and keep migration closed without expiry', async () => {
  const f = fixture();
  await assert.rejects(write({ ...f.options, writeLegacy: async () => { throw Error('lost reply'); },
    writeCoordinated: () => assert.fail() }), /lost reply/);
  assert.equal([...f.rows.values()][0].writers.length, 1);
  await assert.rejects(begin(f.options), /writers-pending/);
  assert.equal([...f.rows.values()][0].mode, 'draining');
});
test('same migration resumes after restart while a different owner cannot take over', async () => {
  const f = fixture(); await begin(f.options);
  await assert.rejects(begin({ ...f.options, migrationId: randomUUID() }), /migration-owned/);
  const resumed = await begin(f.options); await resumed.assertExclusive();
  await finish({ ...f.options, assertHeadReady: async () => {} });
  assert.equal((await begin(f.options)).complete, true);
});
test('lost compare-and-swap replies reconcile writer admission, release and migration', async () => {
  const f = fixture(), replace = f.options.gates.replaceOne;
  f.options.gates.replaceOne = async (...args) => { await replace(...args); throw Error('lost reply'); };
  let writes = 0;
  await write({ ...f.options, writeLegacy: async () => { writes++; }, writeCoordinated: () => assert.fail() });
  assert.equal(writes, 1); assert.equal([...f.rows.values()][0].writers.length, 0);
  await begin(f.options); await finish({ ...f.options, assertHeadReady: async () => {} });
  assert.equal([...f.rows.values()][0].mode, 'coordinated');
});
test('malformed gate evidence prevents callbacks', async () => {
  const f = fixture(); await begin(f.options);
  [...f.rows.values()][0].writers = [randomUUID()];
  await assert.rejects(write({ ...f.options, writeLegacy: () => assert.fail(), writeCoordinated: () => assert.fail() }), /gate-invalid/);
});

const { inspectHistoryWriters, retireHistoryWriter: retire } = require('../server/lib/historyWriterGate');
async function uncertain(f) {
  let writerId;
  await assert.rejects(write({ ...f.options, writeLegacy: async writer => {
    writerId = writer.writerId; throw Error('uncertain');
  }, writeCoordinated: () => assert.fail() }), /uncertain/);
  return writerId;
}
test('offline recovery retires one exact token, preserves other evidence and permits later migration', async () => {
  const f = fixture();
  assert.equal(await inspectHistoryWriters(f.options), null);
  assert.equal(f.rows.size, 0);
  const first = await uncertain(f), second = await uncertain(f);
  await assert.rejects(begin(f.options), /writers-pending/);
  const options = { ...f.options, writerId: first, assertOffline: async () => {} };
  await assert.rejects(retire({ ...options, migrationId: randomUUID() }), /recovery-state/);
  await assert.rejects(retire({ ...options, assertOffline: undefined }), /invalid/);
  await assert.rejects(retire({ ...options, assertOffline: async () => { throw Error('writers running'); } }), /writers running/);
  assert.deepEqual((await inspectHistoryWriters(f.options)).writers, [first, second]);
  const replace = f.options.gates.replaceOne;
  f.options.gates.replaceOne = async (...args) => { await replace(...args); throw Error('lost reply'); };
  assert.deepEqual((await retire(options)).writers, [second]);
  assert.deepEqual((await retire(options)).writers, [second]);
  await assert.rejects(begin(f.options), /writers-pending/);
  await retire({ ...options, writerId: second });
  await (await begin(f.options)).assertExclusive();
  await assert.rejects(retire(options), /recovery-state/);
});
test('offline recovery refuses concurrent changes and never removes unrelated tokens', async () => {
  const f = fixture(), writerId = await uncertain(f), added = randomUUID();
  const replace = f.options.gates.replaceOne;
  f.options.gates.replaceOne = async (...args) => {
    [...f.rows.values()][0].writers.push(added); await replace(...args);
  };
  await assert.rejects(retire({ ...f.options, migrationId: null, writerId,
    assertOffline: async () => {} }), /recovery-conflict/);
  assert.deepEqual((await inspectHistoryWriters(f.options)).writers, [writerId, added]);
});
test('recovery CLI defaults to inspection and requires explicit offline retirement', () => {
  const { parse } = require('../releases/recover-history-writer.cjs');
  assert.equal(parse(['--board', 'b']).writerId, undefined);
  assert.equal(parse(['--null-board']).boardId, null);
  assert.equal(parse(['--board', 'b', '--retire', randomUUID(), '--offline']).offline, true);
  for (const args of [[], ['--board'], ['--board', 'b', '--null-board'],
    ['--board', 'b', '--retire', randomUUID()], ['--board', 'b', '--board', 'c'],
    ['--board', 'b', '--migration', randomUUID()], ['--oops']]) assert.throws(() => parse(args));
});
test('migration requires deployment exclusion and CLI rejects ambiguous maintenance actions', async () => {
  const { migrateHistoryChain } = require('../server/lib/historyChainMigration');
  const f = fixture();
  await assert.rejects(migrateHistoryChain(f.options), /deployment-guard-required/);
  await assert.rejects(migrateHistoryChain({ ...f.options, assertDeploymentExclusive: async () => { throw Error('old writers'); } }), /old writers/);
  assert.equal(f.rows.size, 0);
  const { parse } = require('../releases/recover-history-writer.cjs');
  const migrationId = randomUUID();
  assert.equal(parse(['--board', 'b', '--migrate', migrationId, '--offline']).migrationId, migrationId);
  for (const args of [['--board', 'b', '--migrate', migrationId],
    ['--board', 'b', '--migrate', migrationId, '--retire', randomUUID(), '--offline'],
    ['--board', 'b', '--migrate', migrationId, '--migration', migrationId, '--offline']]) assert.throws(() => parse(args));
});
