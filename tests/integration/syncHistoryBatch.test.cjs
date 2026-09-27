'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { prepareSyncFieldHistory, persistSyncFieldHistory, validateSyncFieldHistory } = require('../../server/lib/syncHistoryBatch');
const { applySyncOperationStep, syncOperationEffectId } = require('../../server/lib/syncOperationApply');
const { runSyncOperation } = require('../../server/lib/syncOperationJournal');
const { withSyncLease } = require('../../server/lib/syncLease');
const { hashHistoryRow, rowHashIsValid, verifyHistoryRows } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('persisted Sync History plans resume between event rows before journal completion', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(); const db = client.db(`sync_history_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const operations = db.collection('operations'), steps = db.collection('steps'), completions = db.collection('completions');
  const cards = db.collection('cards'), events = db.collection('history');
  const before = { _id: 'card', boardId: 'board', listId: 'list', title: 'Before', description: 'Before' };
  const step = { kind: 'update', cardId: 'card', before, after: { ...before, title: 'After', description: 'After' } };
  await cards.insertOne(before);
  const old = { _id: 'old', boardId: 'board', userId: 'author', entityId: 'card', entityType: 'card',
    createdAt: new Date(0), undone: true, undoneAt: new Date(10), superseded: false };
  old.integrityHash = hashHistoryRow(old); await events.insertOne(old);
  const later = { ...old, _id: 'later', entityId: 'other-card', createdAt: new Date(5),
    previousHash: old.integrityHash, undone: false, undoneAt: null };
  later.integrityHash = hashHistoryRow(later); await events.insertOne(later);
  let inserts = 0, builds = 0, interrupt = true;
  const history = { findOneAsync: query => events.findOne(typeof query === 'string' ? { _id: query } : query),
    updateAsync: async (...args) => { await events.updateOne(...args); },
    insertAsync: async row => {
      if (interrupt && inserts === 1) throw new Error('History interrupted');
      inserts++; await events.insertOne(row); return row._id;
    } };
  const intentId = randomUUID();
  const run = (overrides = {}) => withSyncLease(db.collection('leases'), 'list', ({ assertCurrent }) => runSyncOperation({
    operations, steps, completions, intentId, assertCurrent,
    scope: { boardId: 'board', listId: 'list', incarnation: null, revision: null, sourceKey: 'source' },
    build: async context => {
      builds++; await context.assertCurrent(); assert.equal(context.intentId, intentId); return [step];
    },
    prepareEffects: (saved, context) => prepareSyncFieldHistory({ step: saved,
      effectId: syncOperationEffectId(context.operationId, context.index), userId: 'author',
      createdAt: new Date(1000), previousHash: later.integrityHash, redoRows: [old] }),
    validateEffects: (plan, saved, context) => validateSyncFieldHistory(plan, saved,
      syncOperationEffectId(context.operationId, context.index)),
    apply: (saved, context) => applySyncOperationStep({ cards, step: saved, ...context,
      completeEffects: ({ assertCurrent }) => persistSyncFieldHistory({ history, plan: context.effects, assertCurrent }) }),
    ...overrides,
  }));
  await assert.rejects(run(), /History interrupted/);
  assert.equal((await operations.findOne({ _id: 'list' })).checkpoint, 0);
  assert.equal((await cards.findOne({ _id: 'card' })).title, 'After');
  assert.equal(await completions.countDocuments({}), 0);
  const stored = await steps.findOne({ index: 0 });
  assert.ok(stored.effects.rows.length);
  await steps.updateOne({ _id: stored._id }, { $unset: { effects: '' } });
  await assert.rejects(run(), /effects-invalid/); assert.equal(inserts, 1);
  await steps.replaceOne({ _id: stored._id }, stored);
  await assert.rejects(run({ prepareEffects: undefined, validateEffects: undefined }), /effects-mode-changed/);
  await steps.updateOne({ _id: stored._id }, { $set: { 'effects.redo.0.undoneAt': new Date(99) } });
  await assert.rejects(run(), /plan-damaged/); assert.equal(inserts, 1);
  await steps.replaceOne({ _id: stored._id }, stored);
  const first = await events.findOne({ _id: { $regex: '^sync-history-' } }); assert.ok(rowHashIsValid(first));
  await events.updateOne({ _id: 'later' }, { $set: { undone: true, undoneAt: new Date(2000) } });
  interrupt = false; assert.equal((await run()).total, 1);
  assert.equal(builds, 1); assert.equal(inserts, 2);
  assert.deepEqual(await events.findOne({ _id: first._id }), first);
  assert.equal((await events.findOne({ _id: 'old' })).superseded, true);
  assert.equal((await events.findOne({ _id: 'later' })).superseded, false);
  assert.equal(await operations.countDocuments({}), 0);
  assert.equal(await steps.countDocuments({}), 0, 'card and effect plans share verified cleanup');
  await run(); assert.equal(inserts, 2); assert.equal(builds, 1);
  assert.deepEqual(verifyHistoryRows(await events.find({}).toArray()), []);
});
