'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareWebhookPlan, ensureWebhookPlan, deliverWebhookPlan, planId, deliveryId } = require('../../server/lib/syncWebhookPlan');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
const activity = { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor', createdAt: new Date(0) };
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`webhook_plan_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const plans = db.collection('plans'), receipts = db.collection('receipts'), sent = [];
  const build = () => prepareWebhookPlan({ activity,
    integrations: ['one','two'].map(_id => ({ _id, boardId: 'board', enabled: true, url: 'https://example.test/hook' })),
    prepare: async () => ({ url: 'https://example.test/hook', headers: { 'Content-Type': 'application/json' },
      body: '{"value":0}', is2way: false, language: 'fi' }) });
  return { activity, plans, receipts, sent, build, assertCurrent: async () => {}, assertTarget: async () => true,
    deliver: async item => { sent.push(item); return item.deliveryId; } };
}
function proxy(collection, overrides) {
  return new Proxy(collection, { get(target, key) { if (Object.hasOwn(overrides, key)) return overrides[key];
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value; } });
}
test('restart uses the saved snapshot and skips confirmed HTTP delivery after the next target fails', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensureWebhookPlan(f);
  await assert.rejects(deliverWebhookPlan({ ...f, plan, deliver: async item => {
    if (item.target.integrationId === 'two') throw new Error('HTTP unavailable');
    return f.deliver(item);
  } }), /HTTP unavailable/);
  assert.equal(await f.receipts.countDocuments({}), 1);
  const restored = await ensureWebhookPlan({ ...f, build: async () => assert.fail('never rebuild') });
  assert.equal(await deliverWebhookPlan({ ...f, plan: restored }), planId('event'));
  assert.deepEqual(f.sent.map(item => item.target.integrationId), ['one', 'two']);
  for (const item of f.sent) {
    assert.equal(item.request.body, '{"value":0}'); assert.equal(item.request.language, 'fi');
    assert.equal(item.request.headers['X-Wekan-Delivery-Id'], deliveryId('event', item.target.integrationId));
  }
  await deliverWebhookPlan({ ...f, plan }); assert.equal(f.sent.length, 2);
});
test('lost Mongo insertion acknowledgements are confirmed by readback for plans and receipts', { skip: !uri }, async t => {
  const f = await fixture(t);
  const plans = proxy(f.plans, { insertOne: async row => { await f.plans.insertOne(row); throw new Error('lost plan reply'); } });
  const receipts = proxy(f.receipts, { insertOne: async row => { await f.receipts.insertOne(row); throw new Error('lost receipt reply'); } });
  const plan = await ensureWebhookPlan({ ...f, plans });
  await deliverWebhookPlan({ ...f, plan, receipts });
  await deliverWebhookPlan({ ...f, plan, receipts }); assert.equal(f.sent.length, 2);
});
test('ambiguous HTTP acceptance retries the same ID; no acceptance receipt is fabricated', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensureWebhookPlan(f);
  let accepted;
  await assert.rejects(deliverWebhookPlan({ ...f, plan, deliver: async item => {
    accepted = item; throw new Error('HTTP reply lost');
  } }), /HTTP reply lost/);
  assert.equal(await f.receipts.countDocuments({}), 0);
  await deliverWebhookPlan({ ...f, plan });
  assert.deepEqual(f.sent[0], accepted);
});
test('concurrent builders retain first snapshot; corrupt later receipts prevent any new sends', { skip: !uri }, async t => {
  const f = await fixture(t);
  let entered = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const build = body => async () => { const p = await f.build(); p.targets[0].request.body = JSON.stringify({ body });
    if (++entered === 2) release(); await gate; return p; };
  const plans = await Promise.all([ensureWebhookPlan({ ...f, build: build('first') }), ensureWebhookPlan({ ...f, build: build('second') })]);
  assert.deepEqual(plans[0], plans[1]);
  await f.receipts.insertOne({ _id: deliveryId('event', 'two'), checksum: 'corrupt' });
  await assert.rejects(deliverWebhookPlan({ ...f, plan: plans[0] }), /receipt-invalid/);
  assert.equal(f.sent.length, 0);
  await f.plans.updateOne({ _id: planId('event') }, { $set: { 'plan.targets.0.request.url': 'https://changed.test' } });
  await assert.rejects(ensureWebhookPlan({ ...f, build: async () => assert.fail('do not rebuild corruption') }), /plan-invalid/);
});
test('revoked ownership or target access prevents remaining delivery, including after HTTP returns', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensureWebhookPlan(f);
  let allowed = true;
  await assert.rejects(deliverWebhookPlan({ ...f, plan, assertTarget: async () => allowed,
    deliver: async item => { allowed = false; return f.deliver(item); } }), /target-denied/);
  assert.equal(f.sent.length, 1); assert.equal(await f.receipts.countDocuments({}), 0);
  await assert.rejects(deliverWebhookPlan({ ...f, plan, assertCurrent: async () => { throw new Error('lease expired'); } }), /lease expired/);
  assert.equal(f.sent.length, 1);
});
test('failed receipt persistence leaves the accepted delivery unacknowledged and retries its stable identity', { skip: !uri }, async t => {
  const f = await fixture(t), plan = await ensureWebhookPlan(f);
  const receipts = proxy(f.receipts, { insertOne: async () => { throw new Error('storage unavailable'); } });
  await assert.rejects(deliverWebhookPlan({ ...f, plan, receipts }), /storage unavailable/);
  assert.equal(f.sent.length, 1); assert.equal(await f.receipts.countDocuments({}), 0);
  await deliverWebhookPlan({ ...f, plan });
  assert.equal(f.sent.length, 3);
  assert.deepEqual(f.sent[0], f.sent[1]);
});
