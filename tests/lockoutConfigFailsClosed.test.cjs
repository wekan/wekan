'use strict';

// Guard (2026-10-02): the login lockout was configured inside one try/catch
// around every settings read; a single failed read at startup (a slow or
// restarting database) skipped accountsLockout.startup() and left the server
// with no lockout at all. Each read now falls back to its default.
// Run: node tests/lockoutConfigFailsClosed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/accounts-lockout-config.js'), 'utf8');
const { lockoutConfigs } = require(path.join(__dirname, '..', 'models/lib/lockoutConfig.js'));

// The reads moved into models/lib/lockoutConfig.js (2026-11-24), where the
// delay settings were added to them; the rule this test pins is unchanged.
test('an unreadable setting yields its default', async () => {
  const errors = [];
  const down = await lockoutConfigs(async () => { throw new Error('db down'); }, id => errors.push(id));
  assert.equal(down.knownUsers.lockoutPeriod, 60);
  assert.equal(down.unknownUsers.failuresBeforeLockout, 3);
  assert.ok(errors.includes('known-lockoutPeriod'), 'and the failed read is reported');
  const none = await lockoutConfigs(async () => undefined);
  assert.equal(none.knownUsers.lockoutPeriod, 60);
  const set = await lockoutConfigs(async id => (id === 'known-failuresBeforeLockout' ? 5 : undefined));
  assert.equal(set.knownUsers.failuresBeforeLockout, 5);
});

test('negative: no settings read sits in the try that guards startup()', () => {
  const tries = src.split('try {').slice(1).map(part => part.slice(0, part.indexOf('} catch')));
  const guardingStartup = tries.filter(t => /accountsLockout\.startup\(\)/.test(t));
  assert.equal(guardingStartup.length, 1);
  assert.doesNotMatch(guardingStartup[0], /findOneAsync|lockoutConfigs\(/);
  assert.equal((src.match(/await lockoutConfigs\(/g) || []).length, 1, 'every setting is read in one call, before the try');
});
