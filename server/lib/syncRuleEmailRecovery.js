'use strict';
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
const date = value => value instanceof Date && Number.isFinite(+value);
const label = (value, max) => typeof value === 'string' && value.trim() === value && value.length > 0 && value.length <= max && !/[\r\n\0]/.test(value);
const fail = reason => { throw new Error(`sync-rule-email-recovery-${reason}`); };

// Offline only: the operator has independently verified acceptance for EVERY
// recipient. Never infer that from age, send mail, change content or reset an
// attempt to make it retryable. The immutable decision precedes receipt repair.
async function confirmAcceptedRuleEmail({ attempts, commands, resolutions, commandId, attemptId,
  operator, evidence, assertOffline, now = () => new Date() }) {
  if (!hash(commandId) || !uuid(attemptId) || !label(operator, 200) || !label(evidence, 500) ||
      typeof assertOffline !== 'function') fail('invalid');
  await assertOffline();
  const readAttempt = async () => {
    await assertOffline();
    const row = await attempts.findOne({ _id: commandId });
    await assertOffline();
    if (!row || row._id !== commandId || row.version !== 1 || row.attemptId !== attemptId ||
        !hash(row.commandHash) || !hash(row.invocationId) || !date(row.startedAt) ||
        !['sending', 'sent'].includes(row.state) ||
        (row.state === 'sent' && !date(row.finishedAt)) ||
        Object.keys(row).sort().join(',') !== (row.state === 'sent'
          ? '_id,attemptId,commandHash,finishedAt,invocationId,startedAt,state,version'
          : '_id,attemptId,commandHash,invocationId,startedAt,state,version')) fail('attempt-changed');
    return row;
  };
  const attempt = await readAttempt();
  const command = await commands.findOne({ _id: commandId }, { projection: { _id: 1, checksum: 1, invocationId: 1 } });
  await assertOffline();
  if (!command || command._id !== commandId || command.checksum !== attempt.commandHash || command.invocationId !== attempt.invocationId) fail('command-changed');
  const base = { _id: sha256(canonical(['rule-email-accepted', commandId, attemptId])), version: 1,
    decision: 'accepted', commandId, commandHash: attempt.commandHash, invocationId: attempt.invocationId,
    attemptId, startedAt: attempt.startedAt, operator, evidence };
  const validate = row => {
    if (!row || !date(row.confirmedAt) || +row.confirmedAt < +attempt.startedAt ||
        Object.keys(row).sort().join(',') !== [...Object.keys(base), 'confirmedAt', 'checksum'].sort().join(',') ||
        Object.entries(base).some(([key, value]) => canonical(row[key]) !== canonical(value)) ||
        row.checksum !== sha256(canonical({ ...base, confirmedAt: row.confirmedAt }))) fail('decision-conflict');
    return row;
  };
  const readDecision = async () => {
    await assertOffline();
    const row = await resolutions.findOne({ _id: base._id });
    await assertOffline();
    return row ? validate(row) : null;
  };
  // An online administrator decision (#2713) for this attempt excludes this one.
  await assertOffline();
  const onlineId = sha256(canonical(['rule-email-resolution', commandId, attemptId]));
  if ((await resolutions.findOne({ _id: onlineId }))?._id === onlineId) fail('decision-conflict');
  let decision = await readDecision();
  if (!decision && attempt.state === 'sent') return { commandId, attemptId, status: 'already-sent' };
  if (!decision) {
    const confirmedAt = now();
    if (!date(confirmedAt) || +confirmedAt < +attempt.startedAt) fail('clock-invalid');
    const candidate = { ...base, confirmedAt };
    candidate.checksum = sha256(canonical(candidate));
    await assertOffline();
    let error;
    try { await resolutions.insertOne(candidate); } catch (failure) { error = failure; }
    decision = await readDecision();
    if (!decision) throw error || new Error('sync-rule-email-recovery-decision-unconfirmed');
  }
  const { finishedAt, ...identity } = attempt;
  const pending = { ...identity, state: 'sending' };
  const sent = { ...pending, state: 'sent', finishedAt: decision.confirmedAt };
  const current = await readAttempt();
  if (canonical(current) !== canonical(sent)) {
    if (canonical(current) !== canonical(pending)) fail('attempt-changed');
    await assertOffline();
    let error;
    try { await attempts.replaceOne(pending, sent); } catch (failure) { error = failure; }
    const saved = await readAttempt();
    if (canonical(saved) !== canonical(sent)) throw error || new Error('sync-rule-email-recovery-receipt-unconfirmed');
  }
  await readDecision();
  return { commandId, attemptId, resolutionId: base._id, status: 'confirmed-accepted' };
}
module.exports = { confirmAcceptedRuleEmail };
