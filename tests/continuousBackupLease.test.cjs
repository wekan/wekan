'use strict';

// #6861, item 3: with several WeKan servers on one database exactly ONE streams the continuous
// backup, and another takes over when it stops. Run: node tests/continuousBackupLease.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { LEASE_ID, RENEW_MS, TTL_MS, acquireLease, releaseLease, takeoverLease } = require('../models/lib/backupLease');

// A collection with the atomic semantics the lease relies on: every call is ONE step, and an insert
// of an existing _id is a duplicate key. (Each method runs to completion before the next starts, as
// a database's single-document operations do.)
function fakeCollection() {
  const docs = new Map();
  const matches = (doc, filter, now) => Object.entries(filter).every(([key, want]) => {
    if (key === '$or') return want.some(branch => matches(doc, branch, now));
    const have = doc[key];
    if (want && typeof want === 'object' && !(want instanceof Date)) {
      if ('$lte' in want) return have instanceof Date && have <= want.$lte;
      return false;
    }
    if (want === null) return have === null || have === undefined;
    return have === want;
  });
  return {
    docs,
    async insertOne(doc) {
      await Promise.resolve();
      if (docs.has(doc._id)) throw Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
      docs.set(doc._id, { ...doc });
      return { insertedId: doc._id };
    },
    async updateOne(filter, update) {
      await Promise.resolve();
      const doc = docs.get(filter._id);
      if (!doc || !matches(doc, filter)) return { matchedCount: 0, modifiedCount: 0 };
      Object.assign(doc, update.$set);
      return { matchedCount: 1, modifiedCount: 1 };
    },
  };
}

const at = ms => new Date(1700000000000 + ms);

test('24 servers acquiring at once: exactly one leads', async () => {
  const c = fakeCollection();
  const results = await Promise.all(Array.from({ length: 24 }, (_, i) => acquireLease(c, `server-${i}`, at(0))));
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(c.docs.size, 1, 'one lease document');
});

test('the leader renews, and the others stay out while the lease is alive', async () => {
  const c = fakeCollection();
  assert.equal(await acquireLease(c, 'a', at(0)), true);
  assert.equal(await acquireLease(c, 'b', at(RENEW_MS)), false, 'b cannot take a live lease');
  assert.equal(await acquireLease(c, 'a', at(RENEW_MS)), true, 'a renews');
  assert.equal(c.docs.get(LEASE_ID).expiresAt.getTime(), at(RENEW_MS).getTime() + TTL_MS, 'and the expiry moves');
  assert.equal(await acquireLease(c, 'b', at(2 * RENEW_MS)), false, 'still a\'s after the renewal');
});

test('failover: a leader that stops renewing is replaced once its lease has expired', async () => {
  const c = fakeCollection();
  await acquireLease(c, 'a', at(0));
  assert.equal(await acquireLease(c, 'b', at(TTL_MS - 1)), false, 'one millisecond before it lapses');
  assert.equal(await acquireLease(c, 'b', at(TTL_MS)), true, 'when it lapses b leads');
  assert.equal(await acquireLease(c, 'a', at(TTL_MS + 1)), false, 'and the old leader finds it lost it');
});

test('release lets the next server lead at once; only the holder can release', async () => {
  const c = fakeCollection();
  await acquireLease(c, 'a', at(0));
  await releaseLease(c, 'b');
  assert.equal(await acquireLease(c, 'c', at(1)), false, 'b was not the holder, so nothing was released');
  await releaseLease(c, 'a');
  assert.equal(await acquireLease(c, 'c', at(1)), true, 'a released');
});

test('takeover: a restore becomes the only writer, and the former leader loses the lease', async () => {
  const c = fakeCollection();
  await acquireLease(c, 'leader', at(0));
  const { waitMs } = await takeoverLease(c, 'restorer', at(5));
  assert.equal(waitMs, RENEW_MS, 'it waits one renewal so the former leader has stopped');
  assert.equal(await acquireLease(c, 'leader', at(RENEW_MS)), false, 'the former leader cannot renew');
  assert.equal(await acquireLease(c, 'restorer', at(RENEW_MS)), true);
  assert.equal((await takeoverLease(fakeCollection(), 'first', at(0))).waitMs, 0, 'with nobody to wait for there is no wait');
});

test('other database errors are not swallowed (negative)', async () => {
  const broken = { async insertOne() { throw new Error('connection lost'); }, async updateOne() { return {}; } };
  await assert.rejects(() => acquireLease(broken, 'a', at(0)), /connection lost/);
  await assert.rejects(() => takeoverLease(broken, 'a', at(0)), /connection lost/);
});

test('negative: the lease never upserts (an unmatched upsert must insert, and what then happens is the database\'s)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'models/lib/backupLease.js'), 'utf8');
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /upsert/);
});

test('continuousBackup.js runs the stream through the lease, on every path', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server/continuousBackup.js'), 'utf8');
  // the only direct apply() is inside the leader loop, after acquireLease said this server leads
  const applies = src.split('\n').filter(l => /backupManager\(\)\.apply\(/.test(l));
  assert.equal(applies.length, 1, 'one apply(), in evaluateLease');
  assert.match(src, /leading = await acquireLease\(leaseCollection\(\), serverId\);\s*\n\s*if \(!leading\) \{[^}]*backupManager\(\)\.stop\(\)/);
  assert.match(src, /async function evaluateLease\(\) \{\s*\n\s*if \(restoring\) return;/);
  // startup and saveSettings converge through the loop; restore and fetchFromCloud take the lease first
  assert.match(src, /Meteor\.startup\(async \(\) => \{\s*try \{\s*await evaluateLease\(\);\s*startLeaseLoop\(\);/);
  assert.match(src, /await evaluateLease\(\);\s*\n\s*return \{ \.\.\.backupManager\(\)\.status\(\), leading \};/);
  assert.equal((src.match(/await becomeOnlyWriter\(\);/g) || []).length, 2, 'restore and fetchFromCloud');
  assert.match(src, /const wasLeader = leading;[\s\S]*if \(!wasLeader\) await new Promise/);
  // a settings change another server saved is followed by the leader
  assert.match(src, /stamp !== appliedStamp/);
});
