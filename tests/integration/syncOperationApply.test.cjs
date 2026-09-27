'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { applySyncOperationStep } = require('../../server/lib/syncOperationApply');
const { runSyncOperation } = require('../../server/lib/syncOperationJournal');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('Sync applies conditional card writes and resumes effects before advancing the journal', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect();
  const db = client.db(`sync_apply_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards'), operations = db.collection('operations'), steps = db.collection('steps');
  const completions = db.collection('completions'), effects = db.collection('effects');
  const before = { _id: 'card', boardId: 'board', listId: 'list', title: 'Before' };
  const after = { ...before, title: 'After' };
  const step = { kind: 'update', cardId: 'card', before, after };
  await cards.insertOne({ ...before, labels: ['local'] });
  let interrupted = true, calls = 0;
  const intentId = randomUUID();
  const run = () => runSyncOperation({ operations, steps, completions, intentId,
    scope: { boardId: 'board', listId: 'list', revision: null, incarnation: null, sourceKey: 'source' },
    assertCurrent: async () => {}, build: async () => [step],
    apply: (saved, context) => applySyncOperationStep({ cards, step: saved, ...context,
      completeEffects: async ({ effectId }) => {
        calls++;
        if (interrupted) throw new Error('History unavailable');
        await effects.updateOne({ _id: effectId }, { $setOnInsert: { cardId: saved.cardId } }, { upsert: true });
        assert.ok(await effects.findOne({ _id: effectId }));
        return effectId;
      },
    }),
  });
  await assert.rejects(run(), /History unavailable/);
  assert.equal((await cards.findOne({ _id: 'card' })).title, 'After');
  assert.equal((await operations.findOne({ _id: 'list' })).checkpoint, 0);
  assert.equal(await completions.countDocuments({}), 0);
  interrupted = false;
  assert.equal((await run()).total, 1);
  assert.equal(calls, 2); assert.equal(await effects.countDocuments({}), 1);
  assert.deepEqual((await cards.findOne({ _id: 'card' })).labels, ['local']);
  assert.equal(await operations.countDocuments({}), 0);
  await run(); assert.equal(calls, 2);

  const args = { cards, step, operationId: randomUUID(), index: 0,
    assertCurrent: async () => {}, completeEffects: async ({ effectId }) => effectId };
  await cards.updateOne({ _id: 'card' }, { $set: { title: 'New local edit' } });
  await assert.rejects(applySyncOperationStep(args), /write-unconfirmed/);
  assert.equal((await cards.findOne({ _id: 'card' })).title, 'New local edit');
  await cards.updateOne({ _id: 'card' }, { $set: { title: 'Before' } });
  let writes = 0;
  const lostReply = { findOne: q => cards.findOne(q), insertOne: row => cards.insertOne(row),
    updateOne: async (...params) => { writes++; await cards.updateOne(...params); throw new Error('lost reply'); } };
  assert.equal(await applySyncOperationStep({ ...args, cards: lostReply }), 'applied');
  assert.equal(await applySyncOperationStep({ ...args, cards: lostReply }), 'already-applied');
  assert.equal(writes, 1);
  const archived = { ...after, archived: true, archivedAt: new Date(0) };
  assert.equal(await applySyncOperationStep({ ...args, step: { kind: 'archive', cardId: 'card', before: after, after: archived } }), 'applied');
  assert.deepEqual((await cards.findOne({ _id: 'card' })).archivedAt, new Date(0));
  const created = { ...after, _id: 'created', description: null };
  const createArgs = { ...args, index: 1,
    step: { kind: 'create', cardId: 'created', before: null, after: created } };
  assert.equal(await applySyncOperationStep(createArgs), 'applied');
  assert.equal(await applySyncOperationStep(createArgs), 'already-applied');
  assert.equal(await cards.countDocuments({ _id: 'created' }), 1);
  const withoutDescription = { ...created }; delete withoutDescription.description;
  assert.equal(await applySyncOperationStep({ ...args, index: 2,
    step: { kind: 'update', cardId: 'created', before: created, after: withoutDescription } }), 'applied');
  assert.equal(Object.hasOwn(await cards.findOne({ _id: 'created' }), 'description'), false);
});
