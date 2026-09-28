'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { runSyncOperation } = require('../../server/lib/syncOperationJournal');
const { applySyncOperationStep, syncOperationEffectId } = require('../../server/lib/syncOperationApply');
const { prepareSyncCreationActivity, validateSyncCreationActivity, persistSyncCreationActivity } = require('../../server/lib/syncCreationActivity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('creation journal retains activity and delivery evidence across restart and lost acknowledgements', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(); const db = client.db(`sync_creation_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const operations = db.collection('operations'), steps = db.collection('steps'), completions = db.collection('completions');
  const cards = db.collection('cards'), activities = db.collection('activities'), deliveries = db.collection('deliveries');
  const step = { kind: 'create', cardId: 'card', before: null,
    after: { _id: 'card', boardId: 'board', listId: 'list', swimlaneId: 'lane', title: 'Created' } };
  let builds = 0, prepared = 0, interrupted = true;
  const options = { operations, steps, completions, intentId: randomUUID(), assertCurrent: async () => {},
    scope: { boardId: 'board', listId: 'list', incarnation: null, revision: null, sourceKey: 'source' },
    build: async () => { builds++; return [step]; },
    prepareEffects: (saved, context) => { prepared++; return prepareSyncCreationActivity({ step: saved,
      effectId: syncOperationEffectId(context.operationId, context.index), userId: 'author', createdAt: new Date(1000),
      list: { _id: 'list', boardId: 'board', title: 'List' }, swimlane: { _id: 'lane', boardId: 'board', title: 'Lane' } }); },
    validateEffects: (plan, saved, context) => validateSyncCreationActivity(plan, saved, syncOperationEffectId(context.operationId, context.index)),
    apply: (saved, context) => applySyncOperationStep({ cards, step: saved, ...context,
      completeEffects: ({ assertCurrent }) => persistSyncCreationActivity({ assertCurrent, plan: context.effects,
        activities: { findOneAsync: id => activities.findOne({ _id: id }), insertAsync: async row => {
          await activities.insertOne(row); throw new Error('lost activity reply');
        } }, completeDelivery: async ({ effectId, activity }) => {
          assert.equal(activity.cardTitle, 'Created');
          if (interrupted) throw new Error('delivery interrupted');
          await deliveries.updateOne({ _id: effectId }, { $setOnInsert: { deliveredAt: new Date() } }, { upsert: true });
          return (await deliveries.findOne({ _id: effectId }))._id;
        } }) }),
  };
  await assert.rejects(runSyncOperation(options), /delivery interrupted/);
  assert.equal((await operations.findOne({ _id: 'list' })).checkpoint, 0);
  assert.equal(await cards.countDocuments({}), 1); assert.equal(await activities.countDocuments({}), 1);
  assert.equal(await completions.countDocuments({}), 0);
  const stored = await steps.findOne({ index: 0 });
  await steps.updateOne({ _id: stored._id }, { $set: { 'effects.activity.cardTitle': 'Changed' } });
  await assert.rejects(runSyncOperation(options), /activity-invalid/);
  await steps.replaceOne({ _id: stored._id }, stored);
  interrupted = false;
  assert.equal((await runSyncOperation(options)).total, 1);
  await runSyncOperation(options);
  assert.equal(builds, 1); assert.equal(prepared, 1);
  assert.equal(await cards.countDocuments({}), 1); assert.equal(await activities.countDocuments({}), 1);
  assert.equal(await deliveries.countDocuments({}), 1); assert.equal(await completions.countDocuments({}), 1);
  assert.equal(await steps.countDocuments({}), 0); assert.equal(await operations.countDocuments({}), 0);
});
