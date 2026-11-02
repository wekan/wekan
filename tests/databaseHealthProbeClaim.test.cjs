'use strict';

// With several WeKan servers on one database every server ran the database
// health probe and recorded every finding itself: one collection scan in the
// MongoDB log became 24 identical rows in Admin Panel / Problems on a
// Kubernetes Deployment of 24 replicas. One server probes per period now
// (claimProbe, models/lib/databaseHealth.js), and the state that compares one
// probe with the next is shared, so the next probe - on any server - does not
// report the same log lines again.
// Run: node tests/databaseHealthProbeClaim.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const h = require('../models/lib/databaseHealth.js');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

// The findOneAndUpdate the driver does: match -> update and return the old
// document; no match + upsert -> insert, which fails with 11000 when the _id
// exists (another server holds the period).
function fakeColl() {
  const docs = new Map();
  const match = (doc, f) => {
    if (f._id !== undefined && (!doc || doc._id !== f._id)) return false;
    if (!f.$or) return true;
    return f.$or.some(c => ('claimedMs' in c) && (c.claimedMs.$exists === false
      ? doc.claimedMs === undefined : doc.claimedMs !== undefined && doc.claimedMs < c.claimedMs.$lt));
  };
  return {
    docs,
    async findOneAndUpdate(filter, update, opts) {
      await null;   // let concurrent callers interleave like real round trips
      const doc = docs.get(filter._id);
      if (doc && match(doc, filter)) {
        const before = JSON.parse(JSON.stringify(doc));
        Object.assign(doc, update.$set);
        return before;
      }
      if (!opts.upsert) return null;
      if (doc) throw Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
      docs.set(filter._id, { _id: filter._id, ...update.$set });
      return null;
    },
    async updateOne(filter, update) { Object.assign(docs.get(filter._id), update.$set); },
  };
}

const PERIOD = 5 * 60 * 1000;

(async () => {
  await test('24 servers probing at the same moment: exactly one probes', async () => {
    const coll = fakeColl();
    const now = Date.now();
    const results = await Promise.all(Array.from({ length: 24 }, () => h.claimProbe(coll, now, PERIOD)));
    assert.strictEqual(results.filter(r => r.claimed).length, 1);
    assert.deepStrictEqual(results.find(r => r.claimed).shared, {}, 'the very first probe starts with no shared state');
  });

  await test('the next period is claimed by whichever server comes first, with the state the last probe left', async () => {
    const coll = fakeColl();
    const t0 = Date.now();
    await h.claimProbe(coll, t0, PERIOD);
    await coll.updateOne({ _id: h.PROBE_CLAIM_ID }, { $set: h.sharedState({ logSeenMs: 1234, restarts: 2, networkFsReported: true }) });
    assert.strictEqual((await h.claimProbe(coll, t0 + 60 * 1000, PERIOD)).claimed, false, 'a minute later: still claimed');
    const next = await h.claimProbe(coll, t0 + PERIOD, PERIOD);
    assert.strictEqual(next.claimed, true);
    assert.strictEqual(next.shared.logSeenMs, 1234, 'continues after the log lines already reported');
    assert.strictEqual(next.shared.restarts, 2);
  });

  await test('a slow-query line is reported once, by one server, not once per server', async () => {
    const coll = fakeColl();
    const line = at => JSON.stringify({ t: { $date: new Date(at).toISOString() }, msg: 'Slow query', attr: {
      ns: 'wekan.lists', planSummary: 'COLLSCAN', docsExamined: 115528, durationMillis: 150,
      command: { find: 'lists', filter: { archived: false, 'syncSource.type': { $exists: true } } } } });
    const t0 = Date.parse('2026-11-02T09:30:00Z');
    const log = [line(t0 + 1000)];
    let rows = 0;
    const probe = async (now, localSeen) => {
      const { claimed, shared } = await h.claimProbe(coll, now, PERIOD);
      if (!claimed) return;
      const seen = shared.logSeenMs !== undefined ? shared.logSeenMs : localSeen;
      const { groups, newestMs } = h.collectionScans(log, seen);
      rows += groups.length;
      await coll.updateOne({ _id: h.PROBE_CLAIM_ID }, { $set: { logSeenMs: newestMs } });
    };
    await Promise.all(Array.from({ length: 24 }, () => probe(t0 + 2000, t0)));
    await probe(t0 + PERIOD + 2000, t0);   // another server, next period, same log
    assert.strictEqual(rows, 1);
  });

  await test('negative: any other database error is not swallowed by the claim', async () => {
    const coll = { findOneAndUpdate: async () => { throw Object.assign(new Error('down'), { code: 6 }); } };
    await assert.rejects(() => h.claimProbe(coll, Date.now(), PERIOD), /down/);
  });

  await test('an older driver result ({ value }) is read too', async () => {
    const coll = { findOneAndUpdate: async () => ({ ok: 1, value: { _id: h.PROBE_CLAIM_ID, logSeenMs: 7 } }) };
    assert.strictEqual((await h.claimProbe(coll, Date.now(), PERIOD)).shared.logSeenMs, 7);
  });

  await test('only state about the database is shared; what is local to a server is not', async () => {
    assert.deepStrictEqual(Object.keys(h.sharedState({ logSeenMs: 1, scanned: { value: 2 }, uptime: 3, restarts: 0,
      opLatencies: {}, networkFsReported: true })).sort(), ['logSeenMs', 'opLatencies', 'restarts', 'scanned', 'uptime']);
  });

  await test('the probe claims the period before it reads the database, and saves the shared state after', async () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server/lib/databaseHealth.js'), 'utf8');
    const fn = src.slice(src.indexOf('export async function probeDatabaseHealth'));
    const claim = fn.indexOf('health.claimProbe(');
    assert.ok(claim > 0 && claim < fn.indexOf('serverStatus(db)') && claim < fn.indexOf('globalLog(db)'));
    assert.ok(/if \(!claimed\) \{\n\s+checkDataDirectory\(dbPath\);\n\s+return;/.test(fn), 'a server without the claim checks only its own data directory');
    assert.ok(fn.indexOf('health.sharedState(state)') > fn.indexOf('globalLog(db)'));
  });

  await test('negative: a claim that cannot be made does not stop the probe', async () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server/lib/databaseHealth.js'), 'utf8');
    const fn = src.slice(src.indexOf('export async function probeDatabaseHealth'));
    assert.ok(/\.catch\(\(\) => \(\{ claimed: true, shared: \{\} \}\)\)/.test(fn), 'a refused claim probes for itself, as before');
    assert.ok(!/\.catch\(\(\) => \(\{ claimed: false/.test(fn), 'no database error silently turns probing off');
  });

  console.log(`databaseHealthProbeClaim.test.cjs: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
