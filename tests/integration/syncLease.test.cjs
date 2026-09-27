'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { withSyncLease } = require('../../server/lib/syncLease');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('Sync leases coordinate real database connections and recover expired owners', { skip: !uri }, async t => {
  const clients = [new MongoClient(uri), new MongoClient(uri)];
  const name = `sync_lease_${new ObjectId().toHexString()}`;
  await Promise.all(clients.map(client => client.connect()));
  const collections = clients.map(client => client.db(name).collection('leases'));
  t.after(async () => {
    await clients[0].db(name).dropDatabase();
    await Promise.all(clients.map(client => client.close()));
  });
  let time = Date.now();
  const options = { now: () => new Date(time), leaseMs: 100, heartbeatMs: 0 };
  const run = (worker, id, work) => withSyncLease(collections[worker], id, work, options);
  await t.test('one owner per list, independent lists and cleanup on failure', async () => {
    await run(0, 'a', async ({ assertCurrent }) => {
      assert.deepEqual(Object.keys(await collections[0].findOne({ _id: 'a' })).sort(), ['_id', 'expiresAt', 'owner']);
      await assert.rejects(run(1, 'a', () => assert.fail('busy callback ran')), { code: 'sync-busy' });
      assert.equal(await run(1, 'b', () => 42), 42);
      time += 90;
      await assertCurrent();
      time += 90;
      await assert.rejects(run(1, 'a', () => assert.fail('renewed lease was stolen')), { code: 'sync-busy' });
    });
    assert.equal(await collections[0].countDocuments({}), 0);
    await assert.rejects(run(1, 'a', () => { throw new Error('work failed'); }), /work failed/);
    assert.equal(await collections[0].countDocuments({}), 0);
  });
  await t.test('expired owner cannot renew or release its replacement', async () => {
    let finishOld, oldReady, finishNew, newReady;
    const readyOld = new Promise(resolve => { oldReady = resolve; });
    const releaseOld = new Promise(resolve => { finishOld = resolve; });
    const readyNew = new Promise(resolve => { newReady = resolve; });
    const releaseNew = new Promise(resolve => { finishNew = resolve; });
    const old = run(0, 'a', async ({ assertCurrent }) => {
      oldReady(); await releaseOld; await assertCurrent();
    });
    // Attach the rejection handler before deliberately expiring the owner.
    const rejected = assert.rejects(old, { code: 'sync-lease-lost' });
    await readyOld;
    time += 101;
    const replacement = run(1, 'a', async () => { newReady(); await releaseNew; });
    await readyNew;
    const newOwner = (await collections[1].findOne({ _id: 'a' })).owner;
    finishOld(); await rejected;
    assert.equal((await collections[1].findOne({ _id: 'a' })).owner, newOwner);
    finishNew(); await replacement;
    assert.equal(await collections[0].countDocuments({}), 0);
  });
  await t.test('a crashed process lease is reclaimed without its callback', async () => {
    await collections[0].insertOne({ _id: 'crashed', owner: 'dead-process', expiresAt: new Date(time - 1) });
    assert.equal(await run(1, 'crashed', () => 'recovered'), 'recovered');
    assert.equal(await collections[0].countDocuments({}), 0);
  });
  await t.test('an expired owner fails closed even before another worker claims it', async () => {
    let writes = 0;
    await assert.rejects(run(0, 'expired', async ({ assertCurrent }) => {
      time += 101;
      await assertCurrent();
      writes++;
    }), { code: 'sync-lease-lost' });
    assert.equal(writes, 0);
    assert.equal(await collections[0].countDocuments({}), 0);
  });
  await t.test('heartbeat renews while work waits and stops after release', async () => {
    await withSyncLease(collections[0], 'heartbeat', async () => {
      const initial = await collections[0].findOne({ _id: 'heartbeat' });
      // Poll the stored expiry, so the test observes renewal instead of merely
      // hoping a timer fired before an assertion.
      const deadline = Date.now() + 3000;
      let current;
      do {
        await new Promise(resolve => setTimeout(resolve, 10));
        current = await collections[0].findOne({ _id: 'heartbeat' });
      } while (current.expiresAt <= initial.expiresAt && Date.now() < deadline);
      assert.ok(current.expiresAt > initial.expiresAt);
      await assert.rejects(withSyncLease(collections[1], 'heartbeat', () => {}), { code: 'sync-busy' });
    }, { heartbeatMs: 10 });
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(await collections[0].countDocuments({}), 0);
  });
});
