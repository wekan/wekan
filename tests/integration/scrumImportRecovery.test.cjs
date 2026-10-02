'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { MongoClient, ObjectId } = require('mongodb');
const { inspectImport, recoverImport, clearRecoveryClaim } = require('../../server/lib/scrumImportRecovery');
const { finishImportPlan } = require('../../server/lib/scrumImportWriter');
const uri = process.env.WEKAN_SCRUM_TEST_MONGO_URL;
const cli = require.resolve('../../releases/recover-scrum-import.cjs');

test('recovery CLI rejects incomplete actions before opening a database', () => {
  for (const args of [['--board'], ['--board', 'b', '--clear-claim'], ['--board', 'b', '--apply'],
    ['--board', 'b', '--rollback', '--apply'], ['--board', 'b', '--rollback', '--rollback'],
    ['--board', 'b', '--rollback', '--clear-claim', 't', '--offline'],
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

  const undo = database => recoverImport(database || db, 'b', { apply: true, offline: true, rollback: true });
  async function applied() {
    await seed();
    await db.collection('scrumSprints').insertOne({ ...steps[0].after });
    await db.collection('cards').updateOne({ _id: 'c' }, { $set: steps[1].after });
    await db.collection('boards').updateOne({ _id: 'b' }, { $set: steps[2].after });
    await pending.updateOne({ _id: 'b' }, { $set: { state: 'applied', next: 3 } });
  }
  async function assertUndone() {
    assert.deepEqual(await db.collection('boards').findOne({ _id: 'b' }), { _id: 'b', title: 'Keep board' });
    assert.deepEqual(await db.collection('cards').findOne({ _id: 'c' }), { _id: 'c', boardId: 'b', title: 'Keep card' });
    assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
    assert.equal(await pending.countDocuments({}), 0);
    assert.equal(await journal.countDocuments({}), 0);
    assert.equal(await locks.countDocuments({}), 0);
  }
  // Normal imports retain their header until private-plan deletion succeeds.
  // Inject failures at each boundary and recover using the actual offline
  // command implementation, including a partially removed plan.
  for (const failure of ['markers', 'seal', 'plan', 'header', null]) {
    await applied();
    const adapter = name => ({
      updateAsync: async (selector, change) => {
        if (failure === 'seal') throw new Error('Interrupted normal cleanup');
        return (await db.collection(name).updateOne(selector, change)).matchedCount;
      },
      removeAsync: async selector => {
        if (failure === 'plan' && name === 'scrumImportSteps') {
          await journal.deleteOne({ _id: 'op:0' });
          throw new Error('Interrupted normal cleanup');
        }
        if (failure === 'header' && name === 'scrumImportPending') throw new Error('Interrupted normal cleanup');
        return (await db.collection(name).deleteMany(selector)).deletedCount;
      },
    });
    const finish = () => finishImportPlan({ identity: { _id: 'b', operationId: 'op' }, total: 3,
      pending: adapter('scrumImportPending'), journal: adapter('scrumImportSteps'), clearMarkers: async () => {
        if (failure === 'markers') throw new Error('Interrupted normal cleanup');
        await db.collection('scrumSprints').updateOne({ _id: 's' }, { $unset: { scrumImportPending: '' } });
      } });
    if (failure) {
      await assert.rejects(finish(), /Interrupted normal cleanup/);
      assert.equal((await pending.findOne({ _id: 'b' })).state,
        ['markers', 'seal'].includes(failure) ? 'applied' : 'cleaning');
      await run();
    } else await finish();
    assert.equal(await pending.countDocuments({}), 0);
    assert.equal(await journal.countDocuments({}), 0);
    assert.equal((await db.collection('boards').findOne({ _id: 'b' })).scrum.enabled, true);
    assert.equal((await db.collection('scrumSprints').findOne({ _id: 's' })).scrumImportPending, undefined);
  }
  // A changed checkpoint cannot authorize plan deletion or expose the board.
  await applied();
  let deleted = false;
  await assert.rejects(finishImportPlan({ identity: { _id: 'b', operationId: 'other' }, total: 3,
    pending: { updateAsync: async (selector, change) => (await pending.updateOne(selector, change)).matchedCount },
    journal: { removeAsync: async () => { deleted = true; } }, clearMarkers: async () => {} }), /checkpoint changed/);
  assert.equal(deleted, false); assert.equal(await journal.countDocuments({}), 3);

  await applied();
  const dry = await recoverImport(db, 'b', { rollback: true });
  assert.equal(dry.canRollback, true); assert.equal(dry.changed, false);
  assert.equal(await locks.countDocuments({}), 0);
  assert.equal((await db.collection('boards').findOne({ _id: 'b' })).scrum.enabled, true);
  assert.equal((await undo()).state, 'rolled-back');
  await assertUndone();

  // Restore absent vs explicit null, arrays and existing metadata exactly;
  // unrelated card changes survive. Partial sprint marker cleanup is legal.
  await applied();
  const before = { scrum: null, scrumRevision: 0 };
  await journal.updateOne({ _id: 'op:1' }, { $set: { 'step.before': before } });
  await db.collection('cards').updateOne({ _id: 'c' }, { $set: { title: 'Later title', labels: ['keep'] } });
  await db.collection('scrumSprints').updateOne({ _id: 's' }, { $unset: { scrumImportPending: '' } });
  await undo();
  assert.deepEqual(await db.collection('cards').findOne({ _id: 'c' }),
    { _id: 'c', boardId: 'b', title: 'Later title', labels: ['keep'], ...before });

  // A partially staged plan never touched any destination; even zero rows
  // can be discarded without synthesizing or applying a missing step.
  for (const count of [0, 2, 3]) {
    await seed('preparing', count || 1);
    if (!count) await journal.deleteMany({});
    await undo(); await assertUndone();
  }
  // Lost forward-write acknowledgement: only the possibly attempted next
  // step may already contain its after value.
  await seed(); await db.collection('scrumSprints').insertOne({ ...steps[0].after });
  await undo(); await assertUndone();
  await seed(); await db.collection('cards').updateOne({ _id: 'c' }, { $set: steps[1].after });
  await assert.rejects(undo(), /metadata target changed/);
  assert.equal((await pending.findOne({ _id: 'b' })).state, 'applying');

  // A late conflict is found before even the final board update is undone.
  for (const conflict of [
    () => db.collection('scrumSprints').updateOne({ _id: 's' }, { $set: { extra: 'keep' } }),
    () => db.collection('cards').updateOne({ _id: 'c' }, { $set: { boardId: 'foreign' } }),
    () => db.collection('cards').updateOne({ _id: 'c' }, { $set: { scrum: { sprintId: 'edited' } } }),
    () => db.collection('scrumSprints').deleteOne({ _id: 's' }),
  ]) {
    await applied(); await conflict(); await assert.rejects(undo());
    assert.equal((await db.collection('boards').findOne({ _id: 'b' })).scrum.enabled, true);
  }

  // Database accepted the undo but the caller never received progress. Every
  // reverse write (including deletion) is recognizable and retryable.
  for (const stopAt of [2, 1, 0]) {
    await applied();
    const interrupted = { collection(name) {
      if (name !== 'scrumImportPending') return db.collection(name);
      return new Proxy(pending, { get(target, key) {
        if (key === 'updateOne') return async (selector, change) => {
          if (selector.state === 'rolling-back' && change.$set.rollbackNext === stopAt) throw new Error('Lost undo acknowledgement');
          return target.updateOne(selector, change);
        };
        return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
      } });
    } };
    await assert.rejects(undo(interrupted), /Lost undo acknowledgement/);
    assert.equal((await pending.findOne({ _id: 'b' })).rollbackNext, stopAt + 1);
    await unlock();
    await assert.rejects(run(), /continue with --rollback/);
    await unlock();
    await undo(); await assertUndone();
  }

  // The exact-document delete rejects even an added field between inspection
  // and deletion; no deletion may erase it. The failed claim stays held.
  await applied();
  const changedAtDelete = { collection(name) {
    const raw = db.collection(name);
    if (name !== 'scrumSprints') return raw;
    return new Proxy(raw, { get(target, key) {
      if (key === 'deleteOne') return async selector => {
        await target.updateOne({ _id: 's' }, { $set: { note: 'concurrent change' } });
        return target.deleteOne(selector);
      };
      return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
    } });
  } };
  await assert.rejects(undo(changedAtDelete), /target changed/);
  assert.equal((await db.collection('scrumSprints').findOne({ _id: 's' })).note, 'concurrent change');
  assert.equal(await locks.countDocuments({}), 1);

  await applied();
  const changedAtUpdate = { collection(name) {
    const raw = db.collection(name);
    if (name !== 'cards') return raw;
    return new Proxy(raw, { get(target, key) {
      if (key === 'updateOne') return async (selector, change) => {
        await target.updateOne({ _id: 'c' }, { $set: { scrum: { sprintId: 'keep-edit' } } });
        return target.updateOne(selector, change);
      };
      return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
    } });
  } };
  await assert.rejects(undo(changedAtUpdate), /metadata target changed/);
  assert.deepEqual((await db.collection('cards').findOne({ _id: 'c' })).scrum, { sprintId: 'keep-edit' });
  assert.equal((await pending.findOne({ _id: 'b' })).rollbackNext, 2);
  await unlock();
  await assert.rejects(undo(), /metadata target changed/);

  // Invalid cursors and previously undone targets reappearing cannot be
  // mistaken for another lost acknowledgement.
  for (const change of [
    { state: 'rolling-back', rollbackFrom: 'applied', rollbackNext: -1 },
    { state: 'rolling-back', rollbackFrom: 'preparing', rollbackNext: 3 },
    { state: 'rolling-back', rollbackFrom: 'applied', rollbackNext: 0 },
    { state: 'rollback-cleaning', rollbackFrom: 'applied', rollbackNext: 1 },
  ]) {
    await applied(); await pending.updateOne({ _id: 'b' }, { $set: change });
    await assert.rejects(undo());
    assert.equal(await db.collection('scrumSprints').countDocuments({}), 1);
  }

  await applied();
  await assert.rejects(undo(cleanupFailure), /Interrupted plan cleanup/);
  assert.equal((await pending.findOne({ _id: 'b' })).state, 'rollback-cleaning');
  await unlock(); await undo(); await assertUndone();
  await applied();
  await pending.updateOne({ _id: 'b' }, { $set: { state: 'cleaning' } });
  await assert.rejects(undo(), /rollback is no longer available/);

  await applied();
  const undoResult = spawnSync(process.execPath, [cli, '--board', 'b', '--rollback', '--apply', '--offline'], {
    encoding: 'utf8', env: { ...process.env, MONGO_URL: url.toString() }, timeout: 15000,
  });
  assert.equal(undoResult.status, 0, undoResult.stderr);
  assert.equal(JSON.parse(undoResult.stdout).state, 'rolled-back');
  await assertUndone();

  // Every planned collection is covered, including reference containers and
  // daily observations. Original arrays and nulls retain BSON types/presence.
  await applied();
  const extra = [];
  for (const [collection, name] of [['releases', 'scrumReleases'], ['events', 'scrumEvents'],
    ['dailyObservations', 'scrumDailySnapshots']]) {
    const after = { _id: collection, boardId: 'b', at: new Date('2026-09-02'), observations: [1, null] };
    extra.push({ kind: 'insert', collection, after });
    await db.collection(name).insertOne({ ...after });
    await db.collection(name).insertOne({ _id: 'unrelated', boardId: 'other', name: 'Keep' });
  }
  for (const collection of ['lists', 'swimlanes']) {
    const step = { kind: 'update', collection, id: collection, boardId: 'b',
      before: { scrum: { releases: ['original'], estimate: null } },
      after: { scrum: { releases: [] }, scrumRevision: 1 } };
    extra.push(step);
    await db.collection(collection).insertOne({ _id: collection, boardId: 'b', title: 'Keep', ...step.after });
  }
  const all = [steps[0], steps[1], ...extra, steps[2]];
  await journal.deleteMany({});
  await journal.insertMany(all.map((step, index) => ({ _id: `op:${index}`, boardId: 'b', operationId: 'op', index, step })));
  await pending.updateOne({ _id: 'b' }, { $set: { total: all.length, next: all.length } });
  await undo(); await assertUndone();
  for (const name of ['scrumReleases', 'scrumEvents', 'scrumDailySnapshots']) {
    assert.deepEqual(await db.collection(name).find({}).toArray(), [{ _id: 'unrelated', boardId: 'other', name: 'Keep' }]);
  }
  for (const collection of ['lists', 'swimlanes']) {
    assert.deepEqual(await db.collection(collection).findOne({ _id: collection }),
      { _id: collection, boardId: 'b', title: 'Keep', scrum: { releases: ['original'], estimate: null } });
  }
});

// Online recovery (2026-10-02): the import's writer holds a renewable lease on
// its checkpoint; once it runs out the recovery takes the checkpoint over and
// finishes it with WeKan running, and the old writer is fenced out.
test('online recovery waits for the writer\'s lease, takes over, and fences the old writer out', { skip: !uri }, async t => {
  const { writeImportPlan } = require('../../server/lib/scrumImportWriter');
  const { discardPreparingImport } = require('../../server/lib/scrumImportRecovery');
  const client = new MongoClient(uri); await client.connect();
  const db = client.db(`scrum_online_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const steps = [
    { kind: 'insert', collection: 'sprints', after: { _id: 's', boardId: 'b', name: 'Imported', revision: 1, scrumImportPending: true } },
    { kind: 'update', collection: 'cards', boardId: 'b', id: 'c', before: {}, after: { scrum: { sprintId: 's' }, scrumRevision: 1 } },
    { kind: 'update', collection: 'boards', boardId: 'b', id: 'b', before: {}, after: { scrum: { enabled: true }, scrumRevision: 1, scrumImportLosses: [] } },
  ];
  await db.collection('boards').insertOne({ _id: 'b', title: 'Board' });
  await db.collection('cards').insertOne({ _id: 'c', boardId: 'b', title: 'Card' });
  const adapt = name => { const raw = db.collection(name); const c = {
    insertAsync: doc => raw.insertOne({ ...doc }), findOneAsync: id => raw.findOne(typeof id === 'string' ? { _id: id } : id),
    updateAsync: async (s, m) => (await raw.updateOne(s, m)).matchedCount, removeAsync: async s => (await raw.deleteMany(s)).deletedCount };
  c.direct = c; return c; };
  const collections = { boards: adapt('boards'), cards: adapt('cards'), sprints: adapt('scrumSprints') };
  // The writer stops after its first step, as a crash would.
  const crashing = { ...collections, cards: { ...collections.cards, direct: { updateAsync: async () => { throw new Error('crash'); } } } };
  let clock = new Date('2026-10-02T10:00:00Z');
  await assert.rejects(writeImportPlan({ boardId: 'b', operationId: 'op', userId: 'u', steps, pending: adapt('scrumImportPending'),
    journal: adapt('scrumImportSteps'), collections: crashing, equals: require('node:util').isDeepStrictEqual,
    owner: 'writer', now: () => clock }), /crash/);
  const pending = db.collection('scrumImportPending');
  assert.equal((await pending.findOne({ _id: 'b' })).owner, 'writer');
  // Negative: while the lease runs, online recovery refuses.
  await assert.rejects(recoverImport(db, 'b', { apply: true, online: true, now: () => new Date(clock.getTime() + 60000) }),
    /still running/);
  // After it, the recovery takes over and finishes.
  const later = new Date(clock.getTime() + 3 * 60000);
  const result = await recoverImport(db, 'b', { apply: true, online: true, now: () => later });
  assert.deepEqual([result.changed, result.state], [true, 'completed']);
  assert.deepEqual((await db.collection('cards').findOne({ _id: 'c' })).scrum, { sprintId: 's' });
  assert.equal(await pending.countDocuments({}), 0);
  assert.equal((await db.collection('scrumSprints').findOne({ _id: 's' })).scrumImportPending, undefined);
  // Negative: online rollback is refused; an offline claim blocks online work.
  await pending.insertOne({ _id: 'b', operationId: 'op2', owner: 'w2', leaseUntil: new Date(0), state: 'preparing', total: 3, next: 0 });
  await assert.rejects(recoverImport(db, 'b', { apply: true, online: true, rollback: true }), /offline/);
  await db.collection('scrumImportRecoveryLocks').insertOne({ _id: 'b', token: 't' });
  await assert.rejects(discardPreparingImport(db, 'b'), /offline recovery claim/);
  await db.collection('scrumImportRecoveryLocks').deleteMany({});
  // A plan that was never fully saved is discarded online, writing nothing.
  await db.collection('scrumImportSteps').insertOne({ _id: 'op2:0', boardId: 'b', operationId: 'op2', index: 0, step: steps[0] });
  assert.deepEqual(await discardPreparingImport(db, 'b'), { changed: true, scope: 'scrum', state: 'discarded' });
  assert.equal(await db.collection('scrumImportSteps').countDocuments({ operationId: 'op2' }), 0);
  // The old writer, fenced out: its checkpoint updates name it, and no longer match.
  await pending.insertOne({ _id: 'b', operationId: 'op3', owner: 'recovery', state: 'applying', total: 3, next: 1 });
  assert.equal((await pending.updateOne({ _id: 'b', operationId: 'op3', owner: 'writer', state: 'applying', next: 1 },
    { $set: { next: 2 } })).matchedCount, 0);
  // A checkpoint from before owners existed can be taken over at once.
  await pending.deleteMany({});
  await pending.insertOne({ _id: 'b', operationId: 'legacy', state: 'cleaning', total: 1, next: 1 });
  await db.collection('scrumImportSteps').insertOne({ _id: 'legacy:0', boardId: 'b', operationId: 'legacy', index: 0,
    step: steps[2] });
  assert.equal((await recoverImport(db, 'b', { apply: true, online: true })).state, 'completed');
  assert.equal(await pending.countDocuments({}), 0);
});
