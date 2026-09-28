'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { emailReceiptPolicy, compactJob, compactCommand } = require('../server/lib/emailReceiptRetention');
const { idFor, matchesEmailJob, matchesEmailCommand } = require('../server/lib/emailReceiptIdentity');
test('retention policy has bounded ages and intervals, without disabling replay protection', () => {
  assert.deepEqual(emailReceiptPolicy({}), { days: 30, intervalMs: 60000 });
  for (const value of ['0', '-1', 'NaN', 'Infinity', '1.5', '3651']) {
    assert.throws(() => emailReceiptPolicy({ EMAIL_RECEIPT_METADATA_DAYS: value }), /METADATA_DAYS/);
  }
  for (const value of ['0', '999', '86400001', 'NaN']) {
    assert.throws(() => emailReceiptPolicy({ EMAIL_RECEIPT_SWEEP_INTERVAL_MS: value }), /SWEEP_INTERVAL/);
  }
});
test('minimal terminal job receipts retain only their original replay identity and state', () => {
  const row = { _id: idFor('user', 'event'), userId: 'user', eventId: 'event', state: 'sent', html: 'old body' };
  const receipt = compactJob(row);
  assert.deepEqual(receipt, { _id: row._id, state: 'sent', compactReceiptVersion: 1 });
  assert.ok(matchesEmailJob(receipt, 'user', 'event'));
  assert.equal(matchesEmailJob(receipt, 'other', 'event'), false);
  for (const bad of [{ ...receipt, state: 'pending' }, { ...receipt, compactReceiptVersion: 2 },
    { ...receipt, userId: 'user', eventId: 'event' }]) assert.equal(matchesEmailJob(bad, 'user', 'event'), false);
  assert.equal(compactJob({ ...row, state: 'failed' }), null);
  assert.equal(compactJob({ ...row, _id: 'wrong' }), null);
});
test('compact command receipts bind actor, recipient and action while retaining terminal status', () => {
  const identity = { requestId: 'request-abcdefghijklmnop', userId: 'user', actorId: 'admin', action: 'cancel' };
  const receipt = compactCommand({ ...identity, _id: identity.requestId, status: 'completed', cutoff: new Date() });
  assert.ok(matchesEmailCommand(receipt, identity));
  for (const key of ['requestId', 'userId', 'actorId', 'action']) {
    assert.equal(matchesEmailCommand(receipt, { ...identity, [key]: 'different' }), false);
  }
  assert.equal(matchesEmailCommand({ ...receipt, status: 'pending' }, identity), false);
  assert.equal(matchesEmailCommand({ ...receipt, cutoff: new Date() }, identity), false);
  assert.equal(compactCommand({ ...identity, _id: identity.requestId, status: 'pending' }), null);
});
