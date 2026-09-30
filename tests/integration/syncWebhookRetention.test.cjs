'use strict';
// Sync webhook plan retention (maintainer decision of 2026-09-30): 90 days
// after every target was delivered, the reply and comment-plan rows are
// removed and the plan - with its URLs and tokens - is compacted in place.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const R = require('../../server/lib/syncWebhookRetention');
const { ensureWebhookPlan, planId, deliveryId } = require('../../server/lib/syncWebhookPlan');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const DAY = 86400000;

test('a delivered plan loses its dead rows and is compacted; an undelivered one keeps everything', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`sync_webhook_retention_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const c = { plans: db.collection('plans'), receipts: db.collection('completions'),
    responses: db.collection('responses'), commentPlans: db.collection('commentPlans') };
  const now = new Date(400 * DAY);
  const seed = async (activityId, completedAt) => {
    const activity = { _id: activityId, boardId: 'board', cardId: 'card', userId: 'actor', activityType: 'createCard' };
    const plan = { version: 1, activityId, activityHash: sha256(canonical(activity)), boardId: 'board', cardId: 'card', actorId: 'actor',
      targets: [{ integrationId: 'hook', integrationHash: 'a'.repeat(64), integrationBoardId: 'board',
        request: { url: 'https://secret.example/hook', headers: { 'Content-Type': 'application/json', 'X-Wekan-Token': 'secret-token' },
          body: '{}', is2way: true, language: 'en' } }] };
    const row = { _id: planId(activityId), plan, checksum: sha256(canonical(plan)) };
    await c.plans.insertOne(row);
    const delivery = deliveryId(activityId, 'hook');
    await c.responses.insertOne({ _id: delivery, body: 'secret reply' });
    await c.commentPlans.insertOne({ _id: delivery, plan: { text: 'secret comment' } });
    if (completedAt) await R.recordWebhookCompletion({ receipts: c.receipts, id: row._id, activityHash: plan.activityHash,
      checksum: row.checksum, now: () => completedAt });
    return { activity, row, delivery };
  };
  const old = await seed('old', new Date(now - 100 * DAY));
  const pending = await seed('pending', null);
  const result = await R.createSyncWebhookRetention({ ...c, now: () => now }).sweep();
  assert.equal(result.compacted, 1);
  const compact = await c.plans.findOne({ _id: old.row._id });
  assert.equal(compact.compactReceiptVersion, 1);
  assert.ok(!JSON.stringify(compact).includes('secret'), 'URL and token are gone');
  assert.equal(await c.responses.countDocuments({ _id: old.delivery }), 0);
  assert.equal(await c.commentPlans.countDocuments({ _id: old.delivery }), 0);
  // Undelivered: nothing is touched.
  assert.deepEqual(await c.plans.findOne({ _id: pending.row._id }), pending.row);
  assert.equal(await c.responses.countDocuments({ _id: pending.delivery }), 1);
  assert.equal(await c.commentPlans.countDocuments({ _id: pending.delivery }), 1);
  // Replay of the compact form, and its refusals.
  assert.deepEqual(await ensureWebhookPlan({ plans: c.plans, receipts: c.receipts, activity: old.activity,
    assertCurrent: async () => {}, build: () => assert.fail('never rebuilt') }), { compacted: true, id: old.row._id });
  await assert.rejects(ensureWebhookPlan({ plans: c.plans, activity: old.activity, assertCurrent: async () => {},
    build: () => assert.fail() }), /sync-webhook-plan-invalid/);
  await assert.rejects(ensureWebhookPlan({ plans: c.plans, receipts: c.receipts, activity: { ...old.activity, value: 'x' },
    assertCurrent: async () => {}, build: () => assert.fail() }), /plan-invalid/);
});
