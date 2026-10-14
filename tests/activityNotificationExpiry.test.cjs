'use strict';

// Guard: #6768 - the activity notification recovery list drains: what can
// never be delivered is cancelled after a grace period, old notifications
// expire, and the Admin Panel has bulk actions.
// Run: node tests/activityNotificationExpiry.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const e = require('../server/lib/activityNotificationExpiry.js');
const { createActivityNotificationRecovery } = require('../server/lib/activityNotificationRecovery.js');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NOW = Date.parse('2026-10-14T12:00:00Z');
const ago = ms => ({ activity: { createdAt: new Date(NOW - ms) } });
const MIN = 60 * 1000, DAY = 24 * 60 * MIN;

function fakeIntents(rows) {
  return {
    find(selector) {
      const list = rows.filter(r => r.state === 'pending' && (!selector._id.$gt || r._id > selector._id.$gt)).sort((a, b) => (a._id < b._id ? -1 : 1));
      const cursor = { sort: () => cursor, limit: n => ({ toArray: async () => list.slice(0, n) }) };
      return cursor;
    },
  };
}

(async () => {
  let passed = 0;
  const ok = name => { passed += 1; console.log(`ok - ${name}`); };

  assert.ok(e.isTerminalRecoveryError(new Error('activity-notification-activity-unconfirmed')));
  assert.ok(e.isTerminalRecoveryError(new Error('activity-notification-recipient-denied')));
  assert.ok(!e.isTerminalRecoveryError(new Error('ECONNREFUSED')), 'negative: a network error is retried, not given up');
  assert.ok(!e.isTerminalRecoveryError(Object.assign(new Error('busy'), { code: 'sync-busy' })));
  assert.ok(e.pastGrace(ago(11 * MIN), NOW) && !e.pastGrace(ago(5 * MIN), NOW), 'an activity being written now is never given up');
  assert.ok(e.expired(ago(8 * DAY), NOW, 7) && !e.expired(ago(6 * DAY), NOW, 7));
  assert.strictEqual(e.maxAgeDays({ ACTIVITY_NOTIFICATION_MAX_AGE_DAYS: '30' }), 30);
  assert.strictEqual(e.maxAgeDays({ ACTIVITY_NOTIFICATION_MAX_AGE_DAYS: '0' }), 7, 'negative: a nonsense value keeps the default');
  ok('terminal errors, the grace period and expiry');

  const rows = [
    { _id: 'a', state: 'pending', ...ago(20 * MIN) },   // activity deleted: terminal, past grace
    { _id: 'b', state: 'pending', ...ago(2 * MIN) },    // terminal but within grace: kept
    { _id: 'c', state: 'pending', ...ago(20 * MIN) },   // transient failure: kept, retried
    { _id: 'd', state: 'pending', ...ago(10 * DAY) },   // expired: cancelled without running
    { _id: 'e', state: 'pending', ...ago(20 * MIN) },   // delivers fine
  ];
  const given = [];
  const ran = [];
  const recover = createActivityNotificationRecovery({
    intents: fakeIntents(rows), now: () => NOW,
    run: async (id) => {
      ran.push(id);
      if (id === 'a' || id === 'b') throw new Error('activity-notification-activity-unconfirmed');
      if (id === 'c') throw new Error('ECONNREFUSED');
      return 'completed';
    },
    giveUp: async (id, reason) => { given.push([id, reason]); },
  });
  const result = await recover();
  assert.deepStrictEqual(given, [['a', 'activity-notification-activity-unconfirmed'], ['d', 'expired']]);
  assert.ok(!ran.includes('d'), 'an expired one is not delivered a week late');
  assert.deepStrictEqual([result.cancelled, result.completed, result.failed], [2, 1, 2]);
  ok('the scan gives up on what can never be delivered and on expired ones, and keeps the rest');

  const legacy = createActivityNotificationRecovery({ intents: fakeIntents(rows), run: async () => { throw new Error('activity-notification-activity-unconfirmed'); } });
  assert.strictEqual((await legacy()).cancelled, 0, 'negative: without giveUp nothing is cancelled');
  ok('negative: only the wired scan cancels');

  const plans = read('server/notifications/activityPlans.js');
  assert.match(plans, /giveUp: giveUpActivityNotification,/);
  assert.match(plans, /cancelActivityNotification\(\{ intentId, expectedRevision: current\.revision, requestId: Random\.id\(32\),\s*actorId: `system:/);
  assert.match(plans, /await cleanupCancelledActivityNotifications\(intentId\);/);
  const methods = read('server/methods/activityNotificationRecovery.js');
  assert.match(methods, /async cancelActivityNotificationsOlderThan\(request\) \{\s*check\(request, \{ days: Number \}\);\s*await assertAdmin\(this\.userId\);/);
  assert.match(methods, /async retryAllActivityNotifications\(\) \{\s*await assertAdmin\(this\.userId\);/);
  assert.match(read('client/components/settings/adminProblems.js'), /id: 'cancel-old-activity-notifications'/);
  ok('the system cancels like an admin; the bulk actions are site-admin only and on the page');

  console.log(`# ${passed} passed`);
})().catch((err) => { console.error(err); process.exit(1); });
