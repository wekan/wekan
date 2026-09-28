'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emailFailure, emailRetryDecision, MAX_EMAIL_ATTEMPTS } = require('../server/lib/emailRetryPolicy');
const now = new Date('2026-09-28T00:00:00Z');
test('structured SMTP classes take precedence over broad transport error codes', () => {
  for (const responseCode of [421, 450, 451, 454, 499]) {
    assert.deepEqual(emailFailure({ code: 'EAUTH', responseCode }), { reason: 'smtp-temporary', terminal: false });
  }
  for (const responseCode of [500, 530, 550, 554, 599]) {
    assert.deepEqual(emailFailure({ code: 'EENVELOPE', responseCode }), { reason: 'smtp-rejected', terminal: true });
  }
  assert.equal(emailFailure({ code: 'EAUTH', responseCode: 535 }).reason, 'smtp-authentication');
  assert.equal(emailFailure({ code: 'ETLS' }).terminal, true);
  assert.equal(emailFailure({ code: 'ESOCKET' }).terminal, false);
});
test('preparation and acknowledgement errors cannot be misclassified as permanent SMTP errors', () => {
  for (const phase of ['preparation', 'acknowledgement']) {
    const result = emailFailure({ code: 'EAUTH', responseCode: 550, message: 'PRIVATE-CREDENTIAL' }, phase);
    assert.equal(result.terminal, false); assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
  }
  assert.equal(emailFailure({ message: '550 fake text', responseCode: '550' }).terminal, false);
  assert.equal(emailFailure({ code: 'email-not-accepted' }).terminal, true);
});
test('retry delay has positive bounded jitter and the attempt limit preserves failed work', () => {
  const error = { responseCode: 451 };
  assert.equal(emailRetryDecision(error, 'smtp', 1, now, () => 0).nextAttemptAt - now, 5000);
  assert.equal(emailRetryDecision(error, 'smtp', 1, now, () => 1).nextAttemptAt - now, 6250);
  assert.equal(emailRetryDecision(error, 'smtp', 11, now, () => 1).nextAttemptAt - now, 3600000);
  assert.equal(emailRetryDecision(error, 'smtp', 11, now, () => 0).nextAttemptAt - now, 2880000);
  const stopped = emailRetryDecision(error, 'smtp', MAX_EMAIL_ATTEMPTS, now);
  assert.equal(stopped.state, 'failed'); assert.equal(stopped.lastFailure, 'retry-limit');
  assert.equal(stopped.nextAttemptAt, undefined);
  assert.equal(emailRetryDecision({ responseCode: 550 }, 'smtp', 1, now).state, 'failed');
  assert.equal(emailRetryDecision(error, 'smtp', 1, now, () => NaN).nextAttemptAt - now, 5000);
});
