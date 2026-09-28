'use strict';
const { EJSON } = require('bson');
const { syncOperationEffectId } = require('./syncOperationApply');
const { createSyncHistoryPlanner, validateSyncFieldHistory, persistSyncFieldHistory } = require('./syncHistoryBatch');
const { prepareSyncCreationActivity, validateSyncCreationActivity, persistSyncCreationActivity } = require('./syncCreationActivity');
const { prepareSyncUpdateActivities, validateSyncUpdateActivities, persistSyncUpdateActivities } = require('./syncUpdateActivities');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-effects-invalid'); };

// Capture all display metadata before the journal begins applying cards.
// Context changes during replay must not rewrite an already persisted event.
function createSyncEffectPlanner({ userId, username, createdAt, list, swimlanes, previousHash = null, redoRows = [] }) {
  const captured = copy({ userId, username, createdAt, list, swimlanes });
  if (!captured.list || !Array.isArray(captured.swimlanes) || captured.swimlanes.length > 10000) fail();
  const lanes = new Map();
  for (const lane of captured.swimlanes) {
    if (!lane || typeof lane._id !== 'string' || !lane._id || lanes.has(lane._id) ||
        lane.boardId !== captured.list.boardId || typeof lane.title !== 'string') fail();
    lanes.set(lane._id, lane);
  }
  const historyPlanner = createSyncHistoryPlanner({ userId, createdAt, previousHash, redoRows });
  return (step, context) => {
    const effectId = syncOperationEffectId(context.operationId, context.index);
    // Validate activities first: a failed reference must not advance the
    // History planner and make a corrected retry of this index impossible.
    const activities = (step.kind === 'create' ? prepareSyncCreationActivity : prepareSyncUpdateActivities)({
      ...captured, step, effectId, swimlane: lanes.get(step.after.swimlaneId) });
    const plan = { version: 1, history: historyPlanner(step, context), activities };
    validateSyncEffects(plan, step, effectId);
    return plan;
  };
}
function validateSyncEffects(plan, step, effectId) {
  if (!plan || Object.keys(plan).sort().join(',') !== 'activities,history,version' || plan.version !== 1) fail();
  validateSyncFieldHistory(plan.history, step, effectId);
  (step.kind === 'create' ? validateSyncCreationActivity : validateSyncUpdateActivities)(plan.activities, step, effectId);
  const actor = step.kind === 'create' ? plan.activities.activity : plan.activities.context;
  if (plan.history.userId !== actor.userId || plan.history.rows.some(row => row.createdAt.getTime() !== actor.createdAt.getTime()) ||
      Buffer.byteLength(EJSON.stringify(plan)) > 15 * 1024 * 1024) fail();
  return true;
}

// Internal coordinator: production callers still must supply durable delivery,
// coordinate ordinary hooks and feature flags, and hold the required leases.
async function persistSyncEffects({ history, activities, plan, step, effectId, assertCurrent, completeDelivery }) {
  validateSyncEffects(plan, step, effectId);
  if (typeof assertCurrent !== 'function' || typeof completeDelivery !== 'function' ||
      !['findOneAsync','insertAsync','updateAsync'].every(key => typeof history?.[key] === 'function') ||
      !['findOneAsync','insertAsync'].every(key => typeof activities?.[key] === 'function')) fail();
  // Neither adapter may mutate the other adapter's later verification inputs.
  plan = copy(plan);
  await assertCurrent();
  await persistSyncFieldHistory({ history, plan: plan.history, assertCurrent });
  await (step.kind === 'create' ? persistSyncCreationActivity : persistSyncUpdateActivities)({
    activities, plan: plan.activities, step, effectId, assertCurrent, completeDelivery });
  await assertCurrent();
  return effectId;
}
module.exports = { createSyncEffectPlanner, validateSyncEffects, persistSyncEffects };
