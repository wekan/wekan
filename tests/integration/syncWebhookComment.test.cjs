'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareWebhookCommentPlan, ensureWebhookCommentPlan, applyWebhookCommentPlan, PENDING, REVISION } = require('../../server/lib/syncWebhookComment');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`hook_comment_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const context = { activity: { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor' },
    target: { integrationId: 'hook', integrationBoardId: 'board', request: { is2way: true } },
    data: { boardId: 'board', cardId: 'card', commentId: 'comment', comment: 'Reply' } };
  const comments = db.collection('comments'), receipts = db.collection('receipts'), plans = db.collection('plans');
  await comments.insertOne({ _id: 'comment', boardId: 'board', cardId: 'card', text: 'Original', userId: 'author', createdAt: new Date(0), modifiedAt: new Date(1) });
  const f = { context, comments, receipts, plans, assertCurrent: async () => {},
    build: async context => prepareWebhookCommentPlan({ context, comment: await comments.findOne({ _id: 'comment' }), modifiedAt: new Date(2) }) };
  f.plan = await ensureWebhookCommentPlan(f); return f;
}
function proxy(collection, overrides) { return new Proxy(collection, { get(target, key) {
  if (Object.hasOwn(overrides, key)) return overrides[key]; const value = target[key];
  return typeof value === 'function' ? value.bind(target) : value;
} }); }
test('atomic pending evidence recovers after a user edit without restoring old reply text', { skip: !uri }, async t => {
  const f = await fixture(t);
  const receipts = proxy(f.receipts, { insertOne: async () => { throw new Error('receipt storage unavailable'); } });
  await assert.rejects(applyWebhookCommentPlan({ ...f, receipts }), /receipt storage unavailable/);
  assert.equal((await f.comments.findOne({ _id: 'comment' })).text, 'Reply');
  await f.comments.updateOne({ _id: 'comment' }, { $set: { text: 'Later user edit', modifiedAt: new Date(3) } });
  f.plan = await ensureWebhookCommentPlan({ ...f, build: async () => assert.fail('never rebuild') });
  await applyWebhookCommentPlan(f);
  const current = await f.comments.findOne({ _id: 'comment' });
  assert.equal(current.text, 'Later user edit'); assert.equal(current.modifiedAt.getTime(), 3);
  assert.equal(Object.hasOwn(current, PENDING), false); assert.equal(typeof current[REVISION], 'string');
  await applyWebhookCommentPlan(f); assert.equal(await f.receipts.countDocuments({}), 1);
});
test('changed, moved or deleted comments are never overwritten or recreated', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.comments.updateOne({ _id: 'comment' }, { $set: { text: 'User changed before delivery' } });
  await assert.rejects(applyWebhookCommentPlan(f), /conflict/);
  await f.comments.updateOne({ _id: 'comment' }, { $set: { boardId: 'foreign' } });
  await assert.rejects(applyWebhookCommentPlan(f), /missing/);
  await f.comments.deleteOne({ _id: 'comment' });
  await assert.rejects(applyWebhookCommentPlan(f), /missing/);
  assert.equal(await f.receipts.countDocuments({}), 0); assert.equal(await f.comments.countDocuments({}), 0);
});
test('lost mutation/receipt/cleanup replies are verified by readback; cleanup failure can resume after receipt', { skip: !uri }, async t => {
  const f = await fixture(t);
  let blockCleanup = true;
  const comments = proxy(f.comments, { updateOne: async (selector, modifier) => {
    if (modifier.$unset && blockCleanup) throw new Error('cleanup unavailable');
    await f.comments.updateOne(selector, modifier); throw new Error('lost write reply');
  } });
  const receipts = proxy(f.receipts, { insertOne: async row => { await f.receipts.insertOne(row); throw new Error('lost receipt reply'); } });
  await assert.rejects(applyWebhookCommentPlan({ ...f, comments, receipts }), /cleanup unavailable/);
  assert.equal(await f.receipts.countDocuments({}), 1);
  blockCleanup = false;
  await applyWebhookCommentPlan({ ...f, comments, receipts });
  assert.equal(Object.hasOwn(await f.comments.findOne({ _id: 'comment' }), PENDING), false);
});
test('delayed original mutation is fenced out after receipt cleanup even if original text returns', { skip: !uri }, async t => {
  const f = await fixture(t); let delayed;
  const comments = proxy(f.comments, { updateOne: async (selector, modifier) => {
    if (modifier.$set?.text) delayed = { selector: structuredClone(selector), modifier: structuredClone(modifier) };
    return f.comments.updateOne(selector, modifier);
  } });
  await applyWebhookCommentPlan({ ...f, comments });
  await f.comments.updateOne({ _id: 'comment' }, { $set: { text: 'Original', modifiedAt: new Date(1) } });
  const result = await f.comments.updateOne(delayed.selector, delayed.modifier);
  assert.equal(result.matchedCount, 0); assert.equal((await f.comments.findOne({ _id: 'comment' })).text, 'Original');
});
test('invalid receipts, foreign pending work and revoked guards prevent writes', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.comments.updateOne({ _id: 'comment' }, { $set: { [PENDING]: { other: 'operation' } } });
  await assert.rejects(applyWebhookCommentPlan(f), /conflict/);
  await assert.rejects(applyWebhookCommentPlan({ ...f, assertCurrent: async () => { throw new Error('access revoked'); } }), /access revoked/);
  await f.receipts.insertOne({ _id: f.plan.deliveryId, version: 1, checksum: 'corrupt' });
  await assert.rejects(applyWebhookCommentPlan(f), /receipt-invalid/);
  assert.equal((await f.comments.findOne({ _id: 'comment' })).text, 'Original');
});
test('stored HTTP response and comment plan recover together without repeating HTTP or replacing later text', { skip: !uri }, async t => {
  const { prepareWebhookPlan, deliveryId } = require('../../server/lib/syncWebhookPlan');
  const { deliverStoredWebhookHttp } = require('../../server/lib/syncWebhookHttp');
  const f = await fixture(t);
  await f.plans.deleteMany({});
  const http = (await prepareWebhookPlan({ activity: f.context.activity,
    integrations: [{ _id: 'hook', boardId: 'board', enabled: true, type: 'bidirectional-webhooks', url: 'https://example.test/hook' }],
    prepare: async () => ({ url: 'https://example.test/hook', body: '{}', is2way: true, language: 'en', headers: { 'Content-Type': 'application/json' } }) })).targets[0];
  const id = deliveryId('event', 'hook');
  const item = { activity: f.context.activity, target: http, deliveryId: id,
    request: { ...http.request, headers: { ...http.request.headers, 'X-Wekan-Delivery-Id': id } } };
  // A separate actual Mongo collection holds the accepted HTTP response.
  const client = await new MongoClient(uri).connect();
  const responseDb = client.db(`hook_comment_http_${new ObjectId().toHexString()}`);
  t.after(async () => { await responseDb.dropDatabase(); await client.close(); });
  const responses = responseDb.collection('responses');
  let requests = 0, unavailable = true;
  const receipts = proxy(f.receipts, { insertOne: async row => {
    if (unavailable) throw new Error('receipt unavailable'); return f.receipts.insertOne(row);
  } });
  async function completeResponse({ activity, target, data }) {
    const context = { activity, target, data };
    const plan = await ensureWebhookCommentPlan({ ...f, context });
    return applyWebhookCommentPlan({ ...f, context, plan, receipts });
  }
  const run = () => deliverStoredWebhookHttp({ item, responses, assertCurrent: f.assertCurrent, assertTarget: async () => true,
    requestHttp: async () => { requests++; return { status: 200, text: async () => JSON.stringify(f.context.data) }; }, completeResponse });
  await assert.rejects(run(), /receipt unavailable/);
  assert.equal((await f.comments.findOne({ _id: 'comment' })).text, 'Reply');
  await f.comments.updateOne({ _id: 'comment' }, { $set: { text: 'User edit after HTTP', modifiedAt: new Date(3) } });
  unavailable = false;
  assert.equal(await run(), id); assert.equal(requests, 1);
  assert.equal((await f.comments.findOne({ _id: 'comment' })).text, 'User edit after HTTP');
  assert.equal(await f.receipts.countDocuments({}), 1);
});
test('saved no-action plans stay inactive when the missing comment later appears; damaged plans are not rebuilt', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.plans.deleteMany({}); await f.comments.deleteMany({});
  const plan = await ensureWebhookCommentPlan(f);
  assert.equal(plan.change, null);
  await f.comments.insertOne({ _id: 'comment', boardId: 'board', cardId: 'card', text: 'New later comment', createdAt: new Date(9) });
  const saved = await ensureWebhookCommentPlan({ ...f, build: async () => assert.fail('never rebuild') });
  await applyWebhookCommentPlan({ ...f, plan: saved });
  assert.equal((await f.comments.findOne({ _id: 'comment' })).text, 'New later comment');
  await f.plans.updateOne({ _id: plan.deliveryId }, { $set: { checksum: 'corrupt' } });
  await assert.rejects(ensureWebhookCommentPlan({ ...f, build: async () => assert.fail('never rebuild corruption') }), /plan-invalid/);
});
test('lost plan insertion reply is read back and concurrent builders retain one original snapshot', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.plans.deleteMany({});
  const plans = proxy(f.plans, { insertOne: async row => { await f.plans.insertOne(row); throw new Error('lost plan reply'); } });
  assert.equal((await ensureWebhookCommentPlan({ ...f, plans })).change.before.text, 'Original');
  await f.plans.deleteMany({});
  let entered = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const build = text => async context => {
    const comment = await f.comments.findOne({ _id: 'comment' }); comment.text = text;
    const candidate = prepareWebhookCommentPlan({ context, comment, modifiedAt: new Date(2) });
    if (++entered === 2) release(); await gate; return candidate;
  };
  const results = await Promise.all([ensureWebhookCommentPlan({ ...f, build: build('first') }), ensureWebhookCommentPlan({ ...f, build: build('second') })]);
  assert.deepEqual(results[0], results[1]); assert.equal(await f.plans.countDocuments({}), 1);
});
