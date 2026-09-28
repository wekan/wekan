'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const { validateRuleEmailAttachments } = require('./ruleEmailAttachments');
const { validateRuleEmailSourceBinding } = require('./ruleEmailSource');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-rule-email-command-invalid'); };
const exactKeys = (value, expected) => value && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === expected.split(',').sort().join(',');
const commandId = invocationId => sha256(canonical(['sync-rule-email', invocationId]));
function validateMail(mail) {
  if (!mail || Array.isArray(mail) || typeof mail !== 'object' ||
      Object.keys(mail).some(key => !['to', 'from', 'subject', 'text', 'html', 'replyTo', 'attachments'].includes(key)) ||
      !['to', 'from', 'subject', 'text'].every(key => typeof mail[key] === 'string') ||
      !mail.to.trim() || !mail.from.trim()) fail();
  for (const key of ['to', 'from', 'subject', 'replyTo']) {
    if (!Object.hasOwn(mail, key)) continue;
    if (typeof mail[key] !== 'string' || mail[key].length > 10000 || /[\r\n\0]/.test(mail[key])) fail();
  }
  if (Object.hasOwn(mail, 'html') && typeof mail.html !== 'string') fail();
  const { attachments, ...body } = mail;
  if (calculateObjectSize(body) > 1024 * 1024) fail();
  if (Object.hasOwn(mail, 'attachments')) {
    if (!Array.isArray(attachments) || !attachments.length) fail();
    try { validateRuleEmailAttachments(attachments); } catch (_) { fail(); }
  }
  if (calculateObjectSize(mail) > 12 * 1024 * 1024) fail();
}
function commandIdentity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  if (!Number.isSafeInteger(index) || index < 0 || index >= plan.actions.length ||
      plan.actions[index].action?.actionType !== 'sendEmail') fail();
  const invocation = plan.actions[index];
  return { _id: commandId(invocation.id), version: 1, kind: 'rule-email',
    invocationId: invocation.id, planId: planId(effectId, activity._id), effectId,
    planHash: sha256(canonical(plan)), activityHash: plan.activityHash,
    actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId };
}
function validateRuleEmailCommand(row, context) {
  const identity = commandIdentity(context);
  const bound = row?.version === 2;
  if (bound) identity.version = 2;
  if (!exactKeys(row, '_id,version,kind,invocationId,planId,effectId,planHash,activityHash,actorId,boardId,cardId,mail,checksum' + (bound ? ',sourceBinding' : '')) ||
      Object.keys(identity).some(key => row[key] !== identity[key])) fail();
  if (calculateObjectSize(row) > 15 * 1024 * 1024) fail();
  validateMail(row.mail);
  if (bound) {
    try { validateRuleEmailSourceBinding(row.sourceBinding, context.activity); } catch (_) { fail(); }
  }
  if (row.checksum !== sha256(canonical({ ...identity, mail: row.mail,
    ...(bound ? { sourceBinding: row.sourceBinding } : {}) }))) fail();
  return copy(row);
}
// Preparation only: no SMTP, enqueue, or rule-stage completion. The caller
// holds the operation lease and prepares fully localized transport fields.
async function ensureRuleEmailCommand({ commands, plan, activity, effectId, index, prepare, assertCurrent }) {
  plan = copy(plan); activity = copy(activity);
  const context = { plan, activity, effectId, index }, identity = commandIdentity(context);
  if (typeof prepare !== 'function' || typeof assertCurrent !== 'function' ||
      typeof commands?.findOne !== 'function' || typeof commands?.insertOne !== 'function') fail();
  const invocation = plan.actions[index];
  const validate = row => validateRuleEmailCommand(row, context);
  const read = async () => {
    await assertCurrent();
    const row = await commands.findOne({ _id: identity._id });
    await assertCurrent();
    return row ? validate(row) : null;
  };
  let command = await read();
  if (!command) {
    const prepared = copy(await prepare({ activity: copy(activity), invocation: copy(invocation), assertCurrent }));
    const bound = exactKeys(prepared, 'mail,sourceBinding');
    const candidate = bound
      ? { ...identity, version: 2, mail: prepared.mail, sourceBinding: prepared.sourceBinding }
      : { ...identity, mail: prepared };
    candidate.checksum = sha256(canonical(candidate));
    validate(candidate);
    await assertCurrent();
    let failure;
    try { await commands.insertOne(copy(candidate)); } catch (error) { failure = error; }
    command = await read();
    if (!command) throw failure || new Error('sync-rule-email-command-unconfirmed');
  }
  await assertCurrent();
  return command;
}
module.exports = { ensureRuleEmailCommand, validateRuleEmailCommand, commandId };
