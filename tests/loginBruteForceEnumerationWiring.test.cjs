'use strict';

// LockoutBleed - https://wekan.fi/hall-of-fame/lockoutbleed/ (the wiring)
// Named for tests/securityRegressionCoverage.test.cjs, which checks the published
// Hall of Fame list against the tests that guard it - a test that does not say
// which vulnerability it belongs to cannot be checked against that list.

// Plain-Node source guard for GHSA-2g94-9x3m-hv37. The behaviour is unit-tested
// in loginFailureDecision / loginTimingDefense / loginAttemptThrottle; this
// suite pins the WIRING that connects those helpers to the real login paths, so
// a future refactor cannot silently re-open the hole (e.g. by restoring the
// fragile reason-string guard, or dropping the REST timing/throttle).
//
// Run: node tests/loginBruteForceEnumerationWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
// Strip comments so a negative assertion tests the CODE, not the prose that
// documents what the code used to do (which legitimately quotes the old guard).
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const knownUser = read('packages/wekan-accounts-lockout/src/knownUser.js');
const unknownUser = read('packages/wekan-accounts-lockout/src/unknownUser.js');
const knownUserCode = stripComments(knownUser);
const unknownUserCode = stripComments(unknownUser);
const restRoutes = read('server/apiAuthRoutes.js');
const restRoutesCode = stripComments(restRoutes);
const ddpNorm = read('server/loginTimingNormalization.js');

// --- Lockout hooks no longer depend on the ambiguous reason string ----------

test('knownUser hook decides via shouldProcessKnownUser, not the old literal', () => {
  assert.ok(
    /shouldProcessKnownUser\(loginInfo\)/.test(knownUser),
    'knownUser must use the structural decision helper',
  );
  assert.ok(
    !/reason\s*!==\s*'Incorrect password'/.test(knownUserCode),
    "the fragile reason === 'Incorrect password' guard must be gone",
  );
});

test('unknownUser hook decides via shouldProcessUnknownUser, not the old literal', () => {
  assert.ok(
    /shouldProcessUnknownUser\(loginInfo\)/.test(unknownUser),
    'unknownUser must use the structural decision helper',
  );
  assert.ok(
    !/reason\s*!==\s*'User not found'/.test(unknownUserCode),
    "the fragile reason === 'User not found' guard must be gone",
  );
});

// --- REST /users/login: uniform error, timing, throttle ---------------------

test('REST login no longer leaks a distinct "not found" message', () => {
  assert.ok(
    !/User with that username or email address not found\./.test(restRoutesCode),
    'the enumerating not-found message must be removed',
  );
  assert.ok(
    /uniformLoginError\(\)/.test(restRoutes),
    'both missing-user and wrong-password must throw the same uniform error',
  );
});

test('REST login equalizes timing for a missing / password-less user', () => {
  assert.ok(/equalizeMissingUserTiming\(/.test(restRoutes));
  assert.ok(/hasLocalPassword\(user\)/.test(restRoutes));
});

test('REST login throttles failed attempts and resets on success', () => {
  assert.ok(/new LoginAttemptThrottle\(/.test(restRoutes));
  assert.ok(/restLoginThrottle\.check\(/.test(restRoutes), 'must gate before work');
  assert.ok(/restLoginThrottle\.recordFailure\(/.test(restRoutes));
  assert.ok(/restLoginThrottle\.recordSuccess\(/.test(restRoutes));
  assert.ok(/statusCode = 429|429/.test(restRoutes), 'locked clients get 429');
});

// --- DDP login timing normalization ----------------------------------------

test('DDP password login gets a front-running timing-normalization handler', () => {
  assert.ok(/registerLoginHandler\('password'/.test(ddpNorm));
  assert.ok(/equalizeMissingUserTiming\(/.test(ddpNorm));
  assert.ok(
    /_loginHandlers/.test(ddpNorm) && /unshift/.test(ddpNorm),
    'the handler must be moved ahead of the built-in password handler',
  );
  assert.ok(
    /return undefined/.test(ddpNorm),
    'the normalization handler must never authenticate (always fall through)',
  );
});

console.log(`\nloginBruteForceEnumerationWiring: all ${passed} tests passed`);
