'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { MongoClient, ObjectId } = require('mongodb');
const { inspectImport, recoverImport, clearRecoveryClaim } = require('../../server/lib/scrumImportRecovery');
const uri = process.env.WEKAN_SCRUM_TEST_MONGO_URL;
const cli = require.resolve('../../releases/recover-scrum-import.cjs');

test('recovery CLI rejects incomplete actions before opening a database', () => {
  for (const args of [['--board'], ['--board', 'b', '--clear-claim'], ['--board', 'b', '--apply'],
    ['--board', 'b', '--clear-claim', 't'], ['--board', 'b', '--unknown']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8',
      env: { ...process.env, MONGO_URL: 'mongodb://private-user:private-password@invalid/database' } });
    assert.equal(result.status, 1); assert.doesNotMatch(result.stderr + result.stdout, /private-user|private-password/);
  }
});

test('offline recovery validates whole plans, resumes write gaps and holds non-expiring claims', { skip: !uri }, async t => {
  const client = new MongoClient(uri); await client.connect();
  const db = client.db(`scrum_recovery_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const steps = [
    { kind: 'insert', collection: 'sprints', after: { _id: 's', boardId: 'b', name: 'Imported', revision: 1, scrumImportPending: true, createdAt: new Date('2026-09-01') } },
    { kind: 'update', collection: 'cards', boardId: 'b', id: 'c', before: {}, after: { scrum: { sprintId: 's' }, scrumRevision: 1 } },
    { kind: 'update', collection: 'boards', boardId: 'b', id: 'b', before: {}, after: { scrum: { enabled: true }, scrumRevision: 1, scrumImportLosses: [] } },
  ];
  const pending = db.collection('scrumImportPending'), journal = db.collection('scrumImportSteps'), locks = db.collection('scrumImportRecoveryLocks');
  async function seed(state = 'applying', count = steps.length) {
    for (const name of ['boards', 'cards', 'scrumSprints', 'scrumImportPending', 'scrumImportSteps', 'scrumImportRecoveryLocks']) await db.collection(name).deleteMany({});
    await db.collection('boards').insertOne({ _id: 'b', title: 'Keep board' });
    await db.collection('cards').insertOne({ _id: 'c', boardId: 'b', title: 'Keep card' });
    await pending.insertOne({ _id: 'b', operationId: 'op', state, total: steps.length, next: 0 });
    await journal.insertMany(steps.slice(0, count).map((step, index) => ({ _id: `op:${index}`, operationId: 'op', boardId: 'b', index, step: structuredClone(step) })));
  }
  const run = database => recoverImport(database || db, 'b', { apply: true, offline: true });
  async function unlock() {
    const report = await recoverImport(db, 'b');
    assert.equal(report.canResume, false); assert.ok(report.claimToken);
    await assert.rejects(clearRecoveryClaim(db, 'b', 'stale-token', { offline: true }), /changed/);
    await assert.rejects(clearRecoveryClaim(db, 'b', report.claimToken), /Offline/);
    await clearRecoveryClaim(db, 'b', report.claimToken, { offline: true });
  }
  await seed();
  const report = await recoverImport(db, 'b');
  assert.equal(report.changed, false); assert.equal(report.canResume, true);
  assert.equal(await locks.countDocuments({}), 0);
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
  await assert.rejects(recoverImport(db, 'b', { apply: true }), /Stop all/);
  // Reject a later conflict before inserting even the first sprint.
  await db.collection('cards').updateOne({ _id: 'c' }, { $set: { scrum: { sprintId: 'edited' } } });
  await assert.rejects(run(), /metadata target changed/);
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
  await assert.rejects(run(), /claim exists/);
  await unlock();
  await seed('preparing', 2);
  await assert.rejects(run(), /incomplete/);
  assert.equal((await pending.findOne({ _id: 'b' })).state, 'preparing');
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
  await seed('preparing');
  assert.equal((await run()).state, 'completed');
  assert.equal(await pending.countDocuments({}), 0); assert.equal(await journal.countDocuments({}), 0);
  assert.equal(await locks.countDocuments({}), 0);
  assert.equal((await db.collection('scrumSprints').findOne({ _id: 's' })).scrumImportPending, undefined);
  assert.equal((await db.collection('cards').findOne({ _id: 'c' })).title, 'Keep card');

  // An acknowledged target write with an unadvanced checkpoint is replayable.
  await seed();
  const faultDb = { collection(name) {
    if (name !== 'scrumImportPending') return db.collection(name);
    return new Proxy(pending, { get(target, key) {
      if (key === 'updateOne') return async () => { throw new Error('Lost acknowledgement'); };
      return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
    } });
  } };
  await assert.rejects(run(faultDb), /Lost acknowledgement/);
  assert.equal((await pending.findOne({ _id: 'b' })).next, 0);
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 1);
  await unlock(); await run();
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 1);

  // Resume a stop after all data writes and partial marker cleanup.
  await seed();
  await db.collection('scrumSprints').insertOne({ ...steps[0].after });
  await db.collection('cards').updateOne({ _id: 'c' }, { $set: steps[1].after });
  await db.collection('boards').updateOne({ _id: 'b' }, { $set: steps[2].after });
  await db.collection('scrumSprints').updateOne({ _id: 's' }, { $unset: { scrumImportPending: '' } });
  await pending.updateOne({ _id: 'b' }, { $set: { state: 'applied', next: 3 } });
  assert.equal((await run()).state, 'completed');

  await seed();
  const cleanupFailure = { collection(name) {
    if (name !== 'scrumImportSteps') return db.collection(name);
    return new Proxy(journal, { get(target, key) {
      if (key === 'deleteMany') return async () => {
        await target.deleteOne({ _id: 'op:0' });
        throw new Error('Interrupted plan cleanup');
      };
      return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
    } });
  } };
  await assert.rejects(run(cleanupFailure), /Interrupted plan cleanup/);
  assert.equal((await pending.findOne({ _id: 'b' })).state, 'cleaning');
  await unlock();
  // Cleanup must neither require deleted plan rows nor replay target writes.
  await db.collection('cards').updateOne({ _id: 'c' }, { $set: { title: 'Retain later title' } });
  await run();
  assert.equal((await db.collection('cards').findOne({ _id: 'c' })).title, 'Retain later title');
  assert.equal(await journal.countDocuments({}), 0);

  // Corrupt or cross-board plans must never become write authority.
  for (const change of [
    () => journal.updateOne({ _id: 'op:1' }, { $set: { 'step.boardId': 'foreign' } }),
    () => journal.updateOne({ _id: 'op:1' }, { $set: { 'step.after.members': [] } }),
    () => pending.updateOne({ _id: 'b' }, { $set: { next: 1 } }),
    () => db.collection('cards').updateOne({ _id: 'c' }, { $set: { boardId: 'foreign' } }),
  ]) {
    await seed(); await change(); await assert.rejects(inspectImport(db, 'b'));
    assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
  }

  await seed();
  let release, claimed;
  const gate = new Promise(resolve => { release = resolve; });
  const acquired = new Promise(resolve => { claimed = resolve; });
  const paused = { collection(name) {
    const raw = db.collection(name);
    if (name !== 'boards') return raw;
    return new Proxy(raw, { get(target, key) {
      if (key === 'findOne') return async (...args) => { claimed(); await gate; return target.findOne(...args); };
      return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
    } });
  } };
  const first = run(paused); await acquired;
  try { await assert.rejects(run(), /claim exists/); } finally { release(); }
  await first;

  // Exercise the actual command, with an explicit isolated database URI.
  await seed(); const url = new URL(uri); url.pathname = `/${db.databaseName}`;
  const result = spawnSync(process.execPath, [cli, '--board', 'b', '--apply', '--offline'], {
    encoding: 'utf8', env: { ...process.env, MONGO_URL: url.toString() }, timeout: 15000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).state, 'completed');
  assert.equal(JSON.parse(result.stdout).scope, 'scrum');
});
