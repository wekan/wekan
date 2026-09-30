'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { createSyncHistoryPlanner, prepareSyncFieldHistory, persistSyncFieldHistory, validateSyncFieldHistory } = require('../../server/lib/syncHistoryBatch');
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
  const unchanged = { ...before, _id: 'baseline' };
  const second = { ...before, _id: 'second' };
  const planned = [step, { kind: 'update', cardId: 'baseline', before: unchanged,
    after: { ...unchanged, syncLastSource: { title: 'Before' } } },
    { kind: 'update', cardId: 'second', before: second, after: { ...second, title: 'Second changed' } }];
  await cards.insertMany([before, unchanged, second]);
  const old = { _id: 'old', boardId: 'board', userId: 'author', entityId: 'card', entityType: 'card',
    createdAt: new Date(0), undone: true, undoneAt: new Date(10), superseded: false };
  old.integrityHash = hashHistoryRow(old); await events.insertOne(old);
  const legacy = { ...old, _id: 'legacy' }; delete legacy.integrityHash;
  await events.insertOne(legacy);
  const later = { ...old, _id: 'later', entityId: 'other-card', createdAt: new Date(5),
    previousHash: old.integrityHash, undone: false, undoneAt: null };
  later.integrityHash = hashHistoryRow(later); await events.insertOne(later);
  let inserts = 0, builds = 0, interrupt = true;
  // Links each appended row after the board's newest hashed row, the legacy
  // path's own rule (server/lib/storedHistoryChain.js), so the chain can be
  // verified end to end below.
  const history = { admitHistoryWriter: ({ work }) => work({ mode: 'legacy', assertCurrent: async () => {} }),
    appendSyncHistoryRow: async function ({ row }) {
      if (await events.findOne({ _id: row._id })) return row._id;
      // The tip: from the newest hashed row, follow successors (rows of one
      // batch share a createdAt, so "newest" alone is a tie).
      let previous = await events.findOne({ boardId: row.boardId, integrityHash: { $nin: [null, ''] } }, { sort: { createdAt: -1 } });
      for (let next; previous && (next = await events.findOne({ boardId: row.boardId, previousHash: previous.integrityHash }));) previous = next;
      const saved = { ...row, previousHash: previous ? previous.integrityHash : null };
      saved.integrityHash = hashHistoryRow(saved);
      await this.insertAsync(saved); return row._id;
    },
    findOneAsync: query => events.findOne(typeof query === 'string' ? { _id: query } : query),
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
      builds++; await context.assertCurrent(); assert.equal(context.intentId, intentId); return planned;
    },
    prepareEffects: createSyncHistoryPlanner({ userId: 'author', createdAt: new Date(1000),
      redoRows: [old, legacy] }),
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
  const middle = await steps.findOne({ index: 1 }), last = await steps.findOne({ index: 2 });
  assert.deepEqual(middle.effects.rows, []);
  // Plans are content; rows are linked when appended (2026-09-30).
  assert.ok([...stored.effects.rows, ...last.effects.rows].every(row => !('previousHash' in row) && !('integrityHash' in row)));
  assert.deepEqual(last.effects.redo, []);
  await steps.updateOne({ _id: stored._id }, { $unset: { effects: '' } });
  await assert.rejects(run(), /effects-invalid/); assert.equal(inserts, 1);
  await steps.replaceOne({ _id: stored._id }, stored);
  await assert.rejects(run({ prepareEffects: undefined, validateEffects: undefined }), /effects-mode-changed/);
  await steps.updateOne({ _id: stored._id }, { $set: { 'effects.redo.0.undoneAt': new Date(99) } });
  await assert.rejects(run(), /plan-damaged/); assert.equal(inserts, 1);
  await steps.replaceOne({ _id: stored._id }, stored);
  const first = await events.findOne({ _id: { $regex: '^sync-history-' } }); assert.ok(rowHashIsValid(first));
  await events.updateOne({ _id: 'later' }, { $set: { undone: true, undoneAt: new Date(2000) } });
  interrupt = false; assert.equal((await run()).total, 3);
  assert.equal(builds, 1); assert.equal(inserts, 3);
  assert.deepEqual(await events.findOne({ _id: first._id }), first);
  assert.equal((await events.findOne({ _id: 'old' })).superseded, true);
  assert.deepEqual(await events.findOne({ _id: 'legacy' }), { ...legacy, superseded: true });
  assert.equal((await events.findOne({ _id: 'later' })).superseded, false);
  assert.equal(await operations.countDocuments({}), 0);
  assert.equal(await steps.countDocuments({}), 0, 'card and effect plans share verified cleanup');
  await run(); assert.equal(inserts, 3); assert.equal(builds, 1);
  assert.deepEqual(verifyHistoryRows(await events.find({}).toArray()), []);
});

