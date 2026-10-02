'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { captureDailySprint } = require('../../server/lib/scrumDailyCapture');
const { dailyHistoryRows } = require('../../models/lib/scrumDailyHistory');
const { DEFAULT_SCRUM_SETTINGS, sprintSnapshot } = require('../../models/lib/scrum');
const uri = process.env.WEKAN_SCRUM_TEST_MONGO_URL;

test('daily Scrum observations survive retries without inventing missing days', { skip: !uri }, async t => {
  const client = new MongoClient(uri); await client.connect();
  const db = client.db(`scrum_daily_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const collection = db.collection('samples');
  const snapshots = { insertAsync: document => collection.insertOne(document) };
  const start = new Date('2026-09-01T10:00:00Z');
  const cards = [{ _id: 'known', listId: 'todo', poker: { estimation: 3 } },
    { _id: 'unknown', listId: 'todo' }, { _id: 'zero', listId: 'done', poker: { estimation: 0 }, dueComplete: true }];
  const sprint = { _id: 'sprint', boardId: 'board', state: 'active',
    startSnapshot: sprintSnapshot(cards, DEFAULT_SCRUM_SETTINGS, [], start) };
  const input = { sprint, cards, lists: [], snapshots, at: start };
  assert.equal((await captureDailySprint({ ...input, sprint: { ...sprint, scrumImportPending: true } })).skipped, true);
  assert.equal(await collection.countDocuments({}), 0);
  const results = await Promise.all([captureDailySprint(input), captureDailySprint(input)]);
  assert.equal(results.filter(result => result.captured).length, 1);
  const changed = structuredClone(cards); changed[0].poker.estimation = 8; changed[0].dueComplete = true;
  await captureDailySprint({ ...input, cards: changed, at: new Date('2026-09-01T23:00:00Z') });
  await captureDailySprint({ ...input, cards: changed, at: new Date('2026-09-03T00:15:00Z') });
  const samples = await collection.find({}).sort({ capturedAt: 1 }).toArray();
  assert.equal(samples.length, 2);
  const rows = dailyHistoryRows(samples);
  assert.deepEqual(rows.map(row => row.day), ['2026-09-01', '2026-09-03']);
  assert.deepEqual(rows[0].remaining, { count: 2, estimate: 3, unknown: 1 });
  assert.deepEqual(rows[1].remaining, { count: 1, estimate: 0, unknown: 1 });
  assert.equal(rows[1].completed.estimate, 8);
  assert.equal(rows[0].consistency, 'observed');
  const restricted = dailyHistoryRows(samples, new Set(['unknown']));
  assert.equal(restricted[0].scope.count, 1); assert.equal(restricted[0].scope.estimate, 0);
  assert.equal(restricted[0].scope.unknown, 1); assert.equal(restricted[0].partial, true);
  assert.ok(!JSON.stringify(restricted).includes('"cardId"'));
  assert.equal(await collection.countDocuments({}), 2);
  const restarted = { ...sprint, startSnapshot: { ...sprint.startSnapshot, partial: true, at: new Date('2026-09-03T01:00:00Z') } };
  await captureDailySprint({ ...input, sprint: restarted, at: new Date('2026-09-03T02:00:00Z') });
  assert.equal(await collection.countDocuments({}), 3);
  assert.equal(dailyHistoryRows(await collection.find({ startedAt: restarted.startSnapshot.at }).toArray())[0].partial, true);
  for (const state of ['planned', 'closed', 'cancelled']) assert.equal(
    (await captureDailySprint({ ...input, sprint: { ...sprint, state } })).skipped, true);
  await assert.rejects(captureDailySprint({ ...input, at: new Date('2026-08-31') }), /timestamp/);
  await assert.rejects(captureDailySprint({ ...input, sprint: { ...sprint, startSnapshot: { at: start } } }), /policy/);
  assert.equal(await collection.countDocuments({}), 3);
});
