'use strict';

// GitHub #3678 ("Add possibility to log-out inactive users" -> visibility half)
// and #3734 ("active users api or logs = presence"). Both ask the same
// question: which users are actively using WeKan, and for how long. This pins
// the pure arithmetic in models/lib/lastActive.js - the recency window that
// decides whether Admin Panel > People shows a user as "online now" - plus the
// shape of the two hooks that keep the timestamp current
// (server/lastActiveOnLogin.js, server/methods/lastActiveHeartbeat.js).
//
// Run: node tests/lastActive.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { ONLINE_THRESHOLD_MS, isRecentlyActive } = require('../models/lib/lastActive.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test('missing lastActiveAt is never online', () => {
  assert.strictEqual(isRecentlyActive(undefined), false);
  assert.strictEqual(isRecentlyActive(null), false);
  assert.strictEqual(isRecentlyActive(''), false);
});

test('a timestamp inside the threshold is online', () => {
  const now = new Date('2026-09-10T12:00:00Z');
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  assert.strictEqual(isRecentlyActive(oneMinuteAgo, now), true);
  assert.strictEqual(isRecentlyActive(oneMinuteAgo.toISOString(), now), true);
});

test('a timestamp right at the threshold is still online, past it is not', () => {
  const now = new Date('2026-09-10T12:00:00Z');
  const atThreshold = new Date(now.getTime() - ONLINE_THRESHOLD_MS);
  const pastThreshold = new Date(now.getTime() - ONLINE_THRESHOLD_MS - 1);
  assert.strictEqual(isRecentlyActive(atThreshold, now), true);
  assert.strictEqual(isRecentlyActive(pastThreshold, now), false);
});

test('a custom threshold is honoured', () => {
  const now = new Date('2026-09-10T12:00:00Z');
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  assert.strictEqual(isRecentlyActive(tenMinutesAgo, now, 5 * 60 * 1000), false);
  assert.strictEqual(isRecentlyActive(tenMinutesAgo, now, 15 * 60 * 1000), true);
});

// Negative test: a clock skew that puts "last active" in the FUTURE must never
// read as online - that would be a clock/writer bug, not presence.
test('a timestamp in the future is not treated as online', () => {
  const now = new Date('2026-09-10T12:00:00Z');
  const future = new Date(now.getTime() + 60 * 1000);
  assert.strictEqual(isRecentlyActive(future, now), false);
});

// Negative test: an invalid date string must not throw and must not be online.
test('an unparsable value is not online and does not throw', () => {
  assert.doesNotThrow(() => isRecentlyActive('not-a-date'));
  assert.strictEqual(isRecentlyActive('not-a-date'), false);
});

// The login hook: pin its shape (fire-and-forget, guarded, writes
// lastConnectionDate on Accounts.onLogin) so the mechanism described in
// models/lib/lastActive.js's header comment stays true. A regression here -
// e.g. the update call no longer wrapped, or the field renamed without
// updating the reader in peopleBody.js - is exactly the kind of drift that
// silently breaks presence again the way the old commented-out
// server/publications/users.js block did.
test('the login hook writes lastConnectionDate via Accounts.onLogin, guarded', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'lastActiveOnLogin.js'), 'utf8');
  assert.ok(/Accounts\.onLogin/.test(src), 'must hook Accounts.onLogin');
  assert.ok(/lastConnectionDate/.test(src), 'must write lastConnectionDate');
  assert.ok(/\.catch\(/.test(src), 'must not let a write failure escape the hook');
});

// The heartbeat method: only ever updates the CALLER's own document, never an
// arbitrary userId taken from the client - the same shape as every other
// self-service Meteor method in this app.
test('the heartbeat method updates only this.userId, never a client-supplied id', () => {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'server', 'methods', 'lastActiveHeartbeat.js'), 'utf8');
  assert.ok(/this\.userId/.test(src));
  assert.ok(/lastConnectionDate/.test(src));
  // The method must take no client-supplied arguments (its signature is
  // `async usersHeartbeat()`), so the ONLY id it can ever update is its own
  // this.userId - there is no other id in scope to update with.
  assert.ok(/async\s+usersHeartbeat\s*\(\s*\)/.test(src),
    'usersHeartbeat must take no arguments, so it can only ever update this.userId');
  assert.ok(/updateAsync\(\s*userId\s*,/.test(src));
});

// New i18n keys exist in English and are real translations (not merely copied)
// in a representative sample of locales, and every locale file that has the
// key at all has BOTH of them (a partial add is worse than none).
test('the new People-page i18n keys exist and stay in step across locales', () => {
  const dataDir = path.join(__dirname, '..', 'imports', 'i18n', 'data');
  const en = JSON.parse(fs.readFileSync(path.join(dataDir, 'en.i18n.json'), 'utf8'));
  assert.strictEqual(en['admin-people-last-active'], 'Last active');
  assert.strictEqual(en['admin-people-currently-online'], 'Online now');

  const sample = ['fi.i18n.json', 'de.i18n.json', 'fr.i18n.json', 'ja.i18n.json', 'ar.i18n.json'];
  sample.forEach((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    assert.ok(data['admin-people-last-active'], `${file} missing admin-people-last-active`);
    assert.ok(data['admin-people-currently-online'], `${file} missing admin-people-currently-online`);
    assert.notStrictEqual(data['admin-people-last-active'], en['admin-people-last-active'],
      `${file} should have a real translation, not the English source`);
  });

  fs.readdirSync(dataDir).filter((f) => f.endsWith('.i18n.json')).forEach((file) => {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const hasLast = Object.prototype.hasOwnProperty.call(data, 'admin-people-last-active');
    const hasOnline = Object.prototype.hasOwnProperty.call(data, 'admin-people-currently-online');
    assert.strictEqual(hasLast, hasOnline, `${file} has one of the two new keys but not the other`);
  });
});

console.log(`\n${passed} passed`);
