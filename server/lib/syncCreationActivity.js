'use strict';
const { EJSON } = require('bson');
const { persistSyncActivity } = require('./syncActivityPersistence');
const { cardCreationActivity } = require('../../models/lib/cardCreationActivity');
const { prepareSyncOperationMutation } = require('./syncOperationMutation');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-creation-activity-invalid'); };
const text = value => typeof value === 'string' && value.length > 0;

function prepareSyncCreationActivity({ step, effectId, userId, createdAt, list, swimlane }) {
  prepareSyncOperationMutation(step);
  if (step.kind !== 'create' || !list || !swimlane ||
      list._id !== step.after.listId || swimlane._id !== step.after.swimlaneId ||
      list.boardId !== step.after.boardId || swimlane.boardId !== step.after.boardId) fail();
  const activity = { _id: `sync-create-${effectId}`,
    ...cardCreationActivity(userId, step.after, list, swimlane), createdAt, modifiedAt: createdAt };
  const plan = { effectId, activity };
  validatePlan(plan);
  return copy(plan);
}
function validatePlan(plan) {
  if (!plan || Object.keys(plan).sort().join(',') !== 'activity,effectId' ||
      typeof plan.effectId !== 'string' || !/^[a-f0-9]{64}$/.test(plan.effectId)) fail();
  const a = plan.activity;
  if (!a || Object.keys(a).sort().join(',') !== '_id,activityType,boardId,cardId,cardTitle,createdAt,listId,listName,modifiedAt,swimlaneId,swimlaneName,userId' ||
      a._id !== `sync-create-${plan.effectId}` || a.activityType !== 'createCard' ||
      !['boardId','cardId','listId','swimlaneId','userId'].every(key => text(a[key])) ||
      !['cardTitle','listName','swimlaneName'].every(key => typeof a[key] === 'string') ||
      !(a.createdAt instanceof Date) || !Number.isFinite(a.createdAt.getTime()) ||
      !(a.modifiedAt instanceof Date) || a.modifiedAt.getTime() !== a.createdAt.getTime() ||
      Buffer.byteLength(EJSON.stringify(plan)) > 1024 * 1024) fail();
}
function validateSyncCreationActivity(plan, step, effectId) {
  validatePlan(plan);
  const a = plan.activity;
  const expected = prepareSyncCreationActivity({ step, effectId, userId: a.userId, createdAt: a.createdAt,
    list: { _id: a.listId, boardId: a.boardId, title: a.listName },
    swimlane: { _id: a.swimlaneId, boardId: a.boardId, title: a.swimlaneName } });
  if (canonical(expected) !== canonical(plan)) fail();
  return true;
}
// Internal only: an application adapter must coordinate ordinary hooks and
// activity feature flags. completeDelivery must durably acknowledge rules and
// notifications, including a retry after the activity itself was inserted.
async function persistSyncCreationActivity({ activities, plan, assertCurrent, completeDelivery }) {
  validatePlan(plan);
  if (typeof assertCurrent !== 'function' || typeof completeDelivery !== 'function' ||
      !['findOneAsync','insertAsync'].every(key => typeof activities?.[key] === 'function')) fail();
  return persistSyncActivity({ activities, activity: plan.activity, effectId: plan.effectId, assertCurrent, completeDelivery });
}
module.exports = { prepareSyncCreationActivity, validateSyncCreationActivity, persistSyncCreationActivity };
