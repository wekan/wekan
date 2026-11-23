'use strict';

// The increasing delay after a wrong password, per user and source address,
// is APPLIED - it was never applied.
//
// lockoutDecision.js waits loginDelayBase seconds after the first wrong
// password, doubling up to loginDelayMax, and refuses an attempt that comes
// sooner without counting it. Both places that start the lockout - the
// server's startup and the Admin Panel's reload - built its settings from
// failuresBeforeLockout, lockoutPeriod and failureWindow only, so the base
// reached the decision as undefined, which is "delays off": a guesser could
// try as fast as the network allowed until the lockout itself. The settings
// are read from one list now, models/lib/lockoutConfig.js.
// Run: node tests/lockoutDelayApplied.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { lockoutConfigs, settingValue, KNOWN_DEFAULTS } = require('../models/lib/lockoutConfig');
const { decideKnownUserAttempt } = require('../packages/wekan-accounts-lockout/src/lockoutDecision');
const { validateLockoutSettings, mergeLockoutSettings } = require('../packages/wekan-accounts-lockout/src/lockoutSettings');

const fresh = { failedAttempts: 0, firstFailedAttempt: 0, lastFailedAttempt: 0, unlockTime: 0, nextAttemptAt: 0 };

// Two wrong passwords from one address, the second one 100 ms after the first.
function twoQuickFailures(settings) {
  const t0 = 1_000_000;
  const first = decideKnownUserAttempt({ hadError: true, now: t0, settings, scope: fresh });
  const scope = { ...fresh, failedAttempts: first.failedAttempts, firstFailedAttempt: t0, lastFailedAttempt: t0, nextAttemptAt: first.nextAttemptAt || 0 };
  return { first, second: decideKnownUserAttempt({ hadError: true, now: t0 + 100, settings, scope }) };
}

test('the reporter\'s fault: settings built from the three counters alone switch the delay off', () => {
  const old = { failuresBeforeLockout: 3, lockoutPeriod: 60, failureWindow: 15 };
  const { first, second } = twoQuickFailures(old);
  assert.equal(first.nextAttemptAt, 0, 'no wait was ever written');
  assert.equal(second.action, 'count', 'the next guess came straight through');
});

test('the settings the server starts the lockout with carry the delay, and it is applied', async () => {
  const { knownUsers } = await lockoutConfigs(async () => undefined);
  assert.equal(knownUsers.loginDelayBase, 1);
  assert.equal(knownUsers.loginDelayMax, 30);
  // As KnownUser.updateSettings() passes them on: nothing on the way drops the keys.
  const settings = validateLockoutSettings(mergeLockoutSettings(knownUsers, false));
  const { first, second } = twoQuickFailures(settings);
  assert.equal(first.action, 'count');
  assert.equal(first.delayMs, 1000, 'one second after the first wrong password');
  assert.equal(second.action, 'too-soon', 'a guess 100 ms later is refused');
  assert.equal(second.secondsRemaining, 1);
});

test('the delay doubles up to its maximum, and a stored setting is used', async () => {
  const { knownUsers } = await lockoutConfigs(async id => ({ 'known-loginDelayBase': 2, 'known-loginDelayMax': 5, 'known-failuresBeforeLockout': 10 })[id]);
  const delays = [1, 2, 3, 4].map(n => {
    const d = decideKnownUserAttempt({ hadError: true, now: 0, settings: knownUsers, scope: { ...fresh, failedAttempts: n - 1 } });
    return d.delayMs;
  });
  assert.deepEqual(delays, [2000, 4000, 5000, 5000]);
});

test('0 switches the delay off, as the model always documented; nonsense keeps the default', async () => {
  const { knownUsers } = await lockoutConfigs(async id => (id === 'known-loginDelayBase' ? 0 : undefined));
  assert.equal(knownUsers.loginDelayBase, 0);
  assert.equal(twoQuickFailures(knownUsers).second.action, 'count');
  for (const bad of [-1, 'x', NaN, null, Infinity]) {
    assert.equal(settingValue('loginDelayBase', bad, KNOWN_DEFAULTS.loginDelayBase), 1, String(bad));
  }
  // A counter of 0 would be a lockout that never locks: the default instead.
  assert.equal(settingValue('failuresBeforeLockout', 0, 3), 3);
});

test('a correct password is still allowed at once, delay or no delay', async () => {
  const { knownUsers } = await lockoutConfigs(async () => undefined);
  const d = decideKnownUserAttempt({ hadError: false, now: 1, settings: knownUsers, scope: { ...fresh, failedAttempts: 2, nextAttemptAt: 999999 } });
  assert.equal(d.action, 'allow');
});

// Negative, tree-wide: nothing starts the lockout with a hand-built list of
// settings again, and no server file reads the settings one by one.
test('negative: every place that starts the lockout reads its settings through lockoutConfigs', () => {
  const offenders = [];
  const starters = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.meteor'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!rel.endsWith('.js')) continue;
      const src = read(rel);
      if (/new AccountsLockout\(/.test(src)) {
        starters.push(rel);
        if (!/await lockoutConfigs\(/.test(src)) offenders.push(`${rel}: starts the lockout without lockoutConfigs`);
        if (/knownUsersConfig = \{/.test(src)) offenders.push(`${rel}: builds the settings by hand`);
      }
      // A READ by name. Seeding the first values (collectionBootstrap.js upserts
      // them from environment variables) is a write and is left alone.
      if (rel.startsWith('server') && /findOne(?:Async)?\(\s*['"`](?:known|unknown)-/.test(src)) {
        offenders.push(`${rel}: reads a lockout setting by name instead of through lockoutConfigs`);
      }
    }
  };
  for (const dir of ['server', 'models', 'imports']) walk(dir);
  assert.deepEqual(starters.sort(), ['server/accounts-lockout-config.js', 'server/methods/lockoutSettings.js']);
  assert.deepEqual(offenders, []);
});

test('the model\'s helpers read the same list', () => {
  const src = read('models/lockoutSettings.js');
  assert.match(src, /require\('\/models\/lib\/lockoutConfig'\)/);
  assert.match(src, /getKnownConfig\(\) \{\n\s+return configFromMap\('known'/);
  assert.doesNotMatch(src, /\|\| 3,|\|\| 60,|\|\| 15/, 'no defaults of its own');
});
