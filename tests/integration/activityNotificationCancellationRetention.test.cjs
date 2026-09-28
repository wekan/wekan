'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { ensureActivityNotificationIntent } = require('../../server/lib/activityNotificationIntent');
const { ensureActivityNotificationPlan, planId } = require('../../server/lib/activityNotificationPlan');
const { cancelActivityNotification } = require('../../server/lib/activityNotificationControl');
const { compactCancelledActivityNotification: compact } = require('../../server/lib/activityNotificationCancellationRetention');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t, withPlan = true) {
  const client = await new MongoClient(uri).connect(), db = client.db(`cancel_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = Object.fromEntries(['controls', 'intents', 'plans', 'leases'].map(name => [name, db.collection(name)]));
  f.assertCurrent = async () => {};
  f.activity = { _id: 'event', activityType: 'createCard', createdAt: new Date(0), modifiedAt: new Date(0), privateContent: 'PRIVATE ACTIVITY' };
  f.intent = await ensureActivityNotificationIntent({ ...f, dispatchUserId: null });
  f.intentId = f.intent._id;
  if (withPlan) await ensureActivityNotificationPlan({ ...f, dispatchUserId: null, build: async () => [{ userId: 'PRIVATE RECIPIENT', tray: true,
    email: { userId: 'PRIVATE RECIPIENT', eventId: 'event', boardId: null, cardId: null, language: 'en', subject: 'PRIVATE SUBJECT', html: 'PRIVATE BODY' } }] });
  f.cancel = () => cancelActivityNotification({ ...f, expectedRevision: 0, requestId: 'cancel-request-123456789', actorId: 'admin', assertAdmin: async () => {} });
  return f;
}
test('cancelled orphan cleanup removes snapshots and rendered plans while preserving permanent unique receipts', { skip: !uri }, async t => {
  const f = await fixture(t), originalPlan = await f.plans.findOne({ _id: planId('event') });
  await f.cancel();
  const control = await f.controls.findOne({ _id: f.intentId });
  assert.equal(await compact(f), 'compacted');
  const intent = await f.intents.findOne({ _id: f.intentId }), plan = await f.plans.findOne({ _id: planId('event') });
  assert.equal(intent.state, 'cancelled');
  assert.equal(intent.activityId, 'event');
  assert.equal(intent.activity, undefined);
  assert.equal(plan.cancelled, true);
  assert.equal(plan.checksum, originalPlan.checksum);
  assert.doesNotMatch(JSON.stringify({ intent, plan }), /PRIVATE/);
  assert.deepEqual(await f.controls.findOne({ _id: f.intentId }), control);
  await assert.rejects(f.intents.insertOne(f.intent), { code: 11000 });
  await assert.rejects(f.plans.insertOne(originalPlan), { code: 11000 });
  await assert.rejects(ensureActivityNotificationPlan({ ...f, dispatchUserId: null, build: () => assert.fail('cannot rebuild cancelled payload') }));
  assert.equal(await compact(f), 'compacted');
});
test('an absent plan receives a permanent tombstone before discarding the intent snapshot', { skip: !uri }, async t => {
  const f = await fixture(t, false); await f.cancel();
  assert.equal(await compact(f), 'compacted');
  const plan = await f.plans.findOne({ _id: planId('event') });
  assert.equal(plan.checksum, null);
  assert.equal(plan.cancelled, true);
  await assert.rejects(f.plans.insertOne({ _id: plan._id, plan: { late: 'PRIVATE BODY' } }), { code: 11000 });
});
test('only a valid permanent cancellation authorizes removal; damaged or mismatched data remains', { skip: !uri }, async t => {
  const f = await fixture(t), original = await f.intents.findOne({ _id: f.intentId });
  assert.equal(await compact(f), 'pending');
  await f.cancel();
  await f.plans.updateOne({ _id: planId('event') }, { $set: { 'plan.dispatchUserId': 'other' } });
  await assert.rejects(compact(f));
  assert.deepEqual(await f.intents.findOne({ _id: f.intentId }), original);
  assert.ok((await f.plans.findOne({ _id: planId('event') })).plan);
  await f.controls.updateOne({ _id: f.intentId }, { $set: { cancelled: false } });
  await assert.rejects(compact(f), /control-invalid/);
});
test('lost replies reconcile and a crash between plan and intent compaction can resume', { skip: !uri }, async t => {
  const f = await fixture(t); await f.cancel();
  const intents = { findOne: (...args) => f.intents.findOne(...args), replaceOne: async () => { throw new Error('interrupted'); } };
  await assert.rejects(compact({ ...f, intents }), /interrupted/);
  assert.equal((await f.plans.findOne({ _id: planId('event') })).cancelled, true);
  assert.ok((await f.intents.findOne({ _id: f.intentId })).activity);
  intents.replaceOne = async (...args) => { await f.intents.replaceOne(...args); throw new Error('lost reply'); };
  assert.equal(await compact({ ...f, intents }), 'compacted');
});
test('false acknowledgements, changed cancellation and stale writers cannot remove unrelated evidence', { skip: !uri }, async t => {
  const f = await fixture(t); await f.cancel();
  const plans = { findOne: (...args) => f.plans.findOne(...args), replaceOne: async () => ({ matchedCount: 1 }) };
  await assert.rejects(compact({ ...f, plans }), /unconfirmed/);
  assert.ok((await f.intents.findOne({ _id: f.intentId })).activity);
  plans.replaceOne = async (...args) => {
    await f.plans.updateOne({ _id: planId('event') }, { $set: { 'plan.recipients': [] } });
    return f.plans.replaceOne(...args);
  };
  await assert.rejects(compact({ ...f, plans }), /unconfirmed/);
  assert.ok((await f.plans.findOne({ _id: planId('event') })).plan);
  let checks = 0;
  await assert.rejects(compact({ ...f, assertCurrent: async () => {
    if (++checks === 2) await f.controls.updateOne({ _id: f.intentId }, { $set: { revision: 2 } });
  } }), /control-changed/);
});
test('compact receipts remain searchable and never authorize capture or completion replay', { skip: !uri }, async t => {
  const f = await fixture(t); await f.cancel(); await compact(f);
  const { activityNotificationReport: report } = require('../../server/lib/activityNotificationReport');
  const { readActivityNotificationIntentState, completeActivityNotificationIntent } = require('../../server/lib/activityNotificationIntent');
  const noRead = { findOne: () => assert.fail('compact report must not read original content') };
  const result = await report({ ...f, activities: noRead, plans: noRead }, { search: 'event', page: 1 });
  assert.equal(result.total, 1);
  assert.equal(result.rows[0].status, 'cancelled');
  assert.equal(result.rows[0].activityId, 'event');
  assert.equal(result.rows[0].canRetry, false);
  assert.equal(result.rows[0].canControl, false);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|writerId|dispatchUserId|activityHash/);
  assert.equal(await readActivityNotificationIntentState({ ...f, dispatchUserId: null }), 'cancelled');
  await assert.rejects(ensureActivityNotificationIntent({ ...f, dispatchUserId: null }), /notification-cancelled/);
  await assert.rejects(completeActivityNotificationIntent({ ...f, dispatchUserId: null }), /notification-cancelled/);
  await f.controls.deleteOne({ _id: f.intentId });
  const invalid = (await report({ ...f, activities: noRead, plans: noRead })).rows[0];
  assert.equal(invalid.status, 'invalid');
  assert.equal(invalid.canRetry, false);
  assert.equal(invalid.canControl, false);
});
