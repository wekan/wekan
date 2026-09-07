'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/adminLockout.js');
const methods = read('server/methods/lockedUsers.js');
const settingsMethods = read('server/methods/lockoutSettings.js');
const client = read('client/components/settings/lockedUsersBody.js');
const jade = read('client/components/settings/peopleBody.jade');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const publication = read('server/publications/lockoutSettings.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeopleLockedUsers:');

test('one Global Admin boundary owns both views and every mutation', () => {
  assert.ok(/async function requireSiteAdmin[\s\S]*actor\?\.isAdmin === true/.test(service));
  assert.ok(/bleed: 'JamBleed'/.test(service));
  for (const name of ['lockoutPageForAdmin', 'unlockUserForAdmin',
    'unlockAllUsersForAdmin']) assert.ok(methods.includes(name) || pages.includes(name));
  assert.ok(settingsMethods.includes('saveLockoutSettingsForAdmin'));
  assert.ok(route.includes('saveLockoutSettingsForAdmin'));
  assert.ok(!/LockoutSettings\.update\(/.test(client));
  assert.ok(/user\?\.isAdmin === true \? LockoutSettings\.find\(\) : \[\]/.test(publication));
});

test('settings use a closed integer schema and activate atomically', () => {
  for (const field of ['knownFailuresBeforeLockout', 'knownLockoutPeriod',
    'knownFailureWindow', 'unknownFailuresBeforeLockout',
    'unknownLockoutPeriod', 'unknownFailureWindow']) assert.ok(service.includes(field));
  assert.ok(/Object\.keys\(input\)\.some\(field => !LOCKOUT_FIELDS\[field\]\)/.test(service));
  assert.ok(/Number\.isSafeInteger/.test(service));
  assert.ok(/await applyAccountsLockoutConfiguration\(\)/.test(service));
});

test('modern and HTML4 views retain settings, locked rows and confirmed unlocks', () => {
  for (const key of ['accounts-lockout-locked-users', 'accounts-lockout-failed-attempts',
    'accounts-lockout-remaining-time', 'accounts-lockout-click-to-unlock']) {
    assert.ok(jade.includes(key), `Jade misses ${key}`);
    assert.ok(pages.includes(key), `HTML4 misses ${key}`);
  }
  for (const operation of ['save-lockout-settings', 'request-unlock-user',
    'unlock-user', 'request-unlock-all', 'unlock-all-users']) {
    assert.ok(route.includes(operation) || pages.includes(operation), `missing ${operation}`);
  }
  assert.ok(/path !== '\/admin\/people\/locked-users'/.test(pages));
  assert.ok(/adminPeopleLockedUsersPage[\s\S]*adminPeopleBaselinePage/.test(pages));
});

console.log(`\nlegacyHtml4AdminPeopleLockedUsers: ${passed} tests passed`);
