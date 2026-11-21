'use strict';

// packages/wekan-accounts-lockout/src/lockoutSettings.js: one way to read and
// check a lockout counter's settings, for known and unknown users alike.
//
// Both counters used to apply Meteor.settings['accounts-lockout'] with
// `settings.forEach(function ({ key, value }) { this.settings[key] = value; })`.
// The README documents that setting as an object, which has no forEach, so
// startup() threw before it hooked into Accounts and the brute-force lockout
// was never installed - with no error anyone was waiting for, because nothing
// awaits startup().
//
// Run: node tests/lockoutSettings.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'packages/wekan-accounts-lockout/src');
const { validateLockoutSettings, mergeLockoutSettings, lockoutSettingsOverride } = require(path.join(SRC, 'lockoutSettings.js'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const configured = { failuresBeforeLockout: 3, lockoutPeriod: 60, failureWindow: 15 };

test("the README's Meteor.settings object overrides the configured values", () => {
  const meteorSettings = { 'accounts-lockout': { knownUsers: { failuresBeforeLockout: 5, lockoutPeriod: 120, failureWindow: 10 } } };
  const merged = mergeLockoutSettings(configured, lockoutSettingsOverride(meteorSettings, 'knownUsers'));
  assert.deepEqual(merged, { failuresBeforeLockout: 5, lockoutPeriod: 120, failureWindow: 10 });
  assert.deepEqual(configured, { failuresBeforeLockout: 3, lockoutPeriod: 60, failureWindow: 15 }, 'the configured object is not changed');
  assert.equal(validateLockoutSettings(merged), merged);
});

test('a partial override keeps the rest of the configured values', () => {
  assert.deepEqual(mergeLockoutSettings(configured, { lockoutPeriod: 300 }),
    { failuresBeforeLockout: 3, lockoutPeriod: 300, failureWindow: 15 });
});

test('no override, or one that is not an object, leaves the configured values', () => {
  for (const meteorSettings of [{}, undefined, { 'accounts-lockout': {} }]) {
    assert.equal(mergeLockoutSettings(configured, lockoutSettingsOverride(meteorSettings, 'unknownUsers')), configured);
  }
  for (const override of [false, null, 'x', 7, [{ key: 'lockoutPeriod', value: 1 }]]) {
    assert.equal(mergeLockoutSettings(configured, override), configured, JSON.stringify(override));
  }
});

test('negative: a setting that is not a positive number is refused', () => {
  for (const key of ['failuresBeforeLockout', 'lockoutPeriod', 'failureWindow']) {
    for (const bad of [0, -1, undefined, null]) {
      assert.throws(() => validateLockoutSettings({ ...configured, [key]: bad }), new RegExp(`"${key}" is not positive integer`));
    }
  }
});

test('both counters use the shared functions, and neither has its own copy', () => {
  for (const [file, kind] of [['knownUser.js', 'knownUsers'], ['unknownUser.js', 'unknownUsers']]) {
    const src = fs.readFileSync(path.join(SRC, file), 'utf8');
    assert.match(src, /require\('\.\/lockoutSettings'\)/, file);
    assert.match(src, /this\.settings = validateLockoutSettings\(mergeLockoutSettings\(this\.settings, \w+\.\w+\(\)\)\);/, file);
    assert.match(src, new RegExp(`return lockoutSettingsOverride\\(Meteor\\.settings, '${kind}'\\);`), file);
    // Negative: the shape that never worked, and a hand-written check beside the shared one.
    assert.doesNotMatch(src, /\.forEach\(function/, `${file}: a function callback has no this`);
    assert.doesNotMatch(src, /is not positive integer/, `${file}: the check is the shared one`);
  }
});

console.log(`\nlockoutSettings: ${passed} tests passed`);
