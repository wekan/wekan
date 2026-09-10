'use strict';

// Regression coverage for the 3-tier Notification Settings resolution
// (models/lib/notificationSettings.js), added as part of "Add big popup of
// Notification Settings as menu option to Member Settings, Board Settings
// and Admin Panel / People".
//
// Precedence, highest wins: member override > board override > admin
// default > hardcoded fallback (true) - the same shape as the admin-default
// -> board-override -> member-override "theme override" pattern used
// elsewhere in WeKan.
//
// Run: node tests/notificationSettingsResolution.test.cjs

const assert = require('assert');
const {
  resolveNotificationSetting,
  HARDCODED_FALLBACK,
  NOTIFICATION_SERVICES,
} = require('../models/lib/notificationSettings.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('notificationSettingsResolution:');

test('catalog has exactly tray and email, matching the registered services', () => {
  assert.deepStrictEqual(Object.keys(NOTIFICATION_SERVICES).sort(), [
    'email',
    'tray',
  ]);
  assert.strictEqual(NOTIFICATION_SERVICES.tray, 'profile');
  assert.strictEqual(NOTIFICATION_SERVICES.email, 'email');
});

test('nothing configured anywhere falls back to the hardcoded default (true)', () => {
  assert.strictEqual(
    resolveNotificationSetting('tray', {}),
    HARDCODED_FALLBACK,
  );
  assert.strictEqual(
    resolveNotificationSetting('email', {
      adminDefault: undefined,
      boardOverride: undefined,
      memberOverride: undefined,
    }),
    HARDCODED_FALLBACK,
  );
});

test('null is treated the same as undefined at every level', () => {
  assert.strictEqual(
    resolveNotificationSetting('tray', {
      adminDefault: null,
      boardOverride: null,
      memberOverride: null,
    }),
    HARDCODED_FALLBACK,
  );
});

test('admin default alone decides when board and member are unset', () => {
  assert.strictEqual(
    resolveNotificationSetting('tray', { adminDefault: false }),
    false,
  );
  assert.strictEqual(
    resolveNotificationSetting('tray', { adminDefault: true }),
    true,
  );
});

test('board override wins over the admin default', () => {
  assert.strictEqual(
    resolveNotificationSetting('email', {
      adminDefault: true,
      boardOverride: false,
    }),
    false,
  );
  assert.strictEqual(
    resolveNotificationSetting('email', {
      adminDefault: false,
      boardOverride: true,
    }),
    true,
  );
});

test('member override wins over both the board override and the admin default', () => {
  assert.strictEqual(
    resolveNotificationSetting('tray', {
      adminDefault: true,
      boardOverride: true,
      memberOverride: false,
    }),
    false,
  );
  assert.strictEqual(
    resolveNotificationSetting('tray', {
      adminDefault: false,
      boardOverride: false,
      memberOverride: true,
    }),
    true,
  );
});

test('an explicit false at a lower level is not treated as "unset"', () => {
  // admin explicitly disabled, board says nothing -> stays disabled
  assert.strictEqual(
    resolveNotificationSetting('email', {
      adminDefault: false,
      boardOverride: undefined,
      memberOverride: undefined,
    }),
    false,
  );
});

test('tray and email resolve independently of each other', () => {
  const trayEnabled = resolveNotificationSetting('tray', {
    adminDefault: true,
    boardOverride: undefined,
    memberOverride: false,
  });
  const emailEnabled = resolveNotificationSetting('email', {
    adminDefault: true,
    boardOverride: undefined,
    memberOverride: undefined,
  });
  assert.strictEqual(trayEnabled, false);
  assert.strictEqual(emailEnabled, true);
});

console.log(`notificationSettingsResolution: ${passed} passed`);
