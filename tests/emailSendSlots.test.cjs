'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createEmailSendSlots } = require('../server/lib/emailSendSlots');
const { withSmtpCancellation, smtpCancellationSignal } = require('../server/lib/smtpCancellation');
const { sendDeadlineSmtp } = require('../server/lib/smtpDeadline');
test('invalid capacity policies cannot open reservations', () => {
  for (const policy of [{ limit: 0 }, { limit: 5 }, { leaseMs: 0 }, { heartbeatMs: 0 }, { heartbeatMs: 30000 }]) {
    assert.throws(() => createEmailSendSlots({}, policy), /Invalid email slot policy/);
  }
});
test('cancelled scope prevents a late SMTP start and nested cancellation preserves the parent', async () => {
  const parent = new AbortController(), child = new AbortController();
  const reason = Object.assign(new Error('lost'), { code: 'sync-lease-lost' });
  await withSmtpCancellation(parent.signal, () => withSmtpCancellation(child.signal, async () => {
    const signal = smtpCancellationSignal(); parent.abort(reason);
    assert.equal(signal.reason, reason);
    await assert.rejects(sendDeadlineSmtp({ timeoutMs: 100,
      nodemailer: { createTransport: () => assert.fail('cancelled owner must not create a transport') } }), reason);
  }));
  assert.equal(smtpCancellationSignal(), undefined);
});
