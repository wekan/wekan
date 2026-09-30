'use strict';
const { EJSON } = require('bson');
const { validateSyncEffectPolicy, assertSyncEffectPolicy } = require('./syncEffectPolicy');
const { reuseWithinEvaluation } = require('./syncGuardWindow');
const { syncOperationEffectId, applySyncOperationStep } = require('./syncOperationApply');
const { createSyncHistoryPlanner, validateSyncFieldHistory, persistSyncFieldHistory } = require('./syncHistoryBatch');
const { prepareSyncCreationActivity, validateSyncCreationActivity, persistSyncCreationActivity } = require('./syncCreationActivity');
const { prepareSyncUpdateActivities, validateSyncUpdateActivities, persistSyncUpdateActivities } = require('./syncUpdateActivities');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-effects-invalid'); };

// Capture all display metadata before the journal begins applying cards.
// Context changes during replay must not rewrite an already persisted event.
function createSyncEffectPlanner({ userId, username, createdAt, list, swimlanes, redoRows = [], policy }) {
  policy = validateSyncEffectPolicy(policy);
  const captured = copy({ userId, username, createdAt, list, swimlanes });
  if (!captured.list || !Array.isArray(captured.swimlanes) || captured.swimlanes.length > 10000) fail();
  const lanes = new Map();
  for (const lane of captured.swimlanes) {
    if (!lane || typeof lane._id !== 'string' || !lane._id || lanes.has(lane._id) ||
        lane.boardId !== captured.list.boardId || typeof lane.title !== 'string') fail();
    lanes.set(lane._id, lane);
  }
  // History rows are linked when appended, not planned (syncHistoryBatch.js).
  const historyPlanner = createSyncHistoryPlanner({ userId, createdAt, redoRows });
  return (step, context) => {
    const effectId = syncOperationEffectId(context.operationId, context.index);
    // Validate activities first: a failed reference must not advance the
    // History planner and make a corrected retry of this index impossible.
    const activities = policy.activities ? (step.kind === 'create' ? prepareSyncCreationActivity : prepareSyncUpdateActivities)({
      ...captured, step, effectId, swimlane: lanes.get(step.after.swimlaneId) }) : null;
    const plan = { version: 2, policy: { ...policy }, history: historyPlanner(step, context), activities };
    validateSyncEffects(plan, step, effectId);
    return plan;
  };
}
function validateSyncEffects(plan, step, effectId) {
  if (!plan || ![1, 2].includes(plan.version) || Object.keys(plan).sort().join(',') !==
      (plan.version === 1 ? 'activities,history,version' : 'activities,history,policy,version')) fail();
  const policy = planPolicy(plan);
  validateSyncFieldHistory(plan.history, step, effectId);
  if (policy.activities) {
    (step.kind === 'create' ? validateSyncCreationActivity : validateSyncUpdateActivities)(plan.activities, step, effectId);
    const actor = step.kind === 'create' ? plan.activities.activity : plan.activities.context;
    if (plan.history.userId !== actor.userId || plan.history.rows.some(row => row.createdAt.getTime() !== actor.createdAt.getTime())) fail();
  } else if (plan.activities !== null) fail();
  if (Buffer.byteLength(EJSON.stringify(plan)) > 15 * 1024 * 1024) fail();
  return true;
}

function planPolicy(plan) {
  // Version-one plans predate policy capture and always include activities.
  return plan.version === 1 ? { activities: true, notifications: true } : validateSyncEffectPolicy(plan.policy);
}

// Internal coordinator: callers still supply durable rules/notification
// delivery and coordinate ordinary hooks. Changed flags pause the saved plan;
// replay never silently replaces its captured policy with current defaults.
function createEffectGuard({ history, activities, plan, step, effectId, assertCurrent, completeDelivery, readPolicy }) {
  validateSyncEffects(plan, step, effectId);
  const policy = planPolicy(plan);
  if (typeof assertCurrent !== 'function' || typeof readPolicy !== 'function' ||
      !['findOneAsync','insertAsync','updateAsync'].every(key => typeof history?.[key] === 'function') ||
      (policy.activities && (typeof completeDelivery !== 'function' ||
        !['findOneAsync','insertAsync'].every(key => typeof activities?.[key] === 'function')))) fail();
  return reuseWithinEvaluation(async () => {
    await assertCurrent();
    await assertSyncEffectPolicy(policy, readPolicy);
    await assertCurrent();
  });
}
async function persistSyncEffects(options) {
  const { history, activities, step, effectId, completeDelivery } = options;
  const plan = copy(options.plan);
  const policy = planPolicy(plan);
  const guard = createEffectGuard({ ...options, plan });
  await guard();
  await persistSyncFieldHistory({ history, plan: plan.history, assertCurrent: guard });
  if (policy.activities) {
    await (step.kind === 'create' ? persistSyncCreationActivity : persistSyncUpdateActivities)({
      activities, plan: plan.activities, step, effectId, assertCurrent: guard,
      completeDelivery: context => completeDelivery({ ...context, policy: { ...policy } }) });
  }
  await guard();
  return effectId;
}
// Apply one saved card unit only after validating its entire effect plan,
// persisted actor, live feature policy and all required adapters. Ordinary
// collection hooks and durable delivery remain the production caller's job.
async function applySyncEffectsStep({ cards, history, activities, step, effects, operationId, index,
  userId, assertCurrent, completeDelivery, readPolicy }) {
  const effectId = syncOperationEffectId(operationId, index);
  const plan = copy(effects), savedStep = copy(step);
  validateSyncEffects(plan, savedStep, effectId);
  if (typeof userId !== 'string' || !userId || plan.history.userId !== userId) fail();
  const options = { history, activities, plan, step: savedStep, effectId, assertCurrent, completeDelivery, readPolicy };
  const guard = createEffectGuard(options);
  return applySyncOperationStep({ cards, step: savedStep, operationId, index, assertCurrent: guard,
    completeEffects: () => persistSyncEffects(options) });
}
module.exports = { createSyncEffectPlanner, validateSyncEffects, persistSyncEffects, applySyncEffectsStep };
