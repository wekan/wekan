'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { planId } = require('../../server/lib/activityNotificationPlan');
const { activityNotificationReport: report } = require('../../server/lib/activityNotificationReport');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect();
  const db = client.db(`activity_report_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = Object.fromEntries(['intents', 'activities', 'plans', 'leases', 'controls'].map(name => [name, db.collection(name)]));
  f.seed = async (id, status, boardId = 'board') => {
    const activity = { _id: id, boardId, cardId: 'card', createdAt: new Date(0), activityType: 'createCard', privateContent: 'PRIVATE BODY' };
    const activityHash = sha256(canonical(activity));
    const intent = { _id: sha256(canonical(['activity-notification-intent', id])), version: 1, state: 'pending', activityHash,
      writerId: 'PRIVATE WRITER', dispatchUserId: 'PRIVATE ACTOR', activity };
    if (status === 'invalid') intent.version = 2;
    await f.intents.insertOne(intent);
    if (status !== 'missing') await f.activities.insertOne(status === 'changed' ? { ...activity, privateContent: 'CHANGED' } : activity);
    if (status === 'processing') await f.leases.insertOne({ _id: intent._id, expiresAt: new Date(Date.now() + 60000) });
    if (['pending', 'inconsistent'].includes(status)) await f.plans.insertOne({ _id: planId(id), checksum: 'a'.repeat(64), plan: {
      version: 1, activityId: id, activityHash, dispatchUserId: status === 'pending' ? intent.dispatchUserId : 'other',
      recipients: [{ userId: 'PRIVATE RECIPIENT', email: { html: 'PRIVATE HTML', subject: 'PRIVATE SUBJECT' } }],
    } });
    return intent;
  };
  return f;
}
test('activity report rejects unbounded searches and invalid page numbers before reading', async () => {
  for (const query of [{ search: {} }, { search: 'x'.repeat(101) }, { page: 0 }, { page: 1.5 }, { page: 100001 }]) {
    await assert.rejects(report({}, query), /invalid-activity-notification-report/);
  }
});
test('report classifies pending work without returning saved snapshots, recipients or payloads', { skip: !uri }, async t => {
  const f = await fixture(t);
  const statuses = ['pending', 'preparing', 'missing', 'changed', 'processing', 'invalid', 'inconsistent'];
  for (const status of statuses) await f.seed(status, status);
  const result = await report(f);
  assert.equal(result.total, statuses.length);
  for (const status of statuses) {
    const row = result.rows.find(item => item.activityId === status);
    assert.equal(row.status, status);
    assert.equal(row.canRetry, ['pending', 'preparing'].includes(status));
    assert.deepEqual(Object.keys(row).sort(), ['activityId', 'boardId', 'canControl', 'canRetry', 'cardId', 'controlRevision', 'createdAt', 'intentId', 'paused', 'status']);
  }
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|recipients|activityHash|checksum|dispatchUserId/);
});
test('report searches regex metacharacters literally, paginates ten rows and excludes completed work', { skip: !uri }, async t => {
  const f = await fixture(t);
  for (let index = 0; index < 13; index++) await f.seed(`event-${index}`, 'missing', 'board.*[x]');
  await f.seed('unrelated', 'missing', 'boardZZx');
  const completed = await f.seed('completed', 'missing', 'board.*[x]');
  await f.intents.updateOne({ _id: completed._id }, { $set: { state: 'completed' } });
  const first = await report(f, { search: 'board.*[x]', page: 1 });
  assert.equal(first.total, 13);
  assert.equal(first.rows.length, 10);
  const last = await report(f, { search: 'board.*[x]', page: 999 });
  assert.equal(last.page, 2);
  assert.equal(last.rows.length, 3);
  assert.equal(new Set([...first.rows, ...last.rows].map(row => row.intentId)).size, 13);
  const empty = await report(f, { search: 'absent', page: 9 });
  assert.deepEqual(empty, { total: 0, page: 1, rows: [] });
});

test('report exposes only hold state and revision, disables paused retry and rejects corrupt controls', { skip: !uri }, async t => {
  const f = await fixture(t), intent = await f.seed('held', 'pending');
  await f.controls.insertOne({ _id: intent._id, paused: true, revision: 7, requestId: 'private-request-12345678',
    actorId: 'PRIVATE ACTOR', changedAt: new Date() });
  let result = await report(f);
  assert.equal(result.rows[0].paused, true);
  assert.equal(result.rows[0].controlRevision, 7);
  assert.equal(result.rows[0].canRetry, false);
  assert.equal(result.rows[0].canControl, true);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|private-request|actorId|requestId|changedAt/);
  await f.controls.updateOne({ _id: intent._id }, { $set: { cancelled: true } });
  const cancelled = (await report(f)).rows[0];
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.canRetry, false);
  assert.equal(cancelled.canControl, false);
  await f.controls.updateOne({ _id: intent._id }, { $unset: { cancelled: '' } });
  await f.controls.updateOne({ _id: intent._id }, { $set: { paused: false } });
  assert.equal((await report(f)).rows[0].canRetry, true);
  await f.controls.updateOne({ _id: intent._id }, { $set: { revision: 'corrupt' } });
  result = await report(f);
  assert.equal(result.rows[0].status, 'invalid');
  assert.equal(result.rows[0].canRetry, false);
  assert.equal(result.rows[0].canControl, false);
  assert.equal(result.rows[0].controlRevision, null);
});
