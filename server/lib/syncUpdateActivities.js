'use strict';
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { prepareSyncOperationMutation } = require('./syncOperationMutation');
const { persistSyncActivity } = require('./syncActivityPersistence');
const fail = () => { throw new Error('sync-update-activities-invalid'); };
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });

function activityRows(step, effectId, context) {
  const { before, after } = step;
  const { userId, username, listName, createdAt } = context;
  const base = { userId, boardId: after.boardId, cardId: after._id, listId: after.listId, swimlaneId: after.swimlaneId };
  const rows = [];
  const add = (key, fields) => {
    const receiptId = sha256(canonical([effectId, key]));
    rows.push({ receiptId, activity: { _id: `sync-update-${receiptId}`, ...base, ...fields, createdAt, modifiedAt: createdAt } });
  };
  // Match ordinary post-write activities, including empty description clears.
  if (!!before.archived !== !!after.archived) add('archived', {
    activityType: after.archived ? 'archivedCard' : 'restoredCard', listName, cardTitle: after.title });
  if (Object.hasOwn(after, 'title') && after.title !== (before.title || '')) add('title', {
    activityType: 'a-changedTitle', username, cardTitle: after.title, oldValue: before.title || '', value: after.title });
  if ((after.description || '') !== (before.description || '')) add('description', {
    activityType: 'a-changedDescription', username, cardTitle: after.title,
    oldValue: before.description || '', value: after.description || '' });
  const values = snapshot => new Map((snapshot.customFields || []).map(field => [field._id, field.value ?? null]));
  const old = values(before), next = values(after);
  for (const id of new Set([...old.keys(), ...next.keys()])) {
    const previous = old.get(id) ?? null, value = next.get(id) ?? null;
    if (canonical(previous) !== canonical(value)) add(`customField:${id}`, {
      customFieldId: id, activityType: value === null ? 'unsetCustomField' : 'setCustomField',
      ...(value === null ? {} : { value }) });
  }
  return rows;
}
function validateContext(context, step, effectId) {
  prepareSyncOperationMutation(step);
  if (step.kind === 'create' || typeof effectId !== 'string' || !/^[a-f0-9]{64}$/.test(effectId) ||
      !context || Object.keys(context).sort().join(',') !== 'createdAt,listName,userId,username' ||
      typeof context.userId !== 'string' || !context.userId ||
      !['username','listName'].every(key => typeof context[key] === 'string') ||
      !(context.createdAt instanceof Date) || !Number.isFinite(context.createdAt.getTime()) ||
      typeof step.after.swimlaneId !== 'string' || !step.after.swimlaneId || typeof step.after.title !== 'string') fail();
}
function prepareSyncUpdateActivities({ step, effectId, userId, username, createdAt, list }) {
  if (!list || list._id !== step.after?.listId || list.boardId !== step.after?.boardId) fail();
  const context = { userId, username, listName: list.title, createdAt };
  validateContext(context, step, effectId);
  const plan = { effectId, context, rows: activityRows(step, effectId, context) };
  validateSyncUpdateActivities(plan, step, effectId);
  return copy(plan);
}
function validateSyncUpdateActivities(plan, step, effectId) {
  if (!plan || Object.keys(plan).sort().join(',') !== 'context,effectId,rows' || plan.effectId !== effectId) fail();
  validateContext(plan.context, step, effectId);
  if (!Array.isArray(plan.rows) || canonical(plan.rows) !== canonical(activityRows(step, effectId, plan.context)) ||
      Buffer.byteLength(EJSON.stringify(plan)) > 1024 * 1024) fail();
  return true;
}
// Internal only. Normal hooks, feature flags and durable downstream adapters
// still need coordination before this is enabled in production Sync.
async function persistSyncUpdateActivities({ activities, plan, step, effectId, assertCurrent, completeDelivery }) {
  validateSyncUpdateActivities(plan, step, effectId);
  if (typeof assertCurrent !== 'function' || typeof completeDelivery !== 'function' ||
      !['findOneAsync','insertAsync'].every(key => typeof activities?.[key] === 'function')) fail();
  plan = copy(plan);
  for (const row of plan.rows) {
    await persistSyncActivity({ activities, activity: row.activity, effectId: row.receiptId, assertCurrent, completeDelivery });
  }
  await assertCurrent();
  return effectId;
}
module.exports = { prepareSyncUpdateActivities, validateSyncUpdateActivities, persistSyncUpdateActivities };
