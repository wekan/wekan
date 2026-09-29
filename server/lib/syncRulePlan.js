'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { notificationActivityIdentity } = require('./syncNotificationPlan');
const { ruleActionIds } = require('../../models/lib/ruleParts');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const keys = (value, expected) => value && !Array.isArray(value) && Object.keys(value).sort().join(',') === expected;
const fail = () => { throw new Error('sync-rule-plan-invalid'); };
const planId = (effectId, activityId) => sha256(canonical(['sync-rules', effectId, activityId]));
const actionId = (id, index) => sha256(canonical(['sync-rule-action', id, index]));
function identity(activity, effectId) {
  if (!hash(effectId)) fail();
  return { ...notificationActivityIdentity(activity), effectId };
}
function validateAction(row, index, activity, effectId) {
  const rule = row?.rule, action = row?.action;
  if (!keys(row, 'action,id,rule') || row.id !== actionId(planId(effectId, activity._id), index) ||
      !rule || Array.isArray(rule) || !text(rule._id) || rule.boardId !== activity.boardId ||
      !text(rule.actionId) || !text(rule.triggerId) || rule.enabled === false ||
      (action !== null && (!action || Array.isArray(action) || !ruleActionIds(rule).includes(action._id) ||
        !text(action.actionType)))) fail();
}
function validateRulePlan(plan, activity, effectId) {
  const expected = identity(activity, effectId);
  if (!keys(plan, 'actions,activityHash,activityId,actorId,boardId,cardId,effectId,version') || plan.version !== 1 ||
      Object.keys(expected).some(key => plan[key] !== expected[key]) || !Array.isArray(plan.actions) || plan.actions.length > 1000) fail();
  for (let index = 0; index < plan.actions.length; index++) {
    validateAction(plan.actions[index], index, activity, effectId);
  }
  if (calculateObjectSize(plan) > 14 * 1024 * 1024) fail();
  return plan;
}
// Capture the entire ordered selection before fetching actions. Duplicate rules
// remain duplicate invocations, as in ordinary executeRules; IDs use ordinals.
// A rule with several actions (models/lib/ruleParts.js) saves one row per
// action, in order. A missing action is an explicit saved no-op, not a chance
// to select it later.
async function prepareRulePlan({ activity, effectId, selectRules, readAction, assertCurrent }) {
  const saved = copy(activity), expected = identity(saved, effectId);
  if (![selectRules, readAction, assertCurrent].every(value => typeof value === 'function')) fail();
  await assertCurrent();
  const selected = copy(await selectRules(copy(saved)));
  if (!Array.isArray(selected) || selected.length > 1000) fail();
  const plan = { version: 1, ...expected, actions: [] };
  let bytes = calculateObjectSize(plan);
  let index = 0;
  for (const rule of selected) {
    if (!rule || !text(rule.actionId)) fail();
    for (const ruleActionId of ruleActionIds(rule)) {
      if (index >= 1000) fail();
      await assertCurrent();
      const action = await readAction(ruleActionId);
      // A missing action is saved as that action's no-op, not the rule's.
      const savedAction = action == null ? null : copy(action);
      if (savedAction && savedAction._id !== ruleActionId) fail();
      const row = { id: actionId(planId(effectId, saved._id), index), rule, action: savedAction };
      validateAction(row, index, saved, effectId);
      bytes += calculateObjectSize(row) + 32;
      if (bytes > 14 * 1024 * 1024) fail();
      plan.actions.push(row);
      index += 1;
    }
  }
  await assertCurrent();
  validateRulePlan(plan, saved, effectId);
  return copy(plan);
}
async function ensureRulePlan({ plans, activity, effectId, build, assertCurrent }) {
  activity = copy(activity); identity(activity, effectId);
  if (typeof build !== 'function' || typeof assertCurrent !== 'function') fail();
  const _id = planId(effectId, activity._id);
  const read = async () => {
    const row = await plans.findOne({ _id });
    if (!row) return null;
    if (!keys(row, '_id,checksum,plan')) fail();
    validateRulePlan(row.plan, activity, effectId);
    if (row.checksum !== sha256(canonical(row.plan))) fail();
    return copy(row.plan);
  };
  await assertCurrent();
  let plan = await read();
  if (!plan) {
    const candidate = copy(await build(copy(activity)));
    validateRulePlan(candidate, activity, effectId);
    await assertCurrent();
    let failure;
    try { await plans.insertOne({ _id, plan: candidate, checksum: sha256(canonical(candidate)) }); }
    catch (error) { failure = error; }
    plan = await read();
    if (!plan) throw failure || new Error('sync-rule-plan-unconfirmed');
  }
  await assertCurrent();
  return plan;
}
module.exports = { prepareRulePlan, validateRulePlan, ensureRulePlan, planId, actionId };
