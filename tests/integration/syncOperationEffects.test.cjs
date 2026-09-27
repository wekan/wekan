'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { runSyncOperation } = require('../../server/lib/syncOperationJournal');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('journal verifies every stored effect plan before any application unit', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(); const db = client.db(`sync_effects_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const operations = db.collection('operations'), steps = db.collection('steps'), completions = db.collection('completions');
  const plan = ['one', 'two'].map(id => ({ kind: 'create', cardId: id, before: null,
    after: { _id: id, boardId: 'board', listId: 'list', title: id } }));
  let applied = 0, builds = 0, prepared = 0;
  const args = { operations, steps, completions, intentId: randomUUID(),
    scope: { boardId: 'board', listId: 'list', incarnation: null, revision: null, sourceKey: 'source' },
    assertCurrent: async () => {}, build: async () => { builds++; return plan; },
    prepareEffects: async step => { prepared++; return { cardId: step.cardId }; },
    validateEffects: (effects, step) => effects.cardId === step.cardId,
    apply: async (step, context) => { assert.equal(context.effects.cardId, step.cardId); applied++; return 'applied'; },
  };
  await assert.rejects(runSyncOperation({ ...args, apply: async () => { throw new Error('stop'); } }), /stop/);
  const stored = await steps.findOne({ index: 1 });
  await steps.updateOne({ _id: stored._id }, { $set: { 'effects.cardId': 'wrong' } });
  await assert.rejects(runSyncOperation(args), /effects-invalid/); assert.equal(applied, 0);
  await steps.replaceOne({ _id: stored._id }, stored);
  await steps.updateOne({ _id: stored._id }, { $set: { 'effects.extra': 'checksum mismatch' } });
  await assert.rejects(runSyncOperation(args), /plan-damaged/); assert.equal(applied, 0);
  await steps.replaceOne({ _id: stored._id }, stored);
  await assert.rejects(runSyncOperation({ ...args, prepareEffects: undefined, validateEffects: undefined }), /effects-mode-changed/);
  await operations.updateOne({ _id: 'list' }, { $set: { effectPlans: 'true' } });
  await assert.rejects(runSyncOperation(args), /invalid-sync-operation-effects-mode/);
  assert.equal(applied, 0);
  await operations.updateOne({ _id: 'list' }, { $set: { effectPlans: true } });
  assert.equal((await runSyncOperation(args)).total, 2);
  assert.equal(applied, 2); assert.equal(builds, 1); assert.equal(prepared, 2);
  assert.equal(await steps.countDocuments({}), 0);
});
test('oversized or incompletely prepared effect units never reach application', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(); const db = client.db(`sync_effects_size_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const operations = db.collection('operations'), steps = db.collection('steps');
  let applied = 0;
  const args = { operations, steps, completions: db.collection('completions'), intentId: randomUUID(),
    scope: { boardId: 'board', listId: 'list', incarnation: null, revision: null, sourceKey: 'source' },
    assertCurrent: async () => {}, build: async () => [{ kind: 'create', cardId: 'card', before: null,
      after: { _id: 'card', boardId: 'board', listId: 'list', title: 'Card' } }],
    validateEffects: () => true, apply: async () => { applied++; return 'applied'; },
    prepareEffects: () => ({ large: 'x'.repeat(15 * 1024 * 1024) }),
  };
  await assert.rejects(runSyncOperation(args), /unit-too-large/);
  assert.equal(applied, 0); assert.equal(await steps.countDocuments({}), 0);
  assert.equal((await operations.findOne({ _id: 'list' })).state, 'preparing');
  await assert.rejects(runSyncOperation({ ...args, prepareEffects: () => null }), /effects-invalid/);
  assert.equal(applied, 0);
  await assert.rejects(runSyncOperation({ ...args, prepareEffects: async () => { throw new Error('preparation failed'); } }), /preparation failed/);
  assert.equal(applied, 0);
  assert.equal((await runSyncOperation({ ...args, prepareEffects: () => ({ ready: true }) })).total, 1);
  assert.equal(applied, 1);
});
