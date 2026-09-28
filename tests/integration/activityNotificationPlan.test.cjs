'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { ensureActivityNotificationPlan: ensure, deliverActivityNotificationPlan: deliver, validatePlan } = require('../../server/lib/activityNotificationPlan');
const { createEmailOutbox, idFor } = require('../../server/lib/emailOutbox');
const { createTrayDelivery } = require('../../server/lib/trayDelivery');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`activity_plan_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { plans: db.collection('plans'), activity: { _id: 'activity', boardId: 'board', cardId: 'card' },
    dispatchUserId: 'actor', assertCurrent: async () => {} };
  f.rows = [{ userId: 'recipient', tray: true, email: { userId: 'recipient', eventId: 'activity', boardId: 'board', cardId: 'card', language: 'fi', subject: 'Original', html: 'Original body' } }];
  f.build = async () => f.rows;
  f.db = db;
  return f;
}
test('saved recipients and rendered payloads survive changed preparation and uncertain plan writes', { skip: !uri }, async t => {
  const f = await fixture(t);
  const plans = { findOne: (...args) => f.plans.findOne(...args), insertOne: async row => {
    await f.plans.insertOne(row); throw new Error('lost reply');
  } };
  const plan = await ensure({ ...f, plans });
  f.rows[0].email.html = 'Changed'; f.rows.push({ userId: 'new watcher', tray: true, email: null });
  assert.deepEqual(await ensure({ ...f, build: () => assert.fail('must not rebuild') }), plan);
  await assert.rejects(ensure({ ...f, dispatchUserId: 'other' }), /plan-invalid/);
  await f.plans.updateOne({}, { $set: { checksum: 'wrong' } });
  await assert.rejects(ensure(f), /plan-invalid/);
});
test('a crash between tray insertion and email enqueue replays the saved plan without duplicate tray entries', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensure(f);
  const users = f.db.collection('users'), jobs = f.db.collection('jobs');
  await users.insertOne({ _id: 'recipient', profile: {} });
  const tray = createTrayDelivery({ users, receipts: f.db.collection('receipts') });
  const queue = createEmailOutbox({ jobs });
  const options = { ...f, plan, assertAccess: async () => {}, tray: (...args) => tray.deliver(...args), email: job => queue.enqueue(job) };
  await assert.rejects(deliver({ ...options, email: async () => { throw new Error('interrupted'); } }), /interrupted/);
  await deliver(options); await deliver(options);
  assert.equal(await jobs.countDocuments({}), 1);
  assert.equal((await jobs.findOne({ _id: idFor('recipient', 'activity') })).html, 'Original body');
  assert.equal(await f.db.collection('receipts').countDocuments({}), 1);
  assert.equal((await users.findOne({ _id: 'recipient' })).profile.notifications.length, 1);
});
test('revoked access and false receipts cannot acknowledge delivery', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensure(f);
  await assert.rejects(deliver({ ...f, plan, assertAccess: async () => { throw new Error('denied'); },
    tray: () => assert.fail('no unauthorized write'), email: () => assert.fail('no unauthorized write') }), /denied/);
  await assert.rejects(deliver({ ...f, plan, assertAccess: async () => {}, tray: async () => 'wrong', email: async () => 'wrong' }), /tray-unconfirmed/);
  const emailOnly = structuredClone(plan); emailOnly.recipients[0].tray = false;
  await assert.rejects(deliver({ ...f, plan: emailOnly, assertAccess: async () => {}, tray: async () => 'wrong', email: async () => 'wrong' }), /email-unconfirmed/);
});
test('invalid recipients, identities, payloads and oversized plans are rejected before persistence', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensure(f);
  for (const change of [p => p.recipients.push(p.recipients[0]), p => p.recipients[0].email.eventId = 'other',
    p => p.recipients[0].email.boardId = 'other', p => p.recipients[0].email.subject = 'injected\r\nheader',
    p => p.recipients[0].email.html = 'x'.repeat(14 * 1024 * 1024), p => p.recipients[0].tray = 1]) {
    const altered = structuredClone(plan); change(altered);
    assert.throws(() => validatePlan(altered, f.activity, f.dispatchUserId), /plan-invalid/);
  }
  await f.plans.deleteMany({});
  f.rows[0].email.eventId = 'other';
  await assert.rejects(ensure(f), /plan-invalid/);
  assert.equal(await f.plans.countDocuments({}), 0);
});
