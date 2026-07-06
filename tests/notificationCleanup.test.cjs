'use strict';

// Plain-Node unit test (no Meteor) for expiredNotificationActivityIds().
// Run: node tests/notificationCleanup.test.cjs
//
// Regression guard for #5685 ("Exception in removed observeChanges callback:
// Error: Removed nonexistent document" during notification_cleanup). The cleanup
// now computes, per user, the set of activity ids whose notifications are all
// read and past the removal age, then prunes them in a single `$pull … $in`.
// This helper is that decision: it must select fully-expired activities, skip
// unread / not-yet-aged / invalid-date / re-created ones, and de-duplicate.

const assert = require('assert');
const {
  expiredNotificationActivityIds,
} = require('../models/lib/notificationCleanup');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const NOW = new Date('2025-02-12T12:00:00Z');
const daysAgo = n => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
const REMOVE_AGE = 2; // days after "read" before a notification is removable

// --- POSITIVE: read + aged past the window is removable ---------------------
test('a read notification older than the removal age is removed', () => {
  const ids = expiredNotificationActivityIds(
    [{ activity: 'a1', read: daysAgo(3) }],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, ['a1']);
});

test('multiple expired activities are all returned, de-duplicated', () => {
  const ids = expiredNotificationActivityIds(
    [
      { activity: 'a1', read: daysAgo(5) },
      { activity: 'a2', read: daysAgo(10) },
      { activity: 'a1', read: daysAgo(4) }, // same activity, also expired
    ],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids.sort(), ['a1', 'a2']);
  // de-duplicated: 'a1' appears once
  assert.strictEqual(ids.filter(x => x === 'a1').length, 1);
});

test('exactly at the removal boundary is removable (<=)', () => {
  // read 2 days ago, removeAge 2 -> removeDate == now -> removable
  const ids = expiredNotificationActivityIds(
    [{ activity: 'edge', read: daysAgo(2) }],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, ['edge']);
});

// --- NEGATIVE: things that must NOT be removed ------------------------------
test('an unread notification (read=null) is never removed', () => {
  const ids = expiredNotificationActivityIds(
    [{ activity: 'a1', read: null }],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, []);
});

test('a read notification still within the age window is kept', () => {
  const ids = expiredNotificationActivityIds(
    [{ activity: 'a1', read: daysAgo(1) }], // 1 day < 2 day window
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, []);
});

test('#5685: an activity with a re-created unread entry is NOT removed', () => {
  // Same activity: one read+expired entry, one fresh unread entry. Pulling by
  // activity id would wrongly drop the unread one, so the activity is kept.
  const ids = expiredNotificationActivityIds(
    [
      { activity: 'a1', read: daysAgo(9) }, // old, expired
      { activity: 'a1', read: null }, // re-notified, unread
    ],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, []);
});

test('a notification with an invalid read date is not removed', () => {
  const ids = expiredNotificationActivityIds(
    [{ activity: 'a1', read: 'not-a-date' }],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, []);
});

test('entries without an activity id are ignored', () => {
  const ids = expiredNotificationActivityIds(
    [{ read: daysAgo(9) }, null, { activity: '', read: daysAgo(9) }],
    REMOVE_AGE,
    NOW,
  );
  assert.deepStrictEqual(ids, []);
});

test('non-array / empty input yields an empty list without throwing', () => {
  assert.deepStrictEqual(expiredNotificationActivityIds(undefined, REMOVE_AGE, NOW), []);
  assert.deepStrictEqual(expiredNotificationActivityIds(null, REMOVE_AGE, NOW), []);
  assert.deepStrictEqual(expiredNotificationActivityIds([], REMOVE_AGE, NOW), []);
});

test('an invalid `now` is handled defensively (no removals)', () => {
  const ids = expiredNotificationActivityIds(
    [{ activity: 'a1', read: daysAgo(9) }],
    REMOVE_AGE,
    new Date('nonsense'),
  );
  assert.deepStrictEqual(ids, []);
});

console.log(`\n${passed} tests passed`);
