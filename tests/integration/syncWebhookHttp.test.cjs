'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareWebhookPlan, deliverWebhookPlan } = require('../../server/lib/syncWebhookPlan');
const { deliverStoredWebhookHttp, MAX_RESPONSE_BYTES } = require('../../server/lib/syncWebhookHttp');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t, is2way = true) {
  const client = await new MongoClient(uri).connect(), db = client.db(`webhook_http_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const activity = { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor' };
  const plan = await prepareWebhookPlan({ activity,
    integrations: [{ _id: 'hook', boardId: 'board', enabled: true, url: 'https://example.test/hook',
      type: is2way ? 'bidirectional-webhooks' : 'outgoing-webhooks' }],
    prepare: async () => ({ url: 'https://example.test/hook', headers: { 'Content-Type': 'application/json' },
      body: '{"cardId":"card"}', is2way, language: 'en' }) });
  const requests = [], actions = [];
  const responses = db.collection('responses'), receipts = db.collection('receipts');
  const options = { responses, assertCurrent: async () => {}, assertTarget: async () => true,
    requestHttp: async (url, request) => { requests.push({ url, ...request }); return { status: 200, text: async () => '{"comment":"Reply"}' }; },
    completeResponse: async action => { actions.push(action); return action.deliveryId; } };
  const run = extra => deliverWebhookPlan({ activity, plan, receipts, assertCurrent: options.assertCurrent, assertTarget: options.assertTarget,
    deliver: item => deliverStoredWebhookHttp({ ...options, ...extra, item }) });
  return { run, options, requests, actions, responses, receipts, plan, activity };
}
test('stored HTTP acceptance survives response-action failure without another request', { skip: !uri }, async t => {
  const f = await fixture(t);
  await assert.rejects(f.run({ completeResponse: async () => { throw new Error('action interrupted'); } }), /action interrupted/);
  assert.equal(await f.responses.countDocuments({}), 1); assert.equal(await f.receipts.countDocuments({}), 0);
  await f.run(); await f.run();
  assert.equal(f.requests.length, 1); assert.equal(f.actions.length, 1);
  assert.equal(f.actions[0].data.comment, 'Reply');
  assert.equal(f.requests[0].maxRedirects, 0); assert.equal(f.requests[0].maxResponseBytes, MAX_RESPONSE_BYTES);
  assert.equal(f.requests[0].headers['X-Wekan-Delivery-Id'], f.actions[0].deliveryId);
});
test('uncertain response insert is read back and saved response corruption never triggers a replacement HTTP request', { skip: !uri }, async t => {
  const f = await fixture(t);
  const responses = { findOne: query => f.responses.findOne(query), insertOne: async row => {
    await f.responses.insertOne(row); throw new Error('lost Mongo reply');
  } };
  await f.run({ responses, completeResponse: async () => 'wrong' }).then(() => assert.fail('requires effect receipt'), error => assert.match(error.message, /response-unconfirmed/));
  assert.equal(f.requests.length, 1); assert.equal(await f.receipts.countDocuments({}), 0);
  await f.responses.updateOne({}, { $set: { body: '{"comment":"Changed"}' } });
  await assert.rejects(f.run(), /response-invalid/); assert.equal(f.requests.length, 1);
});
test('non-success, lost body and oversized UTF-8 responses never acknowledge delivery', { skip: !uri }, async t => {
  const f = await fixture(t);
  for (const response of [{ status: 500, text: async () => 'error' },
    { status: 200, text: async () => { throw new Error('body interrupted'); } },
    { status: 200, text: async () => 'ä'.repeat(MAX_RESPONSE_BYTES) }]) {
    await assert.rejects(f.run({ requestHttp: async () => response }), /http-rejected|body interrupted|response-too-large/);
    assert.equal(await f.responses.countDocuments({}), 0); assert.equal(await f.receipts.countDocuments({}), 0);
  }
});
test('one-way and non-JSON two-way replies finish without a response action', { skip: !uri }, async t => {
  const one = await fixture(t, false);
  await one.run({ completeResponse: undefined }); assert.equal(one.actions.length, 0);
  const two = await fixture(t);
  await two.run({ requestHttp: async () => ({ status: 204, text: async () => '' }),
    completeResponse: async () => assert.fail('no JSON action') });
  assert.equal(await two.receipts.countDocuments({}), 1);
});
test('revoked target access prevents replay action and changed request cannot reuse old HTTP evidence', { skip: !uri }, async t => {
  const f = await fixture(t);
  await assert.rejects(f.run({ completeResponse: async () => { throw new Error('pause'); } }), /pause/);
  await assert.rejects(f.run({ assertTarget: async () => false }), /target-denied/);
  f.plan.targets[0].request.body = '{"changed":true}';
  await assert.rejects(f.run(), /response-invalid/);
  assert.equal(f.requests.length, 1); assert.equal(f.actions.length, 0);
});
