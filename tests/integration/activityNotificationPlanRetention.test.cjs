'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { ensureActivityNotificationPlan, planId } = require('../../server/lib/activityNotificationPlan');
const { persistActivityWithNotificationIntent, completeActivityNotificationIntent } = require('../../server/lib/activityNotificationIntent');
const { compactActivityNotificationPlan: compact, createActivityPlanCleanup: create, activityPlanCleanupInterval: interval } = require('../../server/lib/activityNotificationPlanRetention');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('plan cleanup intervals and batch sizes are bounded', () => {
  assert.equal(interval({}), 60000);
  for (const value of ['0', '999', '86400001', 'NaN', '1000.1']) assert.throws(() => interval({ ACTIVITY_NOTIFICATION_PLAN_CLEANUP_INTERVAL_MS: value }));
  assert.throws(() => create({ run() {}, limit: 0 }));
});
async function fixture(t, completed = true) {
  const client = await new MongoClient(uri).connect(), db = client.db(`plan_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { plans: db.collection('plans'), intents: db.collection('intents'), activities: db.collection('activities'),
    activity: { _id: 'event', activityType: 'createCard', createdAt: new Date(0), modifiedAt: new Date(0) }, assertCurrent: async () => {}, dispatchUserId: null };
  f.id = planId('event');
  f.intent = await persistActivityWithNotificationIntent({ ...f, insert: row => f.activities.insertOne(row) });
  f.plan = await ensureActivityNotificationPlan({ ...f, build: async () => [{ userId: 'private-recipient', tray: true,
    email: { userId: 'private-recipient', eventId: 'event', boardId: null, cardId: null, language: 'en', subject: 'PRIVATE SUBJECT', html: 'PRIVATE BODY' } }] });
  if (completed) await completeActivityNotificationIntent(f);
  return f;
}
test('completed plans lose rendered payloads but keep a permanent unique replay key even after activity deletion', { skip: !uri }, async t => {
  const f = await fixture(t), original = await f.plans.findOne({ _id: f.id });
  await f.activities.deleteMany({});
  assert.equal(await compact(f), 'compacted');
  const row = await f.plans.findOne({ _id: f.id });
  assert.deepEqual(Object.keys(row).sort(), ['_id', 'activityHash', 'checksum', 'compactReceiptVersion']);
  assert.equal(row.checksum, original.checksum);
  assert.doesNotMatch(JSON.stringify(row), /PRIVATE|private-recipient/);
  await assert.rejects(f.plans.insertOne(original), { code: 11000 });
  await assert.rejects(ensureActivityNotificationPlan({ ...f, build: () => assert.fail('completed plan cannot be rebuilt') }), /plan-invalid/);
  assert.equal(await compact(f), 'compacted');
});
test('pending, missing and mismatched completion evidence retains the original plan', { skip: !uri }, async t => {
  const f = await fixture(t, false), original = await f.plans.findOne({ _id: f.id });
  assert.equal(await compact(f), 'pending');
  await completeActivityNotificationIntent(f);
  await f.intents.updateOne({ _id: f.intent._id }, { $set: { dispatchUserId: 'other' } });
  assert.equal(await compact(f), 'pending');
  await f.intents.deleteMany({});
  assert.equal(await compact(f), 'pending');
  assert.deepEqual(await f.plans.findOne({ _id: f.id }), original);
});
test('lost replacement replies reconcile, while false acknowledgements retain content and report failure', { skip: !uri }, async t => {
  const f = await fixture(t);
  const plans = { findOne: (...args) => f.plans.findOne(...args), replaceOne: async () => ({ matchedCount: 1 }) };
  await assert.rejects(compact({ ...f, plans }), /cleanup-unconfirmed/);
  assert.ok((await f.plans.findOne({ _id: f.id })).plan);
  plans.replaceOne = async (...args) => { await f.plans.replaceOne(...args); throw new Error('lost reply'); };
  assert.equal(await compact({ ...f, plans }), 'compacted');
});
test('damaged plans, changed payloads and lost ownership cannot be silently compacted', { skip: !uri }, async t => {
  const f = await fixture(t);
  let checks = 0;
  await assert.rejects(compact({ ...f, assertCurrent: async () => { if (++checks === 2) throw new Error('ownership lost'); } }), /ownership lost/);
  const plans = { findOne: (...args) => f.plans.findOne(...args), replaceOne: async (...args) => {
    await f.plans.updateOne({ _id: f.id }, { $set: { 'plan.recipients.0.email.html': 'changed body' } });
    return f.plans.replaceOne(...args);
  } };
  assert.equal(await compact({ ...f, plans }), 'changed');
  await assert.rejects(compact(f), /cleanup-invalid/);
  assert.equal((await f.plans.findOne({ _id: f.id })).plan.recipients[0].email.html, 'changed body');
});
test('bounded cleanup advances past damaged rows and concurrent scans coalesce', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.plans.insertMany([{ _id: '000-invalid-a' }, { _id: '000-invalid-b' }]);
  const scan = create({ ...f, limit: 2, run: id => compact({ ...f, id }) });
  const first = scan(); assert.equal(scan(), first);
  assert.deepEqual(await first, { visited: 2, compacted: 0, retained: 0, failed: 2 });
  assert.deepEqual(await scan(), { visited: 1, compacted: 1, retained: 0, failed: 0 });
  assert.equal(await f.plans.countDocuments({ compactReceiptVersion: 1 }), 1);
});
