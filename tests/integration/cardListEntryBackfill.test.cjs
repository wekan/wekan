'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { backfillCardListEntries: run } = require('../../server/lib/cardListEntryBackfill');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const entry = new Date('2026-01-01T00:00:00Z');
async function setup(t) {
  const client = await new MongoClient(uri).connect();
  const db = client.db(`column_backfill_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  return { db, cards: db.collection('cards'), activities: db.collection('activities') };
}
const card = _id => ({ _id, boardId: 'board', listId: 'done' });
const event = cardId => ({ cardId, boardId: 'board', activityType: 'moveCard', oldListId: 'todo', listId: 'done', createdAt: entry });

test('bounded batches restore active and archived cards, preserve unknown and explicit dates, and are idempotent', { skip: !uri }, async t => {
  const f = await setup(t);
  const ids = Array.from({ length: 501 }, (_, i) => String(i).padStart(4, '0'));
  await f.cards.insertMany(ids.map((_id, i) => ({ ...card(_id), archived: i % 2 === 0, ...(i === 0 ? { listEnteredAt: null } : {}) })));
  await f.activities.insertMany(ids.map(event));
  await f.cards.insertMany([card('unknown'), { ...card('existing'), listEnteredAt: new Date(1000) }, card('conflict'), card('too-many')]);
  await f.activities.insertMany([event('existing'), { ...event('conflict'), listId: 'elsewhere' },
    ...Array.from({ length: 1001 }, (_, i) => ({ ...event('too-many'), oldListId: i ? 'done' : 'todo', createdAt: new Date(+entry + i) }))]);
  const progress = [];
  const result = await run({ ...f, onProgress: counts => progress.push(counts) });
  assert.equal(result.columnDatesRestored, 502); assert.equal(result.columnDatesUnknown, 2);
  assert.equal(progress.length, 3);
  assert.equal(await f.cards.countDocuments({ listEnteredAt: entry }), 502);
  assert.deepEqual((await f.cards.findOne({ _id: 'existing' })).listEnteredAt, new Date(1000));
  const again = await run(f);
  assert.equal(again.columnDatesRestored, 0); assert.equal(again.columnDatesUnknown, 2);
});

test('a concurrent move away and back, timestamp restoration, edit or placement change defeats the captured write', { skip: !uri }, async t => {
  const f = await setup(t);
  const peer = await new MongoClient(uri).connect();
  t.after(() => peer.close());
  const other = peer.db(f.db.databaseName).collection('cards');
  for (const set of [{ listEnteredAt: new Date(2000) }, { listId: 'other' }, { boardId: 'other' }, { dateLastActivity: new Date(3000) }]) {
    await f.cards.deleteMany({}); await f.activities.deleteMany({});
    await f.cards.insertOne(card('race')); await f.activities.insertOne(event('race'));
    const cards = { findOne: (...args) => f.cards.findOne(...args), find: (...args) => f.cards.find(...args), updateOne: async (...args) => {
      await other.updateOne({ _id: 'race' }, { $set: set });
      return f.cards.updateOne(...args);
    } };
    const result = await run({ ...f, cards });
    assert.equal(result.columnDatesRaced, 1); assert.equal(result.columnDatesRestored, 0);
    const saved = await f.cards.findOne({ _id: 'race' });
    for (const [key, value] of Object.entries(set)) assert.deepEqual(saved[key], value);
    if (!set.listEnteredAt) assert.equal(saved.listEnteredAt, undefined);
  }
});

test('interrupted writes can be retried without replacing already restored dates', { skip: !uri }, async t => {
  const f = await setup(t);
  await f.cards.insertOne(card('retry')); await f.activities.insertOne(event('retry'));
  const cards = { findOne: (...args) => f.cards.findOne(...args), find: (...args) => f.cards.find(...args), updateOne: async (...args) => {
    await f.cards.updateOne(...args); throw new Error('lost reply');
  } };
  await assert.rejects(run({ ...f, cards }), /lost reply/);
  assert.equal((await run(f)).columnDatesScanned, 0);
  assert.deepEqual((await f.cards.findOne({ _id: 'retry' })).listEnteredAt, entry);
});
