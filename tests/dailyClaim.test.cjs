'use strict';

// #6861: work every server scheduled for itself runs once per installation.
// Run: node tests/dailyClaim.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { claimDailyJob, claimIntervalRun, dayKey, COLLECTION } = require('../models/lib/dailyClaim');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }
const dup = () => Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });

// A database whose inserts are unique on _id, like MongoDB's.
function fakeDb() {
  const docs = new Map();
  return { docs, collection: () => ({ async insertOne(doc) { await null; if (docs.has(doc._id)) throw dup(); docs.set(doc._id, doc); } }) };
}
// One document per job; updateOne is atomic like MongoDB's, and a document that
// exists but does not match the filter is a duplicate key under upsert.
function fakeIntervalCollection(initial) {
  const store = new Map(initial ? [[initial._id, { ...initial }]] : []);
  return {
    store,
    async updateOne(filter, update, options = {}) {
      await null;
      const doc = store.get(filter._id);
      const matches = doc && filter.$or.some(branch => ('at' in branch && branch.at.$lt
        ? doc.at && doc.at < branch.at.$lt : branch.at && branch.at.$exists === false ? !('at' in doc) : false));
      if (matches) { Object.assign(doc, update.$set); return { modifiedCount: 1, upsertedCount: 0 }; }
      if (doc) { if (options.upsert) throw dup(); return { modifiedCount: 0, upsertedCount: 0 }; }
      if (!options.upsert) return { modifiedCount: 0, upsertedCount: 0 };
      store.set(filter._id, { _id: filter._id, ...update.$set });
      return { modifiedCount: 0, upsertedCount: 1 };
    },
  };
}

(async () => {
  await test('24 servers claiming the same day: exactly one runs the job', async () => {
    const db = fakeDb();
    const now = new Date(2026, 10, 2, 8, 0, 3);
    const results = await Promise.all(Array.from({ length: 24 }, () => claimDailyJob(db, 'notification-cleanup', now)));
    assert.strictEqual(results.filter(Boolean).length, 1);
    assert.deepStrictEqual([...db.docs.keys()], ['notification-cleanup:2026-11-02']);
    assert.strictEqual(COLLECTION, 'dailyJobRuns');
  });

  await test('jobs and days are independent', async () => {
    const db = fakeDb();
    assert.strictEqual(await claimDailyJob(db, 'a', new Date(2026, 10, 2, 8)), true);
    assert.strictEqual(await claimDailyJob(db, 'b', new Date(2026, 10, 2, 8)), true, 'another job, same day');
    assert.strictEqual(await claimDailyJob(db, 'a', new Date(2026, 10, 3, 8)), true, 'the next day');
    assert.strictEqual(await claimDailyJob(db, 'a', new Date(2026, 10, 3, 23)), false, 'the same day again');
    assert.strictEqual(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  });

  await test('negative: any other database error is not swallowed', async () => {
    const down = { collection: () => ({ insertOne: async () => { throw Object.assign(new Error('down'), { code: 6 }); } }) };
    await assert.rejects(() => claimDailyJob(down, 'a'), /down/);
    const broken = { updateOne: async () => { throw new Error('down'); } };
    await assert.rejects(() => claimIntervalRun(broken, 'lastRun', 1000), /down/);
  });

  await test('an interval run: 24 servers at the same moment, exactly one scans', async () => {
    const day = 24 * 3600 * 1000;
    const now = new Date(2026, 10, 2, 8);
    const coll = fakeIntervalCollection({ _id: 'lastRun', at: new Date(now.getTime() - day - 1000) });
    const results = await Promise.all(Array.from({ length: 24 }, () => claimIntervalRun(coll, 'lastRun', day, now)));
    assert.strictEqual(results.filter(Boolean).length, 1);
    assert.strictEqual(coll.store.get('lastRun').at.getTime(), now.getTime());
  });

  await test('an interval run: not due yet is not claimed; never run before is', async () => {
    const day = 24 * 3600 * 1000;
    const now = new Date(2026, 10, 2, 8);
    const recent = fakeIntervalCollection({ _id: 'lastRun', at: new Date(now.getTime() - 3600 * 1000) });
    assert.strictEqual(await claimIntervalRun(recent, 'lastRun', day, now), false);
    const fresh = fakeIntervalCollection(null);
    const many = await Promise.all(Array.from({ length: 24 }, () => claimIntervalRun(fresh, 'lastRun', day, now)));
    assert.strictEqual(many.filter(Boolean).length, 1, 'with no document at all, still exactly one');
    const noAt = fakeIntervalCollection({ _id: 'lastRun' });
    assert.strictEqual(await claimIntervalRun(noAt, 'lastRun', day, now), true, 'a document without a time is due');
  });

  await test('the notification cleanup goes through the claim, at start and on its timer', async () => {
    const src = read('server/models/users.js');
    const start = src.slice(src.indexOf('const startNotificationCleanup = debounce('), src.indexOf('// Repair avatar URLs'));
    assert.ok(start.includes("claimDailyJob(Users.rawDatabase(), 'notification-cleanup')"), 'claims before it runs');
    assert.ok(/Meteor\.defer\(\(\) => \{\s+runClaimed\(\)/.test(start), 'at start');
    assert.ok(/Meteor\.setInterval\(\(\) => \{\s+runClaimed\(\)[\s\S]*?\}, oneHourMs\)/.test(start), 'on the hourly timer');
    // negative: nothing in the scheduler runs the cleanup unclaimed, or on a bare 24-hour timer
    assert.ok(!/runNotificationCleanup\(\)\.catch/.test(start), 'no unclaimed run');
    assert.ok(!/oneDayMs/.test(start), 'no 24-hour timer per server');
  });

  await test('the integrity audit claims with one atomic update before it scans', async () => {
    const src = read('server/lib/fileIntegrityScan.js');
    const job = src.slice(src.indexOf('const CHECK_EVERY_MS'));
    const claim = job.indexOf("claimIntervalRun(IntegrityKeys.rawCollection(), 'lastRun', PACING.intervalMs)");
    assert.ok(claim > 0 && claim < job.indexOf('runWhenCpuLow('), 'claim, then scan');
    assert.ok(!/IntegrityKeys\.upsertAsync\(\{ _id: 'lastRun' \}/.test(src), 'the read-then-write claim is gone');
  });

  await test('negative, anywhere in the server: no other 24-hour timer re-runs a job on every server unclaimed', async () => {
    // The two jobs of this issue; a third found later belongs in the claim too.
    for (const file of ['server/models/users.js', 'server/lib/fileIntegrityScan.js']) {
      assert.ok(!/setInterval\([^]*?24 \* 60 \* 60 \* 1000\)/.test(read(file).replace(/\/\/.*$/gm, '')), file);
    }
  });

  console.log(`dailyClaim.test.cjs: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