test('legacy redo invalidation resumes with exact snapshots and never manufactures historical hashes', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(); const db = client.db(`sync_legacy_history_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const events = db.collection('history');
  for (const hash of [undefined, null, '']) {
    await events.deleteMany({});
    const legacy = { _id: 'legacy', boardId: 'board', userId: 'author', entityId: 'card', entityType: 'card',
      group: 'title', changeType: 'edited', previousContent: null,
      newContent: { field: 'title', value: { $ne: 'literal data', date: new Date(0) } },
      createdAt: new Date(0), undone: true, undoneAt: new Date(10) };
    if (hash !== undefined) legacy.integrityHash = hash;
    await events.insertOne(legacy);
    const before = { _id: 'card', boardId: 'board', listId: 'list', title: 'Before' };
    const plan = prepareSyncFieldHistory({ step: { kind: 'update', cardId: 'card', before, after: { ...before, title: 'After' } },
      effectId: 'b'.repeat(64), userId: 'author', createdAt: new Date(1000), redoRows: [legacy] });
    // Actual BSON persistence must retain nested dates and missing hash fields.
    await db.collection('plans').deleteMany({}); await db.collection('plans').insertOne({ _id: 'plan', plan });
    const savedPlan = (await db.collection('plans').findOne({ _id: 'plan' })).plan;
    assert.deepEqual(savedPlan, plan);
    let interrupted = true;
    const history = { admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;}, findOneAsync: query => events.findOne(typeof query === 'string' ? { _id: query } : query),
      updateAsync: async (...args) => { await events.updateOne(...args); throw new Error('lost redo acknowledgement'); },
      insertAsync: async row => { if (interrupted) throw new Error('interrupted History'); await events.insertOne(row); } };
    const args = { history, plan: savedPlan, assertCurrent: async () => {} };
    // A changed payload or a new undo cycle cannot be superseded by the old plan.
    for (const change of [{ newContent: { field: 'title', value: 'Changed' } }, { undoneAt: new Date(20) }, { integrityHash: 'new hash' }]) {
      await events.replaceOne({ _id: 'legacy' }, { ...legacy, ...change });
      await assert.rejects(persistSyncFieldHistory(args), /lost redo acknowledgement/);
      assert.notEqual((await events.findOne({ _id: 'legacy' })).superseded, true);
      assert.equal(await events.countDocuments({ _id: { $regex: '^sync-history-' } }), 0);
    }
    await events.replaceOne({ _id: 'legacy' }, legacy);
    await assert.rejects(persistSyncFieldHistory(args), /interrupted History/);
    assert.deepEqual(await events.findOne({ _id: 'legacy' }), { ...legacy, superseded: true });
    await events.insertOne({ ...legacy, _id: 'later', undoneAt: new Date(30) });
    interrupted = false;
    assert.equal(await persistSyncFieldHistory(args), plan.effectId);
    assert.equal(await persistSyncFieldHistory(args), plan.effectId);
    assert.equal(await events.countDocuments({ _id: { $regex: '^sync-history-' } }), 1);
    assert.notEqual((await events.findOne({ _id: 'later' })).superseded, true);
    assert.deepEqual(await events.findOne({ _id: 'legacy' }), { ...legacy, superseded: true });
  }
});
