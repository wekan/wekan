'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-rule-email-command-invalid'); };
const exactKeys = (value, expected) => value && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === expected.split(',').sort().join(',');
const commandId = invocationId => sha256(canonical(['sync-rule-email', invocationId]));
function validateMail(mail) {
  if (!mail || Array.isArray(mail) || typeof mail !== 'object' ||
      Object.keys(mail).some(key => !['to', 'from', 'subject', 'text', 'html', 'replyTo'].includes(key)) ||
      !['to', 'from', 'subject', 'text'].every(key => typeof mail[key] === 'string') ||
      !mail.to.trim() || !mail.from.trim()) fail();
  for (const key of ['to', 'from', 'subject', 'replyTo']) {
    if (!Object.hasOwn(mail, key)) continue;
    if (typeof mail[key] !== 'string' || mail[key].length > 10000 || /[\r\n\0]/.test(mail[key])) fail();
  }
  if (Object.hasOwn(mail, 'html') && typeof mail.html !== 'string') fail();
  if (calculateObjectSize(mail) > 1024 * 1024) fail();
}
// Preparation only: no SMTP, enqueue, or rule-stage completion. The caller
// must hold the operation lease and prepare fully localized transport fields.
// The complete parent plan is required so an invocation cannot be substituted
// under the same ID. The first persisted recipient/content wins on replay.
async function ensureRuleEmailCommand({ commands, plan, activity, effectId, index, prepare, assertCurrent }) {
  plan = copy(plan); activity = copy(activity);
  validateRulePlan(plan, activity, effectId);
  if (!Number.isSafeInteger(index) || index < 0 || index >= plan.actions.length ||
      plan.actions[index].action?.actionType !== 'sendEmail' || typeof prepare !== 'function' ||
      typeof assertCurrent !== 'function' || typeof commands?.findOne !== 'function' ||
      typeof commands?.insertOne !== 'function') fail();
  const invocation = plan.actions[index];
  const identity = { _id: commandId(invocation.id), version: 1, kind: 'rule-email',
    invocationId: invocation.id, planId: planId(effectId, activity._id), effectId,
    planHash: sha256(canonical(plan)), activityHash: plan.activityHash,
    actorId: plan.actorId, boardId: plan.boardId, cardId: plan.cardId };
  const validate = row => {
    if (!exactKeys(row, '_id,version,kind,invocationId,planId,effectId,planHash,activityHash,actorId,boardId,cardId,mail,checksum') ||
        Object.keys(identity).some(key => row[key] !== identity[key])) fail();
    validateMail(row.mail);
    if (row.checksum !== sha256(canonical({ ...identity, mail: row.mail }))) fail();
    return copy(row);
  };
  const read = async () => {
    await assertCurrent();
    const row = await commands.findOne({ _id: identity._id });
    await assertCurrent();
    return row ? validate(row) : null;
  };
  let command = await read();
  if (!command) {
    const mail = copy(await prepare({ activity: copy(activity), invocation: copy(invocation), assertCurrent }));
    validateMail(mail);
    const candidate = { ...identity, mail };
    candidate.checksum = sha256(canonical(candidate));
    await assertCurrent();
    let failure;
    try { await commands.insertOne(copy(candidate)); } catch (error) { failure = error; }
    command = await read();
    if (!command) throw failure || new Error('sync-rule-email-command-unconfirmed');
  }
  await assertCurrent();
  return command;
}
module.exports = { ensureRuleEmailCommand, commandId };
