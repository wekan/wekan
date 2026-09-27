'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isDeepStrictEqual } = require('node:util');
const { MongoClient, ObjectId } = require('mongodb');
const { applyImportStep, writeImportPlan } = require('../../server/lib/scrumImportWriter');
const uri = process.env.WEKAN_SCRUM_TEST_MONGO_URL;

test('Scrum import journals persist full plans before writes and detect concurrent changes', { skip: !uri }, async t => {
  const client = new MongoClient(uri); await client.connect();
  const db = client.db(`scrum_import_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const adapt = name => {
    const raw = db.collection(name);
    const result = { insertAsync: doc => raw.insertOne(structuredClone(doc)),
      findOneAsync: selector => raw.findOne(typeof selector === 'string' ? { _id: selector } : selector),
      updateAsync: async (selector, modifier) => (await raw.updateOne(selector, modifier)).matchedCount };
    result.direct = result;
    return result;
  };
  const pending = adapt('pending'), journal = adapt('journal');
  const collections = { sprints: adapt('sprints'), cards: adapt('cards') };
  const insert = { kind: 'insert', collection: 'sprints', after: { _id: 'sprint', boardId: 'board',
    revision: 1, scrumImportPending: true, name: 'Imported sprint', startedAt: new Date('2026-09-01') } };
  const update = { kind: 'update', collection: 'cards', id: 'card', boardId: 'board', before: {},
    after: { scrum: { sprintId: 'sprint' }, scrumRevision: 1 } };
  const input = { boardId: 'board', operationId: 'operation', userId: 'user', steps: [insert, update],
    pending, journal, collections, equals: isDeepStrictEqual };
  await collections.cards.insertAsync({ _id: 'card', boardId: 'board', title: 'Keep title' });
  const originalInsert = journal.insertAsync;
  journal.insertAsync = async doc => {
    if (doc.index === 1) throw new Error('Interrupted staging');
    return originalInsert(doc);
  };
  await assert.rejects(writeImportPlan(input), /Interrupted staging/);
  assert.equal((await pending.findOneAsync('board')).state, 'preparing');
  assert.equal(await db.collection('sprints').countDocuments({}), 0);
  assert.equal((await collections.cards.findOneAsync('card')).scrum, undefined);
  await assert.rejects(writeImportPlan({ ...input, operationId: 'competing' }), { code: 11000 });
  assert.equal(await db.collection('journal').countDocuments({ operationId: 'competing' }), 0);

  await db.collection('pending').deleteMany({}); await db.collection('journal').deleteMany({});
  journal.insertAsync = originalInsert;
  const originalUpdate = collections.cards.updateAsync;
  collections.cards.updateAsync = async () => { throw new Error('Interrupted target write'); };
  await assert.rejects(writeImportPlan(input), /Interrupted target write/);
  const checkpoint = await pending.findOneAsync('board');
  assert.equal(checkpoint.state, 'applying'); assert.equal(checkpoint.next, 1);
  const stored = await db.collection('journal').find({ operationId: 'operation' }).sort({ index: 1 }).toArray();
  assert.equal(stored.length, 2);
  assert.deepEqual(stored.map(row => row.step), [insert, update]);
  collections.cards.updateAsync = originalUpdate;
  // Exercise replay from persisted BSON, including dates and the already
  // acknowledged first insert. No newly allocated IDs or duplicate records.
  for (const row of stored) await applyImportStep(row.step, collections, isDeepStrictEqual);
  for (const row of stored) await applyImportStep(row.step, collections, isDeepStrictEqual);
  assert.equal(await db.collection('sprints').countDocuments({}), 1);
  assert.equal((await collections.cards.findOneAsync('card')).title, 'Keep title');
  await db.collection('cards').updateOne({ _id: 'card' }, { $set: { scrum: { sprintId: 'edited' } } });
  await assert.rejects(applyImportStep(update, collections, isDeepStrictEqual), /changed/);
  assert.equal((await collections.cards.findOneAsync('card')).scrum.sprintId, 'edited');
  await db.collection('cards').updateOne({ _id: 'card' }, { $set: { boardId: 'elsewhere', ...update.after } });
  await assert.rejects(applyImportStep(update, collections, isDeepStrictEqual), /changed/);
  await db.collection('sprints').updateOne({ _id: 'sprint' }, { $set: { name: 'Edited' } });
  await assert.rejects(applyImportStep(insert, collections, isDeepStrictEqual), { code: 11000 });
  // Missing and explicitly null metadata are different preconditions.
  await db.collection('cards').replaceOne({ _id: 'card' }, { _id: 'card', boardId: 'board', scrum: null });
  await assert.rejects(applyImportStep(update, collections, isDeepStrictEqual), /changed/);
  await db.collection('cards').replaceOne({ _id: 'card' }, { _id: 'card', boardId: 'board' });
  await db.collection('sprints').deleteMany({});
  await db.collection('pending').deleteMany({}); await db.collection('journal').deleteMany({});
  const advance = pending.updateAsync;
  pending.updateAsync = async (selector, modifier) => {
    if (modifier.$set.next === 2) throw new Error('Lost write acknowledgement');
    return advance(selector, modifier);
  };
  await assert.rejects(writeImportPlan(input), /Lost write acknowledgement/);
  assert.equal((await pending.findOneAsync('board')).next, 1);
  assert.deepEqual((await collections.cards.findOneAsync('card')).scrum, update.after.scrum);
  await applyImportStep(update, collections, isDeepStrictEqual);
  pending.updateAsync = advance;
  await db.collection('pending').deleteMany({}); await db.collection('journal').deleteMany({});
  await writeImportPlan(input);
  assert.equal((await pending.findOneAsync('board')).state, 'applied');
  assert.equal((await pending.findOneAsync('board')).next, 2);
});
