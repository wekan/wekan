'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { createActivityNotificationRecovery: create, activityNotificationRecoveryInterval: interval } = require('../../server/lib/activityNotificationRecovery');
const { withSyncLease } = require('../../server/lib/syncLease');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('recovery interval is bounded and invalid batch policies are refused', () => {
  assert.equal(interval({}), 1000);
  for (const value of ['0', '999', '60001', '1.5', 'NaN']) assert.throws(() => interval({ ACTIVITY_NOTIFICATION_RECOVERY_INTERVAL_MS: value }));
  assert.throws(() => create({ run() {}, limit: 0 }));
});
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`activity_recovery_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  return { intents: db.collection('intents'), leases: db.collection('leases') };
}
test('bounded scans advance past failed and busy rows, skip completed rows and wrap for later recovery', { skip: !uri }, async t => {
  const f = await fixture(t), seen = [];
  await f.intents.insertMany(['a', 'b', 'c', 'd'].map(_id => ({ _id, state: _id === 'd' ? 'completed' : 'pending', privatePayload: 'not selected' })));
  const scan = create({ ...f, limit: 2, run: async id => {
    seen.push(id);
    if (id === 'a') throw new Error('orphan');
    if (id === 'b') throw Object.assign(new Error('busy'), { code: 'sync-busy' });
    await f.intents.updateOne({ _id: id }, { $set: { state: 'completed' } });
    return 'completed';
  } });
  assert.deepEqual(await scan(), { visited: 2, completed: 0, failed: 1, busy: 1, skipped: 0 });
  assert.deepEqual(await scan(), { visited: 1, completed: 1, failed: 0, busy: 0, skipped: 0 });
  await scan();
  assert.deepEqual(seen, ['a', 'b', 'c', 'a', 'b']);
});
test('local scans coalesce and separate workers respect the same renewable reservation', { skip: !uri }, async t => {
  const f = await fixture(t); await f.intents.insertOne({ _id: 'event', state: 'pending' });
  let release, entered;
  const gate = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { entered = resolve; });
  const first = create({ ...f, run: id => withSyncLease(f.leases, id, async ({ assertCurrent }) => {
    entered(); await gate; await assertCurrent(); return 'completed';
  }) });
  const pending = first(); assert.equal(first(), pending); await ready;
  const other = create({ ...f, run: id => withSyncLease(f.leases, id, () => assert.fail('second worker cannot enter')) });
  assert.equal((await other()).busy, 1);
  release(); assert.equal((await pending).completed, 1);
  assert.equal(await f.leases.countDocuments({}), 0);
});
test('expired owners are reclaimed and losing ownership cannot remove a successor reservation', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.leases.insertOne({ _id: 'event', owner: 'crashed', expiresAt: new Date(0) });
  await assert.rejects(withSyncLease(f.leases, 'event', async ({ assertCurrent }) => {
    await f.leases.updateOne({ _id: 'event' }, { $set: { owner: 'successor', expiresAt: new Date(Date.now() + 60000) } });
    await assertCurrent();
    assert.fail('lost owner cannot continue');
  }), { code: 'sync-lease-lost' });
  assert.equal((await f.leases.findOne({ _id: 'event' })).owner, 'successor');
});
test('paused work remains pending and does not hide later runnable work', { skip: !uri }, async t => {
  const f = await fixture(t);
  await f.intents.insertMany(['held', 'ready'].map(_id => ({ _id, state: 'pending' })));
  const scan = create({ ...f, limit: 1, run: async id => {
    if (id === 'held') throw new Error('activity-notification-paused');
    await f.intents.updateOne({ _id: id }, { $set: { state: 'completed' } });
    return 'completed';
  } });
  assert.deepEqual(await scan(), { visited: 1, completed: 0, failed: 0, busy: 0, skipped: 1 });
  assert.deepEqual(await scan(), { visited: 1, completed: 1, failed: 0, busy: 0, skipped: 0 });
  assert.equal((await f.intents.findOne({ _id: 'held' })).state, 'pending');
});
