'use strict';

// Plain-Node unit test (no Meteor) for the sign-up verification-email wrapper.
// Run: node tests/verificationEmail.test.cjs
//
// Regression guard for #5672 ("Internal Server Error When Signing Up Despite
// Successful Account Creation"). At sign-up, useraccounts creates the account
// and then calls Accounts.sendVerificationEmail(); when SMTP is not configured
// that throws AFTER the user exists, surfacing as an HTTP 500. wrapSend-
// VerificationEmail() must swallow + log a transport failure so registration
// still succeeds, while re-throwing an "already verified" error so the resend
// flow keeps working.

const assert = require('assert');
const {
  isAlreadyVerifiedError,
  wrapSendVerificationEmail,
} = require('../server/lib/verificationEmail');

let passed = 0;
function test(name, fn) {
  // Support async test bodies.
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

async function run() {
  // --- isAlreadyVerifiedError ------------------------------------------------
  await test('isAlreadyVerifiedError detects verified messages', () => {
    assert.strictEqual(
      isAlreadyVerifiedError(new Error('Email already verified')),
      true,
    );
    assert.strictEqual(
      isAlreadyVerifiedError({ reason: 'Already verified' }),
      true,
    );
  });

  await test('isAlreadyVerifiedError is false for transport errors / junk', () => {
    assert.strictEqual(
      isAlreadyVerifiedError(new Error('connect ECONNREFUSED 127.0.0.1:25')),
      false,
    );
    assert.strictEqual(isAlreadyVerifiedError(null), false);
    assert.strictEqual(isAlreadyVerifiedError(undefined), false);
    assert.strictEqual(isAlreadyVerifiedError({}), false);
  });

  // --- POSITIVE: a working sender is passed through --------------------------
  await test('a successful send returns its value and logs nothing', async () => {
    const logs = [];
    const wrapped = wrapSendVerificationEmail(
      async (userId, email) => `sent:${userId}:${email}`,
      m => logs.push(m),
    );
    const ret = await wrapped('u1', 'a@b.com');
    assert.strictEqual(ret, 'sent:u1:a@b.com');
    assert.strictEqual(logs.length, 0);
  });

  await test('the wrapper preserves `this` binding', async () => {
    const obj = {
      token: 'T',
      async send() {
        return this.token;
      },
    };
    obj.send = wrapSendVerificationEmail(obj.send, () => {});
    assert.strictEqual(await obj.send(), 'T');
  });

  await test('a non-function sender is returned unchanged', () => {
    assert.strictEqual(wrapSendVerificationEmail(undefined, () => {}), undefined);
    assert.strictEqual(wrapSendVerificationEmail(null, () => {}), null);
  });

  // --- NEGATIVE / the actual bug: transport failure must NOT throw -----------
  await test('#5672: an SMTP send failure is swallowed (no throw) and logged', async () => {
    const logs = [];
    const wrapped = wrapSendVerificationEmail(async () => {
      throw new Error('connect ECONNREFUSED 127.0.0.1:25');
    }, m => logs.push(m));

    let threw = false;
    let ret = 'unset';
    try {
      ret = await wrapped('u1', 'a@b.com');
    } catch (e) {
      threw = true;
    }
    assert.strictEqual(threw, false, 'must not throw on SMTP failure');
    assert.strictEqual(ret, undefined);
    assert.strictEqual(logs.length, 1);
    assert.ok(/verification email/i.test(logs[0]));
    assert.ok(/ECONNREFUSED/.test(logs[0]), 'logs the underlying cause');
  });

  await test('a synchronous throw is also swallowed', async () => {
    const logs = [];
    const wrapped = wrapSendVerificationEmail(() => {
      throw new Error('MAIL_URL not set');
    }, m => logs.push(m));
    const ret = await wrapped('u1');
    assert.strictEqual(ret, undefined);
    assert.strictEqual(logs.length, 1);
  });

  await test('swallowing still works when no logger is supplied', async () => {
    const wrapped = wrapSendVerificationEmail(async () => {
      throw new Error('smtp down');
    });
    // Must neither throw or need a logger.
    assert.strictEqual(await wrapped('u1'), undefined);
  });

  // --- NEGATIVE guard: an "already verified" error is re-thrown --------------
  await test('an "already verified" error is re-thrown (resend flow preserved)', async () => {
    const logs = [];
    const original = new Error('Verify email link is for an already verified user');
    const wrapped = wrapSendVerificationEmail(async () => {
      throw original;
    }, m => logs.push(m));

    let caught = null;
    try {
      await wrapped('u1');
    } catch (e) {
      caught = e;
    }
    assert.strictEqual(caught, original, 'already-verified error must propagate');
    assert.strictEqual(logs.length, 0, 'and must not be logged as a transport failure');
  });

  console.log(`\n${passed} tests passed`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
