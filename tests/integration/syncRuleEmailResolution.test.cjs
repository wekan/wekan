'use strict';
// #2713: a real partial dispatch on MongoDB records who accepted; after the
// quarantine an administrator resends to the rest only, or drops the attempt
// and the stage completes without mail.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { ensureRuleEmailCommand } = require('../../server/lib/syncRuleEmailCommand');
const { dispatchRuleEmail: dispatch } = require('../../server/lib/syncRuleEmailDispatch');
const R = require('../../server/lib/syncRuleEmailResolution');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL, composerPath = process.env.WEKAN_TEST_MAILCOMPOSER;
async function fixture(t) {
  const client = await new MongoClient(uri).connect(), db = client.db(`rule_resolution_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const f = { activity: { _id: 'a', boardId: 'b', cardId: 'c', userId: 'u' }, effectId: 'a'.repeat(64), index: 0,
    assertCurrent: async () => {}, attempts: db.collection('attempts'), commands: db.collection('commands'),
    outcomes: db.collection('outcomes'), resolutions: db.collection('resolutions'), MailComposer: require(composerPath), sent: [] };
  f.plan = await prepareRulePlan({ ...f, selectRules: async () => [{ _id: 'r', boardId: 'b', actionId: 'a', triggerId: 't' }],
    readAction: async () => ({ _id: 'a', actionType: 'sendEmail' }) });
  f.command = await ensureRuleEmailCommand({ ...f, prepare: async () => ({
    to: 'One <one@example.org>, two@example.org', from: 'sender@example.org', subject: 'Subject', text: 'Body' }) });
  f.partial = async mail => { f.sent.push(mail); return { accepted: ['one@example.org'], rejected: ['two@example.org'] }; };
  return f;
}
const later = () => new Date(Date.now() + R.QUARANTINE_MS + 1000);

test('partial dispatch, then resend to the unconfirmed recipient only', { skip: !uri || !composerPath }, async t => {
  const f = await fixture(t);
  await assert.rejects(dispatch({ ...f, send: f.partial }), /delivery-unconfirmed/);
  assert.deepEqual((await f.outcomes.findOne({ _id: f.command._id })).accepted, ['one@example.org']);
  await assert.rejects(dispatch({ ...f, send: () => assert.fail('never resent automatically') }), /delivery-uncertain/);
  const detail = await R.ruleEmailRecoveryDetail({ ...f, commandId: f.command._id, now: later });
  assert.deepEqual(detail.recipients.map(r => r.status), ['accepted', 'unconfirmed']);
  const result = await R.resendUnconfirmedRuleEmail({ ...f, commandId: f.command._id, operator: 'admin', now: later,
    send: async mail => { f.sent.push(mail); return { accepted: mail.envelope.to }; } });
  assert.equal(result.status, 'sent');
  assert.deepEqual(f.sent[1].envelope.to, ['two@example.org']);
  assert.equal((await f.attempts.findOne({ _id: f.command._id })).state, 'sent');
  assert.equal(await dispatch({ ...f, send: () => assert.fail('already sent') }), f.command.invocationId);
});

test('drop completes the stage without mail and cannot be reversed', { skip: !uri || !composerPath }, async t => {
  const f = await fixture(t);
  await assert.rejects(dispatch({ ...f, send: f.partial }));
  await R.resolveRuleEmailAttempt({ ...f, commandId: f.command._id, decision: 'drop', operator: 'admin', now: later });
  assert.equal(await dispatch({ ...f, send: () => assert.fail('dropped mail is not sent') }), f.command.invocationId);
  await assert.rejects(R.resolveRuleEmailAttempt({ ...f, commandId: f.command._id, decision: 'mark-sent', operator: 'admin', now: later }),
    /already-resolved/);
  assert.equal(await f.resolutions.countDocuments({ decision: 'drop' }), 1);
});
