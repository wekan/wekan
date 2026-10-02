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

test('an unreadable setting yields its default', async () => {
  const start = src.indexOf('async function lockoutSetting(');
  const body = src.slice(start, src.indexOf('\n}\n', start) + 2);
  const make = findOneAsync => new Function('LockoutSettings', 'console', `${body}\nreturn lockoutSetting;`)( // eslint-disable-line no-new-func
    { findOneAsync }, { error() {} });
  assert.equal(await make(async () => { throw new Error('db down'); })('known-lockoutPeriod', 60), 60);
  assert.equal(await make(async () => null)('known-lockoutPeriod', 60), 60);
  assert.equal(await make(async () => ({ value: 5 }))('known-failuresBeforeLockout', 3), 5);
});

test('negative: no settings read sits in the try that guards startup()', () => {
  const tries = src.split('try {').slice(1).map(part => part.slice(0, part.indexOf('} catch')));
  const guardingStartup = tries.filter(t => /accountsLockout\.startup\(\)/.test(t));
  assert.equal(guardingStartup.length, 1);
  assert.doesNotMatch(guardingStartup[0], /findOneAsync|lockoutSetting\(/);
  assert.equal((src.match(/await lockoutSetting\('/g) || []).length, 6);
});
