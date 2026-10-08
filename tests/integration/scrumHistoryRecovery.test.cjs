'use strict';
// A Scrum History undo or redo that stopped on a conflict, resolved against a
// real MongoDB (server/lib/scrumHistoryRecovery.js and the offline command
// releases/recover-scrum-history.cjs). Run with a database:
//   WEKAN_SCRUM_TEST_MONGO_URL=mongodb://127.0.0.1:27017 node --test tests/integration/scrumHistoryRecovery.test.cjs
// Without one, only the command's argument checks run. The same decisions
// without a database: tests/scrumHistoryRecovery.test.cjs.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { MongoClient, ObjectId } = require('mongodb');
const { inspectScrumHistoryCheckpoint: inspect, resolveScrumHistoryCheckpoint: resolve } =
  require('../../server/lib/scrumHistoryRecovery');
const { claimScrumHistoryWorker, assertScrumHistoryOperation } = require('../../server/lib/scrumHistoryOwnership');
const { scrumHistoryFixture } = require('../scrumHistoryRecoveryFixture.cjs');
const uri = process.env.WEKAN_SCRUM_TEST_MONGO_URL;
const cli = require.resolve('../../releases/recover-scrum-history.cjs');

test('the offline command refuses incomplete or online mutations before opening a database', () => {
  for (const args of [[], ['--board'], ['--board', 'b', '--apply'], ['--board', 'b', '--apply', '--offline'],
    ['--board', 'b', '--rollback', '--apply', '--offline'], ['--board', 'b', '--discard', '--checkpoint', 'op', '--apply'],
    ['--board', 'b', '--checkpoint', 'op'], ['--board', 'b', '--offline'], ['--board', 'b', '--rollback', '--discard'],
    ['--board', 'b', '--unknown']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8',
      env: { ...process.env, MONGO_URL: 'mongodb://private-user:private-password@invalid/database' } });
    assert.equal(result.status, 1, args.join(' '));
    assert.doesNotMatch(result.stderr + result.stdout, /private-user|private-password/);
  }
});

