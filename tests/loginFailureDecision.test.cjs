'use strict';

// LockoutBleed - https://wekan.fi/hall-of-fame/lockoutbleed/ (the lockout half)
// Named for tests/securityRegressionCoverage.test.cjs, which checks the published
// Hall of Fame list against the tests that guard it - a test that does not say
// which vulnerability it belongs to cannot be checked against that list.

// Plain-Node unit test (no Meteor) for the accounts-lockout failure decision.
// Run: node tests/loginFailureDecision.test.cjs
//
// GHSA-2g94-9x3m-hv37 (User Enumeration + Unthrottled Password Brute-Force):
// the wekan-accounts-lockout hooks gated on the English reason string
// ('Incorrect password' / 'User not found'), but Meteor's default
// `ambiguousErrorMessages` rewrites every credential failure reason to
// "Something went wrong. Please check your credentials." before the hooks run.
// The literal therefore never matched, both hooks returned early, the failure
// counter never incremented, and the lockout never fired — unlimited unthrottled
// password guessing. The fix decides from structural fields instead. These tests
// pin exactly that: the ambiguous reason must still count, and the benign
// 2FA-code-needed step must not.

const assert = require('assert');
const {
  isCountableFailure,
  isNonFailureError,
  shouldProcessKnownUser,
  shouldProcessUnknownUser,
} = require('../packages/wekan-accounts-lockout/src/loginFailureDecision');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// The exact runtime reason produced by Meteor when ambiguousErrorMessages is on
// (the default). Every credential failure — wrong password AND unknown user —
// arrives with this reason, NOT the old literals.
const AMBIGUOUS = 'Something went wrong. Please check your credentials.';
const credentialFailure = { error: 403, reason: AMBIGUOUS };
const knownUser = { _id: 'u1', username: 'alice' };

// --- The regression the advisory reported: ambiguous reason must still count --

test('REGRESSION: a known-user failure with the ambiguous reason is processed', () => {
  // This is the case that used to slip through: reason !== 'Incorrect password'.
  assert.strictEqual(
    shouldProcessKnownUser({
      type: 'password',
      user: knownUser,
      error: credentialFailure,
      allowed: false,
    }),
    true,
  );
});

test('REGRESSION: an unknown-user failure with the ambiguous reason is processed', () => {
  // reason !== 'User not found' used to make this bail out.
  assert.strictEqual(
    shouldProcessUnknownUser({
      type: 'password',
      user: undefined,
      error: credentialFailure,
      allowed: false,
    }),
    true,
  );
});

test('REGRESSION: even the literal old reasons are still counted (not relied upon)', () => {
  assert.strictEqual(
    shouldProcessKnownUser({
      type: 'password',
      user: knownUser,
      error: { error: 403, reason: 'Incorrect password' },
    }),
    true,
  );
  assert.strictEqual(
    shouldProcessUnknownUser({
      type: 'password',
      user: undefined,
      error: { error: 403, reason: 'User not found' },
    }),
    true,
  );
});

// --- Known-user hook -------------------------------------------------------

test('known: a successful login is still processed (to enforce active locks)', () => {
  // error undefined + user present: the hook must run so an already-locked
  // account is still held; the inner logic then allows it if not locked.
  assert.strictEqual(
    shouldProcessKnownUser({ type: 'password', user: knownUser, error: undefined }),
    true,
  );
});

test('known: the benign no-2fa-code step is NOT a failure (never locks 2FA users)', () => {
  const twoFactorNeeded = { error: 'no-2fa-code', reason: AMBIGUOUS };
  assert.strictEqual(isNonFailureError(twoFactorNeeded), true);
  assert.strictEqual(isCountableFailure(twoFactorNeeded), false);
  assert.strictEqual(
    shouldProcessKnownUser({ type: 'password', user: knownUser, error: twoFactorNeeded }),
    false,
  );
});

test('known: a WRONG second factor DOES count (password was already correct)', () => {
  const badCode = { error: 'invalid-2fa-code', reason: AMBIGUOUS };
  assert.strictEqual(isCountableFailure(badCode), true);
  assert.strictEqual(
    shouldProcessKnownUser({ type: 'password', user: knownUser, error: badCode }),
    true,
  );
});

test('known: non-password logins are ignored', () => {
  for (const type of ['resume', 'oauth', 'ldap', undefined]) {
    assert.strictEqual(
      shouldProcessKnownUser({ type, user: knownUser, error: credentialFailure }),
      false,
      `type ${type} must not be processed by the known-user hook`,
    );
  }
});

test('known: an undefined user is left to the unknown-user hook', () => {
  assert.strictEqual(
    shouldProcessKnownUser({ type: 'password', user: undefined, error: credentialFailure }),
    false,
  );
});

// --- Unknown-user hook -----------------------------------------------------

test('unknown: only failures count — a request with no error is ignored', () => {
  assert.strictEqual(
    shouldProcessUnknownUser({ type: 'password', user: undefined, error: undefined }),
    false,
  );
});

test('unknown: a present user is left to the known-user hook', () => {
  assert.strictEqual(
    shouldProcessUnknownUser({ type: 'password', user: knownUser, error: credentialFailure }),
    false,
  );
});

test('unknown: non-password logins are ignored', () => {
  assert.strictEqual(
    shouldProcessUnknownUser({ type: 'resume', user: undefined, error: credentialFailure }),
    false,
  );
});

// --- Robustness ------------------------------------------------------------

test('never throws on missing / malformed loginInfo', () => {
  assert.strictEqual(shouldProcessKnownUser(undefined), false);
  assert.strictEqual(shouldProcessUnknownUser(undefined), false);
  assert.strictEqual(shouldProcessKnownUser({}), false);
  assert.strictEqual(shouldProcessUnknownUser({}), false);
  assert.strictEqual(isCountableFailure(undefined), false);
  assert.strictEqual(isCountableFailure(null), false);
});

console.log(`\nloginFailureDecision: all ${passed} tests passed`);
