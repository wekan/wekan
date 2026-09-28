'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { controlActivityNotification: control, cancelActivityNotification: cancel, readActivityNotificationControl: read,
  assertActivityNotificationUnpaused: unpaused } = require('../../server/lib/activityNotificationControl');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`activity_control_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { controls: db.collection('controls'), intents: db.collection('intents'), leases: db.collection('leases'),
    intentId: 'a'.repeat(64), paused: true, expectedRevision: 0, requestId: 'first-request-1234567890', actorId: 'admin', assertAdmin: async () => {} };
  await f.intents.insertOne({ _id: f.intentId, state: 'pending' });
  return f;
}
test('control input rejects invalid identities, booleans and revisions before any access', async () => {
  const valid = { intentId: 'a'.repeat(64), paused: true, expectedRevision: 0,
    requestId: 'first-request-1234567890', actorId: 'admin', assertAdmin: () => assert.fail('must validate first') };
  for (const invalid of [{ intentId: 'bad' }, { paused: 'true' }, { expectedRevision: -1 }, { expectedRevision: 1.1 },
    { expectedRevision: Number.MAX_SAFE_INTEGER }, { requestId: 'short' }, { actorId: '' }, { assertAdmin: null }]) {
    await assert.rejects(control({ ...valid, ...invalid }), /control-invalid/);
  }
});
test('holds survive a fresh reader, retries are idempotent and old decisions cannot undo resume', { skip: !uri }, async t => {
  const f = await fixture(t);
  await unpaused(f);
  assert.deepEqual(await control(f), { revision: 1, paused: true });
  await assert.rejects(unpaused(f), /notification-paused/);
  const first = await f.controls.findOne({ _id: f.intentId });
  assert.deepEqual(await control(f), { revision: 1, paused: true });
  assert.deepEqual(await f.controls.findOne({ _id: f.intentId }), first);
  const resumed = { ...f, paused: false, expectedRevision: 1, requestId: 'second-request-123456789' };
  assert.deepEqual(await control(resumed), { revision: 2, paused: false });
  await unpaused(f);
  await assert.rejects(control(f), /control-conflict/);
  assert.equal((await read(f)).revision, 2);
  assert.equal(await f.controls.countDocuments({}), 1);
  for (const altered of [{ actorId: 'other' }, { paused: true }]) await assert.rejects(control({ ...resumed, ...altered }), /control-conflict/);
});
test('lost write replies reconcile but false acknowledgements cannot claim a durable hold', { skip: !uri }, async t => {
  const f = await fixture(t);
  const controls = { findOne: (...args) => f.controls.findOne(...args), insertOne: async (...args) => {
    await f.controls.insertOne(...args); throw new Error('lost acknowledgement');
  } };
  assert.deepEqual(await control({ ...f, controls }), { revision: 1, paused: true });
  controls.replaceOne = async () => ({ matchedCount: 1 });
  const resume = { ...f, controls, paused: false, expectedRevision: 1, requestId: 'second-request-123456789' };
  await assert.rejects(control(resume), /control-unconfirmed/);
  await assert.rejects(unpaused(f), /notification-paused/);
  controls.replaceOne = async (...args) => { await f.controls.replaceOne(...args); throw new Error('lost acknowledgement'); };
  assert.deepEqual(await control(resume), { revision: 2, paused: false });
});
test('revoked access, completed or missing intents, and malformed control state prevent mutations', { skip: !uri }, async t => {
  const f = await fixture(t);
  let checks = 0;
  await assert.rejects(control({ ...f, assertAdmin: async () => { if (++checks === 2) throw new Error('revoked'); } }), /revoked/);
  assert.equal(await f.controls.countDocuments({}), 0);
  assert.equal(await f.leases.countDocuments({}), 0);
  await f.intents.updateOne({ _id: f.intentId }, { $set: { state: 'completed' } });
  await assert.rejects(control(f), /not-pending/);
  await f.intents.deleteMany({});
  await assert.rejects(control(f), /not-pending/);
  await f.intents.insertOne({ _id: f.intentId, state: 'pending' });
  await f.controls.insertOne({ _id: f.intentId, paused: false });
  await assert.rejects(control(f), /control-invalid/);
  await assert.rejects(unpaused(f), /control-invalid/);
});
test('a delayed writer cannot replace a successor decision even after losing its lease', { skip: !uri }, async t => {
  const f = await fixture(t);
  await control(f);
  const controls = { findOne: (...args) => f.controls.findOne(...args), replaceOne: async (...args) => {
    // A successor has already advanced the persistent revision. The old owner
    // is delayed just after its last lease check and before its write.
    await f.controls.updateOne({ _id: f.intentId }, { $set: { revision: 3, requestId: 'successor-request-12345', paused: true } });
    return f.controls.replaceOne(...args);
  } };
  await assert.rejects(control({ ...f, controls, paused: false, expectedRevision: 1, requestId: 'second-request-123456789' }), /unconfirmed/);
  assert.equal((await read(f)).revision, 3);
  await assert.rejects(unpaused(f), /notification-paused/);
});
test('concurrent requests share the delivery reservation and cannot both claim the same revision', { skip: !uri }, async t => {
  const f = await fixture(t);
  let entered, release;
  const ready = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const controls = { findOne: (...args) => f.controls.findOne(...args), insertOne: async (...args) => {
    entered(); await gate; return f.controls.insertOne(...args);
  } };
  const running = control({ ...f, controls });
  try {
    await ready;
    await assert.rejects(control({ ...f, requestId: 'second-request-123456789' }), { code: 'sync-busy' });
  } finally { release(); }
  assert.deepEqual(await running, { revision: 1, paused: true });
  await assert.rejects(control({ ...f, requestId: 'second-request-123456789' }), /control-conflict/);
});

test('cancellation is terminal, idempotent and retains pending evidence without permitting resume', { skip: !uri }, async t => {
  const f = await fixture(t);
  await control(f);
  const request = { ...f, expectedRevision: 1, requestId: 'cancel-request-123456789' };
  const result = { revision: 2, paused: true, cancelled: true };
  assert.deepEqual(await cancel(request), result);
  assert.deepEqual(await cancel(request), result);
  await assert.rejects(unpaused(f), /notification-cancelled/);
  await assert.rejects(control({ ...f, expectedRevision: 2, paused: false, requestId: 'resume-request-123456789' }), /notification-cancelled/);
  await assert.rejects(control(f), /notification-cancelled/);
  assert.equal((await f.intents.findOne({ _id: f.intentId })).state, 'pending');
  assert.equal(await f.controls.countDocuments({}), 1);
});
test('orphan cancellation needs no source activity and reconciles a lost acknowledgement', { skip: !uri }, async t => {
  const f = await fixture(t);
  const controls = { findOne: (...args) => f.controls.findOne(...args), insertOne: async (...args) => {
    await f.controls.insertOne(...args); throw new Error('lost cancellation reply');
  } };
  assert.equal((await cancel({ ...f, controls })).cancelled, true);
  await assert.rejects(cancel({ ...f, actorId: 'other' }), /notification-cancelled/);
  await f.controls.updateOne({ _id: f.intentId }, { $set: { cancelled: false } });
  await assert.rejects(unpaused(f), /control-invalid/);
});
