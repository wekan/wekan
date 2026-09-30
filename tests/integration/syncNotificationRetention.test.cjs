'use strict';
// Sync notification plan retention (maintainer decision of 2026-09-30): a
// delivered plan is compacted after 90 days to a permanent minimal id, and a
// late replay of it returns as delivered instead of rebuilding and resending.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const R = require('../../server/lib/syncNotificationRetention');
const { ensureNotificationPlan, planId } = require('../../server/lib/syncNotificationPlan');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const DAY = 86400000;

async function setup(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`sync_notification_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  return { plans: db.collection('plans'), receipts: db.collection('receipts') };
}
const activity = id => ({ _id: id, boardId: 'board', cardId: 'card', userId: 'actor', activityType: 'createCard' });
async function seed(c, id, { completedAt, receipt = true } = {}) {
  const act = activity(id), activityHash = sha256(canonical(act));
  const plan = { version: 1, activityId: id, activityHash, boardId: 'board', cardId: 'card', actorId: 'actor',
    recipients: [{ userId: 'watcher', tray: true, email: { userId: 'watcher', eventId: id, subject: 'Secret subject',
      html: '<p>secret body</p>', language: 'en', cardId: 'card', boardId: 'board' } }] };
  const row = { _id: planId(id), plan, checksum: sha256(canonical(plan)) };
  await c.plans.insertOne(row);
  if (receipt) await R.recordNotificationCompletion({ receipts: c.receipts, id: row._id, activityHash,
    checksum: row.checksum, now: () => completedAt });
  return { act, row };
}

test('delivered plans older than the policy are compacted in place; nothing else is touched', { skip: !uri }, async t => {
  const c = await setup(t), now = new Date(400 * DAY);
  const old = await seed(c, 'old', { completedAt: new Date(now - 100 * DAY) });
  const recent = await seed(c, 'recent', { completedAt: new Date(now - 10 * DAY) });
  const undelivered = await seed(c, 'undelivered', { receipt: false });
  const retention = R.createSyncNotificationRetention({ ...c, now: () => now });
  assert.equal((await retention.sweep()).compacted, 1);
  const compact = await c.plans.findOne({ _id: old.row._id });
  assert.deepEqual(compact, { _id: old.row._id, activityHash: old.row.plan.activityHash, checksum: old.row.checksum, compactReceiptVersion: 1 });
  assert.ok(!JSON.stringify(compact).includes('secret'), 'the rendered mail is gone');
  for (const kept of [recent, undelivered]) assert.deepEqual(await c.plans.findOne({ _id: kept.row._id }), kept.row);
  assert.equal((await R.createSyncNotificationRetention({ ...c, now: () => now }).sweep()).compacted, 0, 'idempotent');

  // A late replay returns as delivered and never rebuilds.
  const replay = await ensureNotificationPlan({ plans: c.plans, receipts: c.receipts, activity: old.act,
    assertCurrent: async () => {}, build: () => assert.fail('a compacted plan is never rebuilt') });
  assert.deepEqual(replay, { compacted: true, id: old.row._id });
  // Within the policy a replay still reads the full plan, as before.
  assert.equal((await ensureNotificationPlan({ plans: c.plans, receipts: c.receipts, activity: recent.act,
    assertCurrent: async () => {}, build: () => assert.fail() })).activityId, 'recent');
});

test('a compact plan without its receipt, or for another activity, is refused (negative)', { skip: !uri }, async t => {
  const c = await setup(t), now = new Date(400 * DAY);
  const old = await seed(c, 'old', { completedAt: new Date(now - 100 * DAY) });
  await R.createSyncNotificationRetention({ ...c, now: () => now }).sweep();
  const replay = extra => ensureNotificationPlan({ plans: c.plans, activity: old.act, assertCurrent: async () => {},
    build: () => assert.fail(), ...extra });
  await assert.rejects(replay({}), /sync-notification-plan-invalid/, 'no receipts adapter');
  await assert.rejects(replay({ receipts: c.receipts, activity: { ...old.act, value: 'changed' } }), /plan-invalid/,
    'an activity whose content changed');
  await c.receipts.deleteOne({ _id: old.row._id });
  await assert.rejects(replay({ receipts: c.receipts }), /plan-invalid/, 'a missing receipt');
});

test('a receipt keeps its first timestamp and refuses another plan (negative)', { skip: !uri }, async t => {
  const c = await setup(t);
  const h = ch => ch.repeat(64);
  const first = await R.recordNotificationCompletion({ receipts: c.receipts, id: h('a'), activityHash: h('b'),
    checksum: h('c'), now: () => new Date(1000) });
  const again = await R.recordNotificationCompletion({ receipts: c.receipts, id: h('a'), activityHash: h('b'),
    checksum: h('c'), now: () => new Date(9000) });
  assert.equal(again.completedAt.getTime(), first.completedAt.getTime());
  await assert.rejects(R.recordNotificationCompletion({ receipts: c.receipts, id: h('a'), activityHash: h('b'), checksum: h('d') }),
    /receipt-conflict/);
  await assert.rejects(R.recordNotificationCompletion({ receipts: c.receipts, id: 'x', activityHash: h('b'), checksum: h('c') }),
    /receipt-invalid/);
  // A plan whose checksum no longer matches its receipt is never compacted.
  const now = new Date(400 * DAY);
  const row = await seed(c, 'changed', { completedAt: new Date(now - 100 * DAY) });
  await c.plans.updateOne({ _id: row.row._id }, { $set: { checksum: h('e') } });
  const result = await R.createSyncNotificationRetention({ ...c, now: () => now }).sweep();
  assert.deepEqual([result.compacted, result.skipped], [0, 1]);
});
