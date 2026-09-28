'use strict';
const { randomUUID } = require('node:crypto');
const { EJSON } = require('bson');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { validateRuleEmailCommand } = require('./syncRuleEmailCommand');
const { ruleEmailRecipients, confirmRuleEmailAcceptance } = require('./syncRuleEmailAcceptance');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
// The owner supplies the live journal/policy/configuration guard, operation
// lease and cancellable SMTP capacity slot. Never automatically repeat an
// existing sending attempt: a crash may have happened after SMTP acceptance.
async function dispatchRuleEmail({ command, plan, activity, effectId, index,
  attempts, MailComposer, send, assertCurrent, now = () => new Date() }) {
  command = validateRuleEmailCommand(command, { plan, activity, effectId, index });
  if (typeof send !== 'function' || typeof assertCurrent !== 'function' ||
      !['findOne', 'insertOne', 'replaceOne'].every(key => typeof attempts?.[key] === 'function')) {
    throw new Error('sync-rule-email-dispatch-invalid');
  }
  const date = () => {
    const value = now();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) throw new Error('sync-rule-email-clock-invalid');
    return new Date(value);
  };
  const base = { _id: command._id, version: 1, commandHash: command.checksum, invocationId: command.invocationId };
  const validate = row => {
    if (!row || Object.keys(base).some(key => row[key] !== base[key]) ||
        !['sending', 'sent'].includes(row.state) ||
        typeof row.attemptId !== 'string' || !/^[a-f0-9-]{36}$/.test(row.attemptId) ||
        !(row.startedAt instanceof Date) || !Number.isFinite(row.startedAt.getTime()) ||
        (row.state === 'sent' && (!(row.finishedAt instanceof Date) || !Number.isFinite(row.finishedAt.getTime()))) ||
        Object.keys(row).sort().join(',') !== (row.state === 'sent'
          ? '_id,attemptId,commandHash,finishedAt,invocationId,startedAt,state,version'
          : '_id,attemptId,commandHash,invocationId,startedAt,state,version')) {
      throw new Error('sync-rule-email-attempt-invalid');
    }
    return row;
  };
  const read = async () => {
    await assertCurrent();
    const row = await attempts.findOne({ _id: base._id });
    await assertCurrent();
    return row ? validate(row) : null;
  };
  const existing = await read();
  if (existing) {
    if (existing.state === 'sent') return command.invocationId;
    throw new Error('sync-rule-email-delivery-uncertain');
  }
  const recipients = ruleEmailRecipients(command.mail, MailComposer);
  const pending = { ...base, state: 'sending', attemptId: randomUUID(), startedAt: date() };
  await assertCurrent();
  let failure;
  try { await attempts.insertOne(copy(pending)); } catch (error) { failure = error; }
  const inserted = await read();
  if (!inserted) throw failure || new Error('sync-rule-email-attempt-unconfirmed');
  if (canonical(inserted) !== canonical(pending)) throw new Error('sync-rule-email-delivery-uncertain');
  await assertCurrent();
  // Any rejection, partial acceptance or ownership loss retains sending state.
  // Do not persist SMTP error text, which can expose addresses or credentials.
  const result = await send(copy(command.mail), { assertCurrent });
  confirmRuleEmailAcceptance(recipients, result);
  await assertCurrent();
  const sent = { ...pending, state: 'sent', finishedAt: date() };
  failure = undefined;
  try { await attempts.replaceOne(pending, copy(sent)); } catch (error) { failure = error; }
  const stored = await read();
  if (!stored || canonical(stored) !== canonical(sent)) {
    throw failure || new Error('sync-rule-email-completion-unconfirmed');
  }
  return command.invocationId;
}
module.exports = { dispatchRuleEmail };
