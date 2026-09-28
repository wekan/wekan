'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sendDeadlineSmtp, smtpTotalTimeout } = require('../server/lib/smtpDeadline');

test('SMTP total timeout configuration cannot disable or unbound cancellation', () => {
  assert.equal(smtpTotalTimeout({}), 120000);
  assert.deepEqual(require('../server/lib/emailRetryPolicy').emailFailure({ code: 'OUTBOUND_DEADLINE_EXCEEDED' }),
    { reason: 'delivery-failed', terminal: false });
  assert.equal(smtpTotalTimeout({ MAIL_TOTAL_TIMEOUT_MS: '1000' }), 1000);
  for (const value of ['0', '-1', '999', '300001', 'Infinity', 'NaN', '1.5']) {
    assert.throws(() => smtpTotalTimeout({ MAIL_TOTAL_TIMEOUT_MS: value }), /MAIL_TOTAL_TIMEOUT_MS/);
  }
});
test('invalid budget cannot open a transport and a failed send closes its transport', async () => {
  let opened = 0, closed = 0;
  const failure = new Error('failure');
  const nodemailer = { createTransport(options) {
    opened++; assert.equal(options.pool, false);
    return { sendMail: async () => { throw failure; }, close: () => closed++ };
  } };
  await assert.rejects(sendDeadlineSmtp({ nodemailer, options: {}, timeoutMs: 0 }), /timeout/);
  assert.equal(opened, 0);
  await assert.rejects(sendDeadlineSmtp({ nodemailer, options: {}, timeoutMs: 1000 }), failure);
  assert.equal(closed, 1);
});
test('late preparation cannot open a socket after the deadline', async () => {
  let connect, closed = 0;
  const nodemailer = { createTransport(options) {
    connect = options.getSocket;
    return { sendMail: () => new Promise(() => {}), close: () => closed++ };
  } };
  await assert.rejects(sendDeadlineSmtp({ nodemailer, options: {}, timeoutMs: 20 }),
    { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
  const error = await new Promise(resolve => connect({ host: '127.0.0.1', port: 1 }, resolve));
  assert.equal(error.code, 'OUTBOUND_DEADLINE_EXCEEDED');
  assert.equal(closed, 1);
});
