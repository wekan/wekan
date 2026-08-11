'use strict';

// #6533 — FerretDB at 737% CPU and constant SQLITE_BUSY on a snap instance.
// Run: node tests/notificationCap.test.cjs
//
// The reporter's logs name the write every time:
//
//   [db-retry] the database was busy: 0 write(s) retried, 0 succeeded on a retry,
//     3 given up on.
//   ValidationError: ... [collection.go:191 sqlite.(*collection).UpdateAll]
//     database is locked (5) (SQLITE_BUSY)
//     at _helpersConstructor.addNotification (models/users.js:2248)
//
// addNotification is `$addToSet` on `profile.notifications` — an array INSIDE the
// user document. Adding one means reading the whole document, scanning the array
// for a duplicate and writing the whole document back, so the cost grows with the
// array. FerretDB on SQLite has a single writer, so those rewrites queue behind
// each other, start failing with SQLITE_BUSY, and login — which also writes to the
// user document — queues behind them. That is the slow login and the pinned CPU.
//
// WHY THE ARRAY GROWS FOREVER: the existing cleanup (#5685) only removes
// notifications that have been READ and are past their removal age. A user who
// never clears their tray accumulates entries with no upper bound at all, and
// nothing in the product ever shrinks it.
//
// So the cleanup now also CAPS the array. This suite pins the cap's decisions,
// which is where the judgement is: what to keep, what never to touch, and that a
// user needing no change is not written to at all.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const {
  cappedNotifications,
  notificationCapFromEnv,
  expiredNotificationActivityIds,
} = require(path.join(repoRoot, 'models/lib/notificationCleanup.js'));
const serverSrc = fs.readFileSync(
  path.join(repoRoot, 'server/models/users.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const notif = (n, read = null) => ({ activity: `a${n}`, read });

test('an array under the cap is left completely alone', () => {
  const list = [notif(1), notif(2), notif(3)];
  assert.strictEqual(cappedNotifications(list, 10), null,
    'null means "nothing to do" - the caller must then skip the write entirely, ' +
    'because rewriting the array with itself is exactly the write this is about');
  assert.strictEqual(cappedNotifications(list, 3), null, 'exactly at the cap is not over it');
});

test('an oversized array keeps the NEWEST entries', () => {
  const list = [notif(1), notif(2), notif(3), notif(4), notif(5)];
  const kept = cappedNotifications(list, 2);
  assert.deepStrictEqual(kept.map(n => n.activity), ['a4', 'a5'],
    '$addToSet appends, so the tail is the newest - and an unread notification ' +
    'from long ago is not something anyone is going to act on');
  assert.strictEqual(kept.length, 2);
});

test('unread entries are capped too - that is the whole point', () => {
  // The existing rule cannot touch these: it only removes READ ones.
  const unread = Array.from({ length: 50 }, (_, i) => notif(i));
  assert.deepStrictEqual(expiredNotificationActivityIds(unread, 2, new Date()), [],
    'confirming the existing rule leaves every unread entry in place');
  const kept = cappedNotifications(unread, 10);
  assert.strictEqual(kept.length, 10, 'so the cap has to be what bounds them');
});

test('junk input never produces a write', () => {
  for (const bad of [null, undefined, 'nope', 42, {}]) {
    assert.strictEqual(cappedNotifications(bad, 10), null,
      `${JSON.stringify(bad)} must be left alone rather than turned into an array`);
  }
  assert.strictEqual(cappedNotifications([notif(1), notif(2)], 0), null,
    'a cap of 0 disables capping instead of deleting everything');
  assert.strictEqual(cappedNotifications([notif(1), notif(2)], -5), null,
    'and so does a negative one');
});

test('the default cap is generous, and configurable', () => {
  assert.strictEqual(notificationCapFromEnv({}), 1000,
    'this is a backstop against unbounded growth, not a retention policy');
  assert.strictEqual(notificationCapFromEnv({ NOTIFICATION_TRAY_MAX_PER_USER: '50' }), 50);
  for (const bad of ['', 'abc', '0', '-1', undefined]) {
    assert.strictEqual(notificationCapFromEnv({ NOTIFICATION_TRAY_MAX_PER_USER: bad }), 1000,
      `a nonsense setting (${JSON.stringify(bad)}) must fall back to the default, ` +
      'not disable the backstop');
  }
});

// ── how the cleanup uses it ─────────────────────────────────────────────────

test('the cap is applied to what is left AFTER the expiry pull', () => {
  assert.ok(/const remaining = activityIds\.length/.test(serverSrc),
    'capping the array before the $pull would trim entries that were about to be ' +
    'removed anyway, and keep fewer than the cap');
  assert.ok(/cappedNotifications\(remaining, maxPerUser\)/.test(serverSrc));
});

test('a user who needs neither is not written to', () => {
  assert.ok(/if \(activityIds\.length === 0 && kept === null\) continue;/.test(serverSrc),
    'the whole problem is writes to the user document; the cleanup must not add ' +
    'one per user per day for users with nothing to change');
});

test('it stays ONE write per user', () => {
  const at = serverSrc.indexOf('const maxPerUser = notificationCapFromEnv');
  const body = serverSrc.slice(at, serverSrc.indexOf('const startNotificationCleanup', at));
  const updates = (body.match(/await Users\.updateAsync\(/g) || []).length;
  assert.strictEqual(updates, 1,
    '#5685 collapsed K writes per user into one; the cap must not undo that by ' +
    'adding a second update alongside the $pull');
  assert.ok(/\$set: \{ 'profile\.notifications': kept \}/.test(body),
    'the capped case replaces the array outright - a $pull would have to list the ' +
    'entries it removes, and there being too many of them is the problem');
});

console.log(`\n${passed} passed`);
