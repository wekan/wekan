'use strict';
const { randomUUID } = require('node:crypto');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { ruleEmailRecipients } = require('./syncRuleEmailAcceptance');

// #2713, maintainer decision of 2026-09-30: partial or unknown SMTP acceptance
// is resolved by an administrator in Admin Panel -> Problems -> Recovery. The
// administrator resends to the unconfirmed recipients only, marks the attempt
// sent, or drops it. WeKan itself never resends an uncertain attempt.
//
// A decision is only allowed once the original send can no longer be in
// flight. One SMTP send is cancelled after MAIL_TOTAL_TIMEOUT_MS, at most five
// minutes (server/lib/smtpDeadline.js), and a lost email-slot lease aborts it
// sooner; ten minutes after the attempt started, nothing can still accept it.
const QUARANTINE_MS = 10 * 60 * 1000;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
const date = value => value instanceof Date && Number.isFinite(+value);
const fail = reason => { throw Object.assign(new Error(`rule-email-resolution-${reason}`), { reason }); };
const ATTEMPT_KEYS = {
  sending: '_id,attemptId,commandHash,invocationId,startedAt,state,version',
  sent: '_id,attemptId,commandHash,finishedAt,invocationId,startedAt,state,version',
  dropped: '_id,attemptId,commandHash,finishedAt,invocationId,startedAt,state,version',
};
const decisionId = (commandId, attemptId) => sha256(canonical(['rule-email-resolution', commandId, attemptId]));
const offlineDecisionId = (commandId, attemptId) => sha256(canonical(['rule-email-accepted', commandId, attemptId]));
const resendId = (commandId, attemptId, id) => sha256(canonical(['rule-email-resend', commandId, attemptId, id]));

function validAttempt(row) {
  return !!row && hash(row._id) && row.version === 1 && hash(row.commandHash) && hash(row.invocationId) &&
    uuid(row.attemptId) && date(row.startedAt) && Object.hasOwn(ATTEMPT_KEYS, row.state) &&
    (row.state === 'sending' || date(row.finishedAt)) &&
    Object.keys(row).sort().join(',') === ATTEMPT_KEYS[row.state];
}

// The addresses SMTP accepted, restricted to the command's own recipients.
// Never stores SMTP error text, which can carry credentials or other mailboxes.
function acceptedRecipients(recipients, result) {
  const accepted = Array.isArray(result?.accepted) ? result.accepted : [];
  const addresses = accepted.map(value => (typeof value === 'string' ? value : value?.address));
  return recipients.filter(address => addresses.includes(address));
}

async function recordRuleEmailOutcome({ outcomes, commandId, attemptId, recipients, result, now = () => new Date() }) {
  if (!hash(commandId) || !uuid(attemptId) || typeof outcomes?.updateOne !== 'function') fail('invalid');
  const accepted = acceptedRecipients(recipients, result);
  if (!accepted.length) return [];
  await outcomes.updateOne({ _id: commandId, attemptId },
    { $addToSet: { accepted: { $each: accepted } }, $set: { updatedAt: now() } }, { upsert: true });
  return accepted;
}

async function readState({ attempts, commands, outcomes, resolutions, commandId, MailComposer }) {
  if (!hash(commandId)) fail('invalid');
  const attempt = await attempts.findOne({ _id: commandId });
  if (!validAttempt(attempt)) fail('attempt-invalid');
  const command = await commands.findOne({ _id: commandId });
  if (!command || command.checksum !== attempt.commandHash || command.invocationId !== attempt.invocationId) {
    fail('command-changed');
  }
  // A terminal attempt's command may be compacted after 90 days
  // (server/lib/syncRuleEmailRetention.js): its mail is gone, and with it the
  // recipient list. Only terminal attempts are compacted, and none of them can
  // be resolved again, so an empty list is the honest answer.
  const compacted = command.compactReceiptVersion === 1;
  if (compacted && attempt.state === 'sending') fail('command-changed');
  const recipients = compacted ? [] : ruleEmailRecipients(command.mail, MailComposer);
  const outcome = await outcomes.findOne({ _id: commandId });
  const accepted = outcome?.attemptId === attempt.attemptId && Array.isArray(outcome.accepted)
    ? recipients.filter(address => outcome.accepted.includes(address)) : [];
  const [decision, offline] = await Promise.all([
    resolutions.findOne({ _id: decisionId(commandId, attempt.attemptId) }),
    resolutions.findOne({ _id: offlineDecisionId(commandId, attempt.attemptId) }),
  ]);
  const resends = await resolutions.find({ decision: 'resend', commandId, attemptId: attempt.attemptId })
    .sort({ startedAt: 1 }).toArray();
  return { attempt, command, recipients, accepted, decision, offline, resends, compacted };
}

function resendInFlight(resends, now) {
  return resends.some(row => row.state === 'sending' && +now - +row.startedAt < QUARANTINE_MS);
}

// What the administrator sees before deciding. Addresses are shown because
// the decision is about them; nothing else of the mail is returned.
async function ruleEmailRecoveryDetail({ now = () => new Date(), ...options }) {
  const state = await readState(options), time = now();
  const { attempt, recipients, accepted, resends } = state;
  const resolvableAt = new Date(+attempt.startedAt + QUARANTINE_MS);
  return {
    commandId: attempt._id, attemptId: attempt.attemptId, status: attempt.state === 'sending' ? 'unconfirmed' : attempt.state,
    startedAt: attempt.startedAt, finishedAt: attempt.finishedAt || null,
    recipients: recipients.map(address => ({ address, status: accepted.includes(address) ? 'accepted' : 'unconfirmed' })),
    decision: state.decision?.decision || (state.offline ? 'accepted-offline' : null),
    resends: resends.map(row => ({ state: row.state, startedAt: row.startedAt, recipients: row.recipients.length,
      accepted: Array.isArray(row.accepted) ? row.accepted.length : 0 })),
    resolvable: attempt.state === 'sending' && +time >= +resolvableAt && !resendInFlight(resends, time),
    resolvableAt, compacted: state.compacted,
  };
}

