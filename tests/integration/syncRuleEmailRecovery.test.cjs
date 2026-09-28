'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { prepareRulePlan } = require('../../server/lib/syncRulePlan');
const { ensureRuleEmailCommand } = require('../../server/lib/syncRuleEmailCommand');
const { dispatchRuleEmail } = require('../../server/lib/syncRuleEmailDispatch');
const { confirmAcceptedRuleEmail } = require('../../server/lib/syncRuleEmailRecovery');
const { resolveRuleEmailSource } = require('../../server/lib/ruleEmailSource');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL, composer = process.env.WEKAN_TEST_MAILCOMPOSER;
test('offline CLI resumes a MongoDB acceptance decision; dispatch reuses the receipt without SMTP and keeps live guards', { skip: !uri || !composer }, async t => {
  const client = await new MongoClient(uri).connect(), db = client.db(`email_recovery_${new ObjectId().toHexString()}`);
  t.after(async () => { await db.dropDatabase(); await client.close(); });
  const commands = db.collection('listSyncRuleEmailCommands'), attempts = db.collection('listSyncRuleEmailAttempts'),
    resolutions = db.collection('listSyncRuleEmailResolutions');
  const activity = { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor' };
  const context = { activity, effectId: 'a'.repeat(64), index: 0, assertCurrent: async () => {} };
  const source = await resolveRuleEmailSource({ activity, canReadBoard: () => true,
    cache: { getCard: async () => ({ _id: 'card', boardId: 'board' }), getBoard: async () => ({ _id: 'board' }) } });
  context.plan = await prepareRulePlan({ ...context, selectRules: async () => [{ _id: 'rule', boardId: 'board', actionId: 'action', triggerId: 'trigger' }],
    readAction: async () => ({ _id: 'action', actionType: 'sendEmail' }) });
  const command = await ensureRuleEmailCommand({ ...context, commands,
    prepare: async () => ({ sourceBinding: source.binding, mail: { to: 'private@example.invalid', from: 'sender@example.invalid', subject: 'PRIVATE SUBJECT', text: 'PRIVATE BODY' } }) });
  const dispatch = { ...context, command, attempts, MailComposer: require(composer) };
  let sends = 0;
  await assert.rejects(dispatchRuleEmail({ ...dispatch, send: async () => { sends++; throw Error('ack lost'); } }));
  const attempt = await attempts.findOne({ _id: command._id });
  const recovery = { commands, resolutions, commandId: command._id, attemptId: attempt.attemptId,
    operator: 'Maintainer', evidence: 'verified-all-recipients-log-42', assertOffline: async () => {},
    attempts: { findOne: (...args) => attempts.findOne(...args), replaceOne: async () => { throw Error('interrupted'); } } };
  await assert.rejects(confirmAcceptedRuleEmail(recovery), /interrupted/);
  assert.equal(await resolutions.countDocuments({}), 1);
  const url = new URL(uri); url.pathname = `/${db.databaseName}`;
  const args = [require.resolve('../../releases/recover-rule-email.cjs'), '--command', command._id,
    '--attempt', attempt.attemptId, '--operator', recovery.operator, '--evidence', recovery.evidence, '--offline', '--confirm-accepted'];
  const result = await promisify(execFile)(process.execPath, args, { env: { ...process.env, MONGO_URL: url.toString() } });
  assert.equal(JSON.parse(result.stdout).status, 'confirmed-accepted');
  assert.equal(await dispatchRuleEmail({ ...dispatch, send: () => assert.fail('must not resend') }), command.invocationId);
  assert.equal(sends, 1);
  await assert.rejects(dispatchRuleEmail({ ...dispatch, assertCurrent: async () => { throw Error('source access revoked'); }, send: () => assert.fail('must not resend') }), /source access revoked/);
  const decision = await resolutions.findOne({});
  assert.doesNotMatch(JSON.stringify(decision), /private@example|sender@example|PRIVATE SUBJECT|PRIVATE BODY/);
  assert.equal((await commands.findOne({ _id: command._id })).checksum, command.checksum);
  await assert.rejects(confirmAcceptedRuleEmail({ ...recovery, attempts, evidence: 'conflicting-evidence' }), /decision-conflict/);
  assert.equal(await resolutions.countDocuments({}), 1);
});
