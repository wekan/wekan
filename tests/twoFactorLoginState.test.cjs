'use strict';

// Plain-Node unit test (no Meteor) for the sign-in form's 2FA-code-step
// decision (imports/lib/twoFactorAuthLoginDecision.js), part of GitHub issue
// #3058: native TOTP two-factor authentication via Meteor's official
// accounts-2fa package (https://docs.meteor.com/packages/accounts-2fa.html).
// accounts-2fa itself generates/verifies the TOTP codes and is not
// re-tested here - only WeKan's own decision of when to show the second
// "enter your 6-digit code" step is pure/testable without a running Meteor
// server, so that is what this suite pins.
//
// Run: node tests/twoFactorLoginState.test.cjs

const assert = require('assert');
const {
  NEED_CODE,
  INVALID_CODE,
  decideTwoFactorLoginStep,
  isTwoFactorLoginStep,
} = require('../imports/lib/twoFactorAuthLoginDecision');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('exposes the exact accounts-2fa error codes', () => {
  assert.strictEqual(NEED_CODE, 'no-2fa-code');
  assert.strictEqual(INVALID_CODE, 'invalid-2fa-code');
});

test('no-2fa-code on sign-in shows the code step for the first time', () => {
  const step = decideTwoFactorLoginStep({ error: 'no-2fa-code' }, 'signIn');
  assert.strictEqual(step, 'need-code');
  assert.strictEqual(isTwoFactorLoginStep(step), true);
});

test('invalid-2fa-code on sign-in keeps the code step open with an inline error', () => {
  const step = decideTwoFactorLoginStep({ error: 'invalid-2fa-code' }, 'signIn');
  assert.strictEqual(step, 'retry-code');
  assert.strictEqual(isTwoFactorLoginStep(step), true);
});

test('an ordinary credential failure is NOT treated as a 2FA step', () => {
  const step = decideTwoFactorLoginStep(
    { error: 403, reason: 'Something went wrong. Please check your credentials.' },
    'signIn',
  );
  assert.strictEqual(step, 'none');
  assert.strictEqual(isTwoFactorLoginStep(step), false);
});

test('no error at all is never a 2FA step', () => {
  assert.strictEqual(decideTwoFactorLoginStep(undefined, 'signIn'), 'none');
  assert.strictEqual(decideTwoFactorLoginStep(null, 'signIn'), 'none');
});

test('the 2FA step only ever applies to the sign-in form, never sign-up/other states', () => {
  assert.strictEqual(
    decideTwoFactorLoginStep({ error: 'no-2fa-code' }, 'signUp'),
    'none',
  );
  assert.strictEqual(
    decideTwoFactorLoginStep({ error: 'no-2fa-code' }, 'changePwd'),
    'none',
  );
  assert.strictEqual(
    decideTwoFactorLoginStep({ error: 'no-2fa-code' }, undefined),
    'none',
  );
});

test('a non-object error is never a 2FA step (defensive)', () => {
  assert.strictEqual(decideTwoFactorLoginStep('boom', 'signIn'), 'none');
  assert.strictEqual(decideTwoFactorLoginStep(42, 'signIn'), 'none');
});

test('REGRESSION: does not fire on the shape of a plain lockout error', () => {
  // GHSA-2g94-9x3m-hv37's lockout error is a Meteor.Error with a different
  // code ('too-many-failed-attempts' style); must never be mistaken for the
  // 2FA step, or a locked-out user would be shown a bogus code prompt.
  const step = decideTwoFactorLoginStep(
    { error: 'too-many-failed-attempts', reason: 'Too many failed attempts' },
    'signIn',
  );
  assert.strictEqual(step, 'none');
});

console.log(`\n${passed} passed`);