function assertResolvable(state, time) {
  if (state.attempt.state !== 'sending') fail('already-resolved');
  if (state.offline || state.decision) fail('already-resolved');
  if (+time - +state.attempt.startedAt < QUARANTINE_MS) fail('too-early');
  if (resendInFlight(state.resends, time)) fail('resend-in-flight');
}

// Replace the exact pending attempt; a concurrent change is never overwritten.
async function reconcileAttempt(attempts, attempt, state, finishedAt) {
  const target = { ...attempt, state, finishedAt };
  let error;
  try { await attempts.replaceOne(attempt, target); } catch (failure) { error = failure; }
  const saved = await attempts.findOne({ _id: attempt._id });
  if (canonical(saved) !== canonical(target)) throw error || fail('receipt-unconfirmed');
}

// Mark sent, or drop: one immutable decision per attempt, then the receipt.
async function resolveRuleEmailAttempt({ decision, operator, now = () => new Date(), ...options }) {
  if (!['mark-sent', 'drop'].includes(decision) || typeof operator !== 'string' || !operator || operator.length > 200) {
    fail('invalid');
  }
  const state = await readState(options), time = now();
  if (!date(time)) fail('clock-invalid');
  const { attempt } = state, target = decision === 'mark-sent' ? 'sent' : 'dropped';
  const result = { commandId: attempt._id, attemptId: attempt.attemptId, status: target };
  // The same decision replays: after an interruption it finishes the receipt,
  // after completion it changes nothing.
  if (state.decision?.decision === decision && attempt.state === target) return result;
  if (state.decision?.decision !== decision) {
    assertResolvable(state, time);
    const row = { _id: decisionId(attempt._id, attempt.attemptId), version: 1, decision,
      commandId: attempt._id, commandHash: attempt.commandHash, invocationId: attempt.invocationId,
      attemptId: attempt.attemptId, startedAt: attempt.startedAt, operator, decidedAt: time };
    row.checksum = sha256(canonical(row));
    let error;
    try { await options.resolutions.insertOne(row); } catch (failure) { error = failure; }
    const saved = await options.resolutions.findOne({ _id: row._id });
    if (!saved || saved.decision !== decision || saved.attemptId !== attempt.attemptId) throw error || fail('decision-conflict');
    state.decision = saved;
  }
  if (attempt.state !== 'sending') fail('already-resolved');
  await reconcileAttempt(options.attempts, attempt, target, state.decision.decidedAt);
  return result;
}

// Resend the captured mail, unchanged, to the unconfirmed recipients only.
// The headers keep every original recipient; the SMTP envelope narrows who
// receives this copy. The intent is recorded before SMTP, so a crash leaves a
// visible "sending" resend rather than a silent duplicate.
async function resendUnconfirmedRuleEmail({ operator, send, assertCurrent = async () => {}, now = () => new Date(), ...options }) {
  if (typeof operator !== 'string' || !operator || operator.length > 200 || typeof send !== 'function') fail('invalid');
  const state = await readState(options), time = now();
  if (!date(time)) fail('clock-invalid');
  assertResolvable(state, time);
  const { attempt, command, recipients } = state;
  const pending = recipients.filter(address => !state.accepted.includes(address));
  if (!pending.length) fail('nothing-to-resend');
  const envelopeFrom = new options.MailComposer(command.mail).compile().getEnvelope().from;
  const row = { _id: resendId(attempt._id, attempt.attemptId, randomUUID()), version: 1, decision: 'resend',
    commandId: attempt._id, attemptId: attempt.attemptId, operator, recipients: pending, state: 'sending', startedAt: time };
  await assertCurrent();
  await options.resolutions.insertOne(row);
  const saved = await options.resolutions.findOne({ _id: row._id });
  if (canonical(saved) !== canonical(row)) fail('resend-unconfirmed');
  await assertCurrent();
  let result;
  try {
    result = await send({ ...command.mail, envelope: { from: envelopeFrom, to: pending } });
  } catch (error) {
    // Leave the row "sending": whether SMTP accepted it is unknown.
    throw Object.assign(new Error('rule-email-resolution-resend-uncertain'), { reason: 'resend-uncertain' });
  }
  const accepted = await recordRuleEmailOutcome({ outcomes: options.outcomes, commandId: attempt._id,
    attemptId: attempt.attemptId, recipients: pending, result, now });
  const finishedAt = now();
  await options.resolutions.updateOne({ _id: row._id, state: 'sending' },
    { $set: { state: accepted.length === pending.length ? 'sent' : 'partial', accepted, finishedAt } });
  if (accepted.length === pending.length) await reconcileAttempt(options.attempts, attempt, 'sent', finishedAt);
  return { commandId: attempt._id, attemptId: attempt.attemptId,
    status: accepted.length === pending.length ? 'sent' : 'partial', accepted: accepted.length, pending: pending.length };
}

module.exports = {
  QUARANTINE_MS, decisionId, offlineDecisionId, validAttempt, acceptedRecipients,
  recordRuleEmailOutcome, ruleEmailRecoveryDetail, resolveRuleEmailAttempt, resendUnconfirmedRuleEmail,
};
