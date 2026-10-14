'use strict';

// wekan/wekan#2141: "Change notification frequency setting by user / member
// of the board" - Trello's Send Emails: Never, Periodically (about once an
// hour), Instantly. All three are a member's own choice in WeKan:
//
//   Never         Notification Settings -> email off for the member
//                 (models/lib/notificationSettings.js, bde66a5c7d)
//   Periodically  Member Settings -> delivery schedule "interval", every
//                 5 minutes to 24 hours, 60 minutes among them
//   Instantly     schedule "immediate"
//                 (models/lib/notificationDelivery.js, ab785acd1e)
//
// plus "daily" and quiet hours. A member's choice wins over the board's and
// the Admin Panel's. This pins each option at member level.
// Run: node tests/notificationFrequency2141.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { resolveNotificationSetting } = require(path.join(ROOT, 'models/lib/notificationSettings.js'));
const delivery = require(path.join(ROOT, 'models/lib/notificationDelivery.js'));
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('Never: a member turns email off even when the board and the admin have it on', () => {
  assert.equal(resolveNotificationSetting('email', { adminDefault: true, boardOverride: true, memberOverride: false }), false);
  // And back on, against an admin who turned it off.
  assert.equal(resolveNotificationSetting('email', { adminDefault: false, memberOverride: true }), true);
  // Negative: no choice at all is the old behaviour, email on.
  assert.equal(resolveNotificationSetting('email', {}), true);
});

test('Periodically: a member gets email about once an hour, whatever the board says', () => {
  assert.ok(delivery.SCHEDULES.includes('interval'));
  assert.ok(delivery.INTERVAL_MINUTES.includes(60));
  const resolved = delivery.resolveChannelSettings('email', [
    ['member', { schedule: 'interval', intervalMinutes: 60 }],
    ['board', { schedule: 'immediate' }],
    ['admin', { schedule: 'daily' }],
  ]);
  assert.equal(resolved.schedule, 'interval');
  assert.equal(resolved.intervalMinutes, 60);
  assert.equal(resolved.from.schedule, 'member');
  const created = new Date('2026-10-14T10:17:00Z');
  const at = delivery.nextDeliveryAt(created, resolved);
  assert.ok(at > created && at - created <= 60 * 60 * 1000, `sent within the hour, at ${at.toISOString()}`);
});

test('Instantly: no wait at all', () => {
  const resolved = delivery.resolveChannelSettings('email', [['member', { schedule: 'immediate' }], ['admin', { schedule: 'daily' }]]);
  assert.equal(resolved.schedule, 'immediate');
  const created = new Date('2026-10-14T10:17:00Z');
  assert.equal(delivery.nextDeliveryAt(created, resolved).getTime(), created.getTime());
});

test('negative: a member value that is not an offered frequency is ignored, not trusted', () => {
  const resolved = delivery.resolveChannelSettings('email', [
    ['member', { schedule: 'weekly', intervalMinutes: 7 }],
    ['board', { schedule: 'interval', intervalMinutes: 60 }],
  ]);
  assert.equal(resolved.schedule, 'interval', 'an unknown schedule falls through to the board');
  assert.equal(resolved.from.schedule, 'board');
  assert.equal(resolved.intervalMinutes, 60);
});

test('the member sees all of them: the on/off switch and the schedule picker', () => {
  const popup = read('client/components/settings/notificationSettingsPopup.jade');
  assert.match(popup, /a\.flex\.js-notify-option\(data-service="\{\{service\}\}" data-value="false"\)/, 'an Off choice per service');
  const settings = read('client/components/settings/notificationDeliverySettings.jade');
  assert.match(settings, /select\.js-delivery-select\(data-key="schedule"\)/);
  assert.match(settings, /select\.js-delivery-select\(data-key="intervalMinutes"\)/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const s of delivery.SCHEDULES) assert.ok(en[`notification-delivery-schedule-${s}`], s);
});
