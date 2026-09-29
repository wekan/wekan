'use strict';
const { randomUUID } = require('node:crypto');
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan } = require('./syncRulePlan');
const { validateRuleEmailCommand } = require('./syncRuleEmailCommand');

// Legacy rule email commands, maintainer decision of 2026-09-30: nothing runs
// them automatically. A command is legacy when it carries no evidence of which
// source supplied its content (no sourceBinding), or when it includes card
// Details and its binding predates the related-source chain (version < 5).
// Dispatch refuses both (server/lib/ruleEmailSource.js). An administrator
// either re-binds one - its content is RECAPTURED from the current source
// after a fresh access check, because pairing the old content with new
// evidence would misattribute it - or discards it, which records a dropped
// attempt so the rule stage completes without mail.
const PAGE_SIZE = 10, SCAN_LIMIT = 1000;
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const fail = reason => { throw Object.assign(new Error(`rule-email-legacy-${reason}`), { reason }); };
const auditId = (commandId, checksum) => sha256(canonical(['rule-email-legacy', commandId, checksum]));

function invocationOf(plan, invocationId) {
  const index = plan.actions.findIndex(row => row.id === invocationId);
  return index < 0 ? null : { index, invocation: plan.actions[index] };
}

function legacyReason(command, invocation) {
  if (!command.sourceBinding) return 'unbound';
  if (invocation?.action?.includeCardDetails === true && command.sourceBinding.version < 5) return 'details-snapshot';
  return null;
}

async function readPlan(plans, command) {
  const row = await plans.findOne({ _id: command.planId });
  if (!row || row.checksum !== sha256(canonical(row.plan))) return null;
  return row.plan;
}

// What the administrator reviews: where it came from and what it would send.
async function listLegacyRuleEmailCommands({ commands, plans, attempts, page = 0 }) {
  if (!Number.isSafeInteger(page) || page < 0) fail('invalid');
  const candidates = await commands.find({ $or: [{ sourceBinding: { $exists: false } }, { 'sourceBinding.version': { $lt: 5 } }] },
    { projection: { _id: 1, planId: 1, invocationId: 1, boardId: 1, cardId: 1, sourceBinding: 1, checksum: 1,
      'mail.to': 1, 'mail.subject': 1 } }).sort({ _id: 1 }).limit(SCAN_LIMIT).toArray();
  const rows = [];
  for (const command of candidates) {
    if (await attempts.findOne({ _id: command._id }, { projection: { _id: 1 } })) continue;
    const plan = await readPlan(plans, command);
    const found = plan && invocationOf(plan, command.invocationId);
    const reason = legacyReason(command, found?.invocation);
    if (!reason) continue;
    rows.push({ commandId: command._id, boardId: command.boardId, cardId: command.cardId, reason,
      to: command.mail?.to || '', subject: command.mail?.subject || '', rebindable: !!found });
  }
  page = Math.min(page, Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1));
  return { total: rows.length, page, pageSize: PAGE_SIZE, rows: rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    truncated: candidates.length === SCAN_LIMIT };
}

async function loadLegacy({ commands, plans, attempts, commandId, readActivity }) {
  if (!hash(commandId)) fail('invalid');
  const command = await commands.findOne({ _id: commandId });
  if (!command) fail('missing');
  if (await attempts.findOne({ _id: commandId })) fail('attempt-exists');
  const plan = await readPlan(plans, command);
  const found = plan && invocationOf(plan, command.invocationId);
  const reason = legacyReason(command, found?.invocation);
  if (!command.sourceBinding || reason) return { command, plan, found, reason: reason || 'unbound' };
  fail('not-legacy');
}

async function writeAudit(resolutions, row) {
  let error;
  try { await resolutions.insertOne(row); } catch (failure) { error = failure; }
  const saved = await resolutions.findOne({ _id: row._id });
  if (!saved || saved.decision !== row.decision) throw error || fail('audit-unconfirmed');
  return saved;
}

// Recapture from the current source. `assertAccess` re-checks the actor, the
// board and the rule configuration now; `prepare` is the ordinary capture
// (RulesHelper.prepareEmailCommand), which binds the source it read.
async function rebindLegacyRuleEmailCommand({ commands, plans, attempts, resolutions, commandId, operator,
  readActivity, assertAccess, prepare, now = () => new Date() }) {
  if (typeof operator !== 'string' || !operator || operator.length > 200 ||
      ![readActivity, assertAccess, prepare].every(fn => typeof fn === 'function')) fail('invalid');
  const { command, plan, found } = await loadLegacy({ commands, plans, attempts, commandId });
  if (!found) fail('plan-unavailable');
  const activity = await readActivity(plan.activityId);
  if (!activity) fail('source-unavailable');
  try { validateRulePlan(plan, activity, command.effectId); } catch (_) { fail('source-changed'); }
  await assertAccess({ activity, invocation: found.invocation, command });
  const prepared = copy(await prepare(activity, found.invocation.action));
  if (!prepared?.sourceBinding || !prepared.mail) fail('source-unavailable');
  if (found.invocation.action?.includeCardDetails === true && prepared.sourceBinding.version < 5) fail('source-unavailable');
  const context = { plan, activity, effectId: command.effectId, index: found.index };
  const { checksum, mail, sourceBinding, ...identity } = command;
  const next = { ...identity, version: 2, mail: prepared.mail, sourceBinding: prepared.sourceBinding };
  next.checksum = sha256(canonical({ ...next }));
  validateRuleEmailCommand(next, context);
  await assertAccess({ activity, invocation: found.invocation, command });
  await writeAudit(resolutions, { _id: auditId(command._id, command.checksum), version: 1, decision: 'legacy-rebind',
    commandId: command._id, previousChecksum: command.checksum, checksum: next.checksum, operator, decidedAt: now() });
  let error;
  try { await commands.replaceOne({ _id: command._id, checksum: command.checksum }, next); } catch (failure) { error = failure; }
  const saved = await commands.findOne({ _id: command._id });
  if (!saved || saved.checksum !== next.checksum) throw error || fail('command-changed');
  return { commandId: command._id, status: 'rebound' };
}

// Discard: record a dropped attempt, so dispatch completes without mail and
// the command is never sent. The command itself stays as evidence.
async function discardLegacyRuleEmailCommand({ commands, plans, attempts, resolutions, commandId, operator, now = () => new Date() }) {
  if (typeof operator !== 'string' || !operator || operator.length > 200) fail('invalid');
  const { command } = await loadLegacy({ commands, plans, attempts, commandId });
  const time = now();
  await writeAudit(resolutions, { _id: auditId(command._id, command.checksum), version: 1, decision: 'legacy-discard',
    commandId: command._id, previousChecksum: command.checksum, operator, decidedAt: time });
  const attempt = { _id: command._id, version: 1, commandHash: command.checksum, invocationId: command.invocationId,
    attemptId: randomUUID(), state: 'dropped', startedAt: time, finishedAt: time };
  let error;
  try { await attempts.insertOne(attempt); } catch (failure) { error = failure; }
  const saved = await attempts.findOne({ _id: command._id });
  if (!saved || saved.state !== 'dropped' || saved.commandHash !== command.checksum) throw error || fail('attempt-exists');
  return { commandId: command._id, status: 'discarded' };
}

module.exports = { listLegacyRuleEmailCommands, rebindLegacyRuleEmailCommand, discardLegacyRuleEmailCommand, legacyReason };