async function database(t, prefix) {
  const client = await new MongoClient(uri).connect();
  const db = client.db(`${prefix}_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  return { client, db };
}
async function seed(db, setup = {}) {
  for (const name of ['boards', 'users', 'cards', 'scrumSprints', 'changeHistory', 'scrumHistoryPending', 'scrumBatchJobs', 'recoveryEvents']) {
    await db.collection(name).deleteMany({});
  }
  const f = scrumHistoryFixture(setup);
  for (const [name, docs] of Object.entries(f.collections)) if (docs.length) await db.collection(name).insertMany(docs);
  return f;
}
const online = { online: true, settleMs: 0 };

test('a conflicted checkpoint rolls back to its "before" values, once', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  // The undo wrote the card, then stopped on a conflict its retries keep meeting.
  await seed(db, { applied: ['card'], lastFailure: 'scrum-conflict' });
  const report = await inspect(db, 'b');
  assert.equal(report.stuck, true); assert.deepEqual(report.reasons, ['retry-failed']);
  assert.deepEqual([report.total, report.applied, report.pending, report.conflicted], [2, 1, 1, 0]);
  assert.equal(report.canRollback, true); assert.equal(report.key, 'op');
  assert.equal(JSON.stringify(report).includes('Keep this title'), false, 'no record contents');
  const result = await resolve(db, 'b', { action: 'rollback', key: 'op', ...online, actor: 'admin' });
  assert.equal(result.state, 'rolled-back'); assert.equal(result.reverted, 1); assert.equal(result.removedRecords, 0);
  const card = await db.collection('cards').findOne({ _id: 'c1' });
  assert.deepEqual(card.scrum, { sprintId: 's1' }); assert.equal(card.scrumRevision, 3);
  assert.equal(card.title, 'Keep this title', 'fields outside History are untouched');
  assert.equal((await db.collection('scrumSprints').findOne({ _id: 's1' })).revision, 2);
  assert.equal(await db.collection('scrumHistoryPending').countDocuments({}), 0);
  // Retried, or sent by a second administrator: a no-op, never another checkpoint.
  assert.deepEqual(await resolve(db, 'b', { action: 'rollback', key: 'op', ...online }),
    { changed: false, state: 'absent', action: 'rollback', key: 'op' });
  await seed(db, { operationId: 'next', lastFailure: 'scrum-conflict' });
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).changed, false);
  assert.ok(await db.collection('scrumHistoryPending').findOne({ _id: 'b', operationId: 'next' }), 'a newer checkpoint is left alone');
});

test('a rollback re-creates what the operation deleted, same lifetime, and removes what it created', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  await seed(db, { applied: ['card', 'sprint'], lastFailure: 'invalid-scrum-reference' });
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
  const result = await resolve(db, 'b', { action: 'rollback', key: 'op', ...online });
  assert.equal(result.reverted, 2);
  const sprint = await db.collection('scrumSprints').findOne({ _id: 's1' });
  assert.equal(sprint.incarnation, 'inc1'); assert.equal(sprint.revision, 2); assert.equal(sprint.name, 'Sprint one');
  // A redo that created the sprint: rolling back removes exactly that sprint.
  await seed(db, { direction: 'redo', applied: ['card', 'sprint'], lastFailure: 'scrum-conflict' });
  const created = await db.collection('scrumSprints').findOne({ _id: 's1' });
  assert.ok(created);
  const undone = await resolve(db, 'b', { action: 'rollback', key: 'op', ...online });
  assert.equal(undone.removedRecords, 1);
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 0);
  assert.deepEqual((await db.collection('cards').findOne({ _id: 'c1' })).scrum, {});
});

test('records someone else changed allow only a discard, which writes nothing', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  await seed(db, { applied: ['card'], conflict: 'sprint' });
  const report = await inspect(db, 'b');
  assert.deepEqual(report.reasons, ['target-conflict']); assert.equal(report.conflicted, 1);
  assert.equal(report.canRollback, false); assert.match(report.rollbackBlocked, /overwrite/);
  await assert.rejects(resolve(db, 'b', { action: 'rollback', key: 'op', ...online }), /overwrite/);
  const before = await db.collection('scrumSprints').findOne({ _id: 's1' });
  const checkpoint = await db.collection('scrumHistoryPending').findOne({ _id: 'b' });
  assert.equal(checkpoint.resolving, undefined, 'a refused rollback claims nothing');
  const result = await resolve(db, 'b', { action: 'discard', key: 'op', ...online });
  assert.equal(result.state, 'discarded'); assert.equal(result.applied, 1); assert.equal(result.conflicted, 1);
  assert.deepEqual(await db.collection('scrumSprints').findOne({ _id: 's1' }), before);
  assert.deepEqual((await db.collection('cards').findOne({ _id: 'c1' })).scrum, {}, 'the written half stays, and is reported');
  assert.equal(await db.collection('scrumHistoryPending').countDocuments({}), 0);
  // Discard twice: a no-op.
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).changed, false);
});

test('a checkpoint that has not stopped on a conflict is its author\'s to retry', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  await seed(db, { applied: ['card'] });
  const report = await inspect(db, 'b');
  assert.equal(report.stuck, false); assert.equal(report.canDiscard, false); assert.equal(report.canRollback, false);
  for (const action of ['discard', 'rollback']) {
    await assert.rejects(resolve(db, 'b', { action, key: 'op', ...online }), /author can retry/);
  }
  const offline = await resolve(db, 'b', { action: 'discard', key: 'op', offline: true }).catch(error => error);
  assert.match(offline.message, /author can retry/, 'offline too');
  const kept = await db.collection('scrumHistoryPending').findOne({ _id: 'b' });
  assert.equal(kept.worker, 'author-worker'); assert.equal(kept.resolving, undefined);
  assert.deepEqual((await db.collection('cards').findOne({ _id: 'c1' })).scrum, {});
  // Each of these alone makes it stuck.
  for (const [setup, reason] of [[{ damagedRow: true }, 'source-changed'], [{ authorRemoved: true }, 'author-cannot-retry'],
    [{ lastFailure: 'not-authorized' }, 'retry-failed'], [{ malformed: true }, 'malformed']]) {
    await seed(db, setup);
    assert.deepEqual((await inspect(db, 'b')).reasons, [reason]);
  }
  // A transient failure (finalization, a displaced worker) is not a conflict.
  await seed(db, { lastFailure: 'scrum-history-pending' });
  assert.equal((await inspect(db, 'b')).stuck, false);
});

test('History already written for the operation blocks a rollback', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  await seed(db, { applied: ['card', 'sprint'], damagedRow: true, restoredRow: true });
  const report = await inspect(db, 'b');
  assert.equal(report.historyRecorded, true); assert.match(report.rollbackBlocked, /History records/);
  await assert.rejects(resolve(db, 'b', { action: 'rollback', key: 'op', ...online }), /History records/);
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).state, 'discarded');
});

test('the claim fences the author\'s worker, and claims and leases are honoured', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  const store = db.collection('scrumHistoryPending');
  const adapter = { findOneAsync: query => store.findOne(query),
    updateAsync: async (query, modifier) => (await store.updateOne(query, modifier)).matchedCount };
  await seed(db, { applied: ['card'], lastFailure: 'scrum-conflict' });
  const journal = await store.findOne({ _id: 'b' });
  let fenced = false;
  await resolve(db, 'b', { action: 'rollback', key: 'op', online: true, settleMs: 1, sleep: async () => {
    // During the settle: the author's retry can neither resume nor finish it.
    await assert.rejects(claimScrumHistoryWorker(adapter, journal, 'author-retry'), /conflict/);
    await assert.rejects(assertScrumHistoryOperation(adapter, journal), /conflict/);
    fenced = true;
  } });
  assert.ok(fenced);
  // An online resolution in progress elsewhere is waited for; one left by a
  // crash is taken over once its lease ran out; an offline one stays offline.
  await seed(db, { lastFailure: 'scrum-conflict', resolving: { token: 'other', action: 'discard', offline: false, at: new Date() } });
  await assert.rejects(resolve(db, 'b', { action: 'discard', key: 'op', ...online }), /Another administrator/);
  await seed(db, { lastFailure: 'scrum-conflict', resolving: { token: 'other', action: 'discard', offline: true, at: new Date(0) } });
  await assert.rejects(resolve(db, 'b', { action: 'discard', key: 'op', ...online }), /finish it offline/);
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', offline: true })).state, 'discarded');
  await seed(db, { lastFailure: 'scrum-conflict', resolving: { token: 'other', action: 'discard', offline: false, at: new Date(0) } });
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).state, 'discarded');
  await assert.rejects(resolve(db, 'b', { action: 'discard', key: 'op' }), /offline recovery/);
  await assert.rejects(resolve(db, 'b', { action: 'delete', key: 'op', ...online }), /rollback or discard/);
});

test('a write that lands during the resolution stops it and keeps the checkpoint', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  await seed(db, { conflict: 'sprint' });
  // A displaced worker's write, already past its guard, lands after the
  // resolver looked: the final check sees it.
  const stray = { collection(name) {
    const collection = db.collection(name);
    if (name !== 'scrumBatchJobs') return collection;
    return { findOne: async (...args) => {
      await db.collection('cards').updateOne({ _id: 'c1' }, { $set: { scrum: {}, scrumRevision: 4 } });
      return collection.findOne(...args);
    }, deleteOne: (...args) => collection.deleteOne(...args) };
  } };
  await assert.rejects(resolve(stray, 'b', { action: 'discard', key: 'op', ...online }), /changed while/);
  const kept = await db.collection('scrumHistoryPending').findOne({ _id: 'b' });
  assert.ok(kept); assert.equal(kept.resolving, undefined, 'released for the next attempt');
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).state, 'discarded');
});

test('two servers resolving at once: one does it, the other changes nothing', { skip: !uri }, async t => {
  const { client, db } = await database(t, 'scrum_history_recovery');
  const second = await new MongoClient(uri).connect();
  t.after(() => second.close());
  await seed(db, { applied: ['card', 'sprint'], lastFailure: 'scrum-conflict' });
  const outcomes = await Promise.allSettled([db, second.db(db.databaseName)].map(target =>
    resolve(target, 'b', { action: 'rollback', key: 'op', ...online })));
  const done = outcomes.filter(outcome => outcome.status === 'fulfilled' && outcome.value.changed);
  assert.equal(done.length, 1, JSON.stringify(outcomes.map(o => o.reason?.message || o.value?.state)));
  const other = outcomes.find(outcome => outcome !== done[0]);
  assert.ok(other.status === 'rejected' ? /Another|claimed|took over/.test(other.reason.message) : !other.value.changed);
  assert.equal(await db.collection('scrumHistoryPending').countDocuments({}), 0);
  const sprint = await db.collection('scrumSprints').findOne({ _id: 's1' });
  assert.equal(sprint.revision, 2);
  assert.equal(await db.collection('scrumSprints').countDocuments({}), 1);
  assert.ok(client);
});

test('a discard ends the stopped large undo of the same batch, and nobody else\'s job', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_recovery');
  await seed(db, { conflict: 'sprint', job: { state: 'failed', userId: 'author', direction: 'undo' } });
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).batchJobRemoved, true);
  assert.equal(await db.collection('scrumBatchJobs').countDocuments({}), 0);
  await seed(db, { conflict: 'sprint', job: { state: 'running', userId: 'author', direction: 'undo' } });
  assert.equal((await resolve(db, 'b', { action: 'discard', key: 'op', ...online })).batchJobRemoved, false);
  assert.equal(await db.collection('scrumBatchJobs').countDocuments({}), 1);
});

test('the offline command inspects, then resolves exactly the inspected checkpoint and records it', { skip: !uri }, async t => {
  const { db } = await database(t, 'scrum_history_cli');
  await seed(db, { applied: ['card'], lastFailure: 'scrum-conflict' });
  const url = new URL(uri); url.pathname = `/${db.databaseName}`;
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8',
    env: { ...process.env, MONGO_URL: url.toString() } });
  const inspected = run('--board', 'b');
  assert.equal(inspected.status, 0, inspected.stderr);
  const report = JSON.parse(inspected.stdout);
  assert.equal(report.key, 'op'); assert.equal(report.canRollback, true);
  assert.equal(await db.collection('scrumHistoryPending').countDocuments({ resolving: { $exists: true } }), 0, 'inspection writes nothing');
  const wrong = run('--board', 'b', '--rollback', '--checkpoint', 'other', '--apply', '--offline');
  assert.equal(JSON.parse(wrong.stdout).changed, false);
  assert.ok(await db.collection('scrumHistoryPending').findOne({ _id: 'b' }));
  const applied = run('--board', 'b', '--rollback', '--checkpoint', report.key, '--apply', '--offline');
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(applied.stdout).state, 'rolled-back');
  assert.deepEqual((await db.collection('cards').findOne({ _id: 'c1' })).scrum, { sprintId: 's1' });
  const [event] = await db.collection('recoveryEvents').find({}).toArray();
  assert.equal(event.type, 'scrum-history-checkpoint-resolved'); assert.equal(event.source, 'offline-tool');
  assert.deepEqual(event.boardIds, ['b']); assert.match(event.detail, /rolled back 1 of 2 records/);
  // A refused action exits non-zero with only the reason.
  await seed(db, { applied: ['card'], conflict: 'sprint' });
  const refused = run('--board', 'b', '--rollback', '--checkpoint', 'op', '--apply', '--offline');
  assert.equal(refused.status, 1); assert.match(refused.stderr, /overwrite/);
});
