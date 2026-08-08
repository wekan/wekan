'use strict';

// LockoutBleed - https://wekan.fi/hall-of-fame/lockoutbleed/ (the REST throttle)
// Named for tests/securityRegressionCoverage.test.cjs, which checks the published
// Hall of Fame list against the tests that guard it - a test that does not say
// which vulnerability it belongs to cannot be checked against that list.

// Plain-Node unit test (no Meteor) for the REST /users/login brute-force
// throttle. Run: node tests/loginAttemptThrottle.test.cjs
//
// GHSA-2g94-9x3m-hv37 (Unthrottled Password Brute-Force): the REST login path
// bypasses the DDP accounts-lockout hooks, so it needs its own per-client
// failed-attempt throttle. Time is injected so the state machine is pinned
// deterministically.

const assert = require('assert');
const {
  LoginAttemptThrottle,
  resolveClientKey,
} = require('../server/lib/loginAttemptThrottle');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- Throttle state machine ------------------------------------------------

test('a fresh key is not blocked', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 3, windowMs: 1000, lockoutMs: 5000 });
  assert.deepStrictEqual(t.check('ip', 0), { blocked: false, retryAfterMs: 0 });
});

test('blocks after maxFailures within the window', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 3, windowMs: 1000, lockoutMs: 5000 });
  assert.strictEqual(t.recordFailure('ip', 0).blocked, false); // 1
  assert.strictEqual(t.recordFailure('ip', 10).blocked, false); // 2
  const third = t.recordFailure('ip', 20); // 3 -> lock
  assert.strictEqual(third.blocked, true);
  assert.strictEqual(third.retryAfterMs, 5000);
  // A subsequent check while locked is still blocked, with a shrinking wait.
  assert.deepStrictEqual(t.check('ip', 2020), { blocked: true, retryAfterMs: 3000 });
});

test('unblocks once the lockout expires', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 3, windowMs: 1000, lockoutMs: 5000 });
  t.recordFailure('ip', 0);
  t.recordFailure('ip', 10);
  t.recordFailure('ip', 20); // locked until 5020
  assert.strictEqual(t.check('ip', 5019).blocked, true);
  assert.strictEqual(t.check('ip', 5020).blocked, false);
  // After expiry a new failure starts a fresh window, not an immediate re-lock.
  assert.strictEqual(t.recordFailure('ip', 5020).blocked, false);
});

test('failures older than the window do not accumulate to a lock', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 3, windowMs: 1000, lockoutMs: 5000 });
  t.recordFailure('ip', 0);
  t.recordFailure('ip', 500);
  // 2000ms after windowStart(0): the window elapsed, counter resets to 1.
  assert.strictEqual(t.recordFailure('ip', 2000).blocked, false);
  assert.strictEqual(t.recordFailure('ip', 2100).blocked, false); // 2
  assert.strictEqual(t.recordFailure('ip', 2200).blocked, true); // 3 -> lock
});

test('a success clears the failure counter', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 3, windowMs: 1000, lockoutMs: 5000 });
  t.recordFailure('ip', 0);
  t.recordFailure('ip', 10);
  t.recordSuccess('ip');
  assert.strictEqual(t.recordFailure('ip', 20).blocked, false); // back to 1
  assert.strictEqual(t.size(), 1);
});

test('keys are independent', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 2, windowMs: 1000, lockoutMs: 5000 });
  t.recordFailure('a', 0);
  t.recordFailure('a', 10); // a locked
  assert.strictEqual(t.check('a', 20).blocked, true);
  assert.strictEqual(t.check('b', 20).blocked, false);
});

test('prune drops fully-expired keys and keeps live ones', () => {
  const t = new LoginAttemptThrottle({ maxFailures: 5, windowMs: 1000, lockoutMs: 5000 });
  t.recordFailure('old', 0);
  t.recordFailure('fresh', 900);
  t.prune(2000); // old's window (0..1000) elapsed; fresh's (900..1900) elapsed too at 2000
  // Both windows elapsed and neither is locked, so both are pruned.
  assert.strictEqual(t.size(), 0);
  t.recordFailure('locked', 3000);
  t.recordFailure('locked', 3100);
  t.recordFailure('locked', 3200);
  t.recordFailure('locked', 3300);
  t.recordFailure('locked', 3400); // -> locked until 8400
  t.prune(9000); // window elapsed AND lock expired -> pruned
  assert.strictEqual(t.size(), 0);
});

// --- resolveClientKey ------------------------------------------------------

test('resolveClientKey uses the socket address by default (header ignored)', () => {
  assert.strictEqual(
    resolveClientKey({
      headers: { 'x-forwarded-for': '1.2.3.4' },
      socketAddress: '10.0.0.1',
      forwardedCount: undefined,
    }),
    '10.0.0.1',
    'without HTTP_FORWARDED_COUNT the spoofable header must be ignored',
  );
});

test('resolveClientKey honours X-Forwarded-For only with a declared hop count', () => {
  assert.strictEqual(
    resolveClientKey({
      headers: { 'x-forwarded-for': 'client, proxy1, proxy2' },
      socketAddress: '10.0.0.1',
      forwardedCount: 1,
    }),
    'proxy2',
  );
  assert.strictEqual(
    resolveClientKey({
      headers: { 'x-forwarded-for': 'client, proxy1, proxy2' },
      socketAddress: '10.0.0.1',
      forwardedCount: 2,
    }),
    'proxy1',
  );
});

test('resolveClientKey falls back cleanly when data is missing', () => {
  assert.strictEqual(resolveClientKey({}), 'unknown');
  assert.strictEqual(
    resolveClientKey({ headers: {}, socketAddress: '', forwardedCount: 2 }),
    'unknown',
  );
  // hop count larger than the chain -> fall back to socket address
  assert.strictEqual(
    resolveClientKey({
      headers: { 'x-forwarded-for': 'only-one' },
      socketAddress: '10.0.0.1',
      forwardedCount: 5,
    }),
    '10.0.0.1',
  );
});

console.log(`\nloginAttemptThrottle: all ${passed} tests passed`);
