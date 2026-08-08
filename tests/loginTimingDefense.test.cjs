'use strict';

// LockoutBleed - https://wekan.fi/hall-of-fame/lockoutbleed/ (the timing half)
// Named for tests/securityRegressionCoverage.test.cjs, which checks the published
// Hall of Fame list against the tests that guard it - a test that does not say
// which vulnerability it belongs to cannot be checked against that list.

// Plain-Node unit test (no Meteor) for the login timing side-channel defence.
// Run: node tests/loginTimingDefense.test.cjs
//
// GHSA-2g94-9x3m-hv37 (User Enumeration via bcrypt timing): a missing user (or a
// user with no local password) skips bcrypt and answers in ~2 ms while a real
// user takes ~50 ms, leaking which accounts exist. equalizeMissingUserTiming
// runs one dummy bcrypt comparison against a fixed hash to erase that gap.

const assert = require('assert');
const {
  DUMMY_BCRYPT_HASH,
  DUMMY_DIGEST,
  dummyUser,
  hasLocalPassword,
  equalizeMissingUserTiming,
} = require('../server/lib/loginTimingDefense');

let passed = 0;
function test(name, fn) {
  const r = fn();
  if (r && typeof r.then === 'function') {
    return r.then(() => {
      passed += 1;
      console.log('  ok -', name);
    });
  }
  passed += 1;
  console.log('  ok -', name);
  return undefined;
}

async function main() {
  test('the dummy hash is a valid cost-10 bcrypt hash', () => {
    // $2a/$2b/$2y, cost 10, then a 22-char salt + 31-char digest (53 total).
    assert.ok(
      /^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/.test(DUMMY_BCRYPT_HASH),
      `unexpected dummy hash: ${DUMMY_BCRYPT_HASH}`,
    );
  });

  test('the dummy digest is a 64-hex SHA-256 string', () => {
    assert.ok(/^[0-9a-f]{64}$/.test(DUMMY_DIGEST));
  });

  test('dummyUser carries the hash exactly where _checkPasswordAsync reads it', () => {
    assert.strictEqual(dummyUser().services.password.bcrypt, DUMMY_BCRYPT_HASH);
  });

  test('hasLocalPassword: true for bcrypt or argon2, false otherwise', () => {
    assert.strictEqual(hasLocalPassword({ services: { password: { bcrypt: 'x' } } }), true);
    assert.strictEqual(hasLocalPassword({ services: { password: { argon2: 'x' } } }), true);
    assert.strictEqual(hasLocalPassword({ services: { password: {} } }), false);
    assert.strictEqual(hasLocalPassword({ services: {} }), false);
    assert.strictEqual(hasLocalPassword(undefined), false);
    assert.strictEqual(hasLocalPassword(null), false);
  });

  await test('equalizeMissingUserTiming calls checkPassword with the dummy user + digest', async () => {
    let calledWith = null;
    await equalizeMissingUserTiming(async (user, password) => {
      calledWith = { user, password };
      return { userId: user._id };
    });
    assert.ok(calledWith, 'the injected checkPassword must be invoked');
    assert.strictEqual(calledWith.user.services.password.bcrypt, DUMMY_BCRYPT_HASH);
    assert.strictEqual(calledWith.password.digest, DUMMY_DIGEST);
    assert.strictEqual(calledWith.password.algorithm, 'sha-256');
  });

  await test('equalizeMissingUserTiming swallows a throwing checkPassword', async () => {
    await equalizeMissingUserTiming(async () => {
      throw new Error('boom');
    });
    // Reaching here without throwing is the assertion.
    assert.ok(true);
  });

  await test('equalizeMissingUserTiming is a no-op when not given a function', async () => {
    await equalizeMissingUserTiming(undefined);
    await equalizeMissingUserTiming(null);
    assert.ok(true);
  });

  console.log(`\nloginTimingDefense: all ${passed} tests passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
