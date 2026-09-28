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
