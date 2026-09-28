'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('movement join finds earlier moves beyond a batch and rejects unrelated, foreign, missing and inaccessible history', { skip: !uri }, async t => {
  const { boardMovementSearch } = await import('../../server/lib/boardMovementSearch.js');
  const client = await new MongoClient(uri).connect();
  const db = client.db(`movement_filter_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const cards = db.collection('cards'), activities = db.collection('activities');
  await cards.insertMany(Array.from({ length: 501 }, (_, i) => ({ _id: String(i).padStart(4, '0'),
    boardId: 'board', archived: i === 9, assignees: i === 8 ? [] : ['reader'], listEnteredAt: new Date(9000) })));
  const event = (cardId, date, activityType = 'moveCard', boardId = 'board') => ({ cardId, boardId, createdAt: new Date(date), activityType });
  await activities.insertMany([event('0500', 1000), event('0500', 9000), event('0001', 1999, 'moveCardBoard'),
    event('0002', 2000), event('0003', 999), event('0004', 1500, 'createCard'), event('0005', 1500, 'moveCard', 'private'),
    event('0008', 1500), event('0009', 1500), event('unknown-card', 1500),
    { ...event('0006', 1500), createdAt: '1970-01-01T00:00:01.500Z' },
    ...Array.from({ length: 1001 }, () => event('0500', 1200))]);
  const args = { cards, activities, scope: { boardId: 'board', archived: false, assignees: { $in: ['reader'] } }, start: 1000, end: 2000 };
  assert.deepEqual((await boardMovementSearch(args)).sort(), ['0001', '0500']);
  assert.ok((await boardMovementSearch({ ...args, end: null })).includes('0002'));
  assert.ok((await boardMovementSearch({ ...args, start: null })).includes('0003'));
  await activities.deleteMany({ cardId: '0001' });
  assert.deepEqual(await boardMovementSearch(args), ['0500']);
  assert.deepEqual(await boardMovementSearch({ ...args, stopped: () => true }), []);
  assert.deepEqual(await boardMovementSearch({ ...args, start: 2000 }), []);
});
