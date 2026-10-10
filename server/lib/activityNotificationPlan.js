'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { idFor } = require('./emailReceiptIdentity');
const { receiptFor } = require('./trayDelivery');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const exact = (value, fields) => value && !Array.isArray(value) && Object.keys(value).sort().join(',') === fields;
const fail = () => { throw new Error('activity-notification-plan-invalid'); };
// #5171: an e-mail job may also carry its plain-text alternative, its group
// and its scheduled time (models/lib/notificationDelivery.js); a job without
// them is the original shape, so plans saved before still validate.
const EMAIL_JOB_KEYS = ['boardId', 'cardId', 'eventId', 'html', 'language', 'subject', 'userId'];
const EMAIL_JOB_OPTIONAL = ['deliverAt', 'groupKey', 'text'];
const emailJobKeys = job => !!job && !Array.isArray(job) && typeof job === 'object' &&
  EMAIL_JOB_KEYS.every(key => Object.hasOwn(job, key)) &&
  Object.keys(job).every(key => EMAIL_JOB_KEYS.includes(key) || EMAIL_JOB_OPTIONAL.includes(key));
function planIdentity(activity, dispatchUserId) {
  if (!activity || !text(activity._id) || (dispatchUserId !== null && !text(dispatchUserId))) fail();
  return { version: 1, activityId: activity._id, activityHash: sha256(canonical(activity)), dispatchUserId };
}
const planId = activityId => sha256(canonical(['activity-notification-plan', activityId]));
function validatePlanShape(plan) {
  if (!exact(plan, 'activityHash,activityId,dispatchUserId,recipients,version') || plan.version !== 1 ||
      !text(plan.activityId) || !/^[a-f0-9]{64}$/.test(plan.activityHash) ||
      !(plan.dispatchUserId === null || text(plan.dispatchUserId)) ||
      !Array.isArray(plan.recipients) || plan.recipients.length > 10000) fail();
  const seen = new Set();
  for (const row of plan.recipients) {
    if (!exact(row, 'email,tray,userId') || !text(row.userId) || seen.has(row.userId) || typeof row.tray !== 'boolean') fail();
    seen.add(row.userId);
    const job = row.email;
    if (job === null) continue;
    if (!emailJobKeys(job) || job.userId !== row.userId ||
        job.eventId !== plan.activityId || !(job.boardId === null || text(job.boardId)) ||
        !(job.cardId === null || text(job.cardId)) ||
        !text(job.language) || typeof job.subject !== 'string' || job.subject.length > 10000 ||
        /[\r\n]/.test(job.subject) || typeof job.html !== 'string' ||
        (job.text !== undefined && typeof job.text !== 'string') ||
        (job.groupKey !== undefined && !text(job.groupKey)) ||
        (job.deliverAt !== undefined && !Number.isFinite(job.deliverAt))) fail();
  }
  if (calculateObjectSize(plan) > 14 * 1024 * 1024) fail();
}
function validatePlan(plan, activity, dispatchUserId) {
  validatePlanShape(plan);
  const identity = planIdentity(activity, dispatchUserId);
  if (Object.entries(identity).some(([key, value]) => plan[key] !== value)) fail();
  for (const row of plan.recipients) {
    if (row.email && (row.email.boardId !== (activity.boardId || null) ||
        !(row.email.cardId === null || (text(activity.cardId) && row.email.cardId === activity.cardId)))) fail();
  }
}
async function ensureActivityNotificationPlan({ plans, activity, dispatchUserId = null, build, assertCurrent }) {
  if (typeof build !== 'function' || typeof assertCurrent !== 'function') fail();
  activity = copy(activity);
  const identity = planIdentity(activity, dispatchUserId), _id = planId(activity._id);
  async function read() {
    const row = await plans.findOne({ _id });
    if (!row) return null;
    if (!exact(row, '_id,checksum,plan') || row._id !== _id || row.checksum !== sha256(canonical(row.plan))) fail();
    validatePlan(row.plan, activity, dispatchUserId);
    return copy(row.plan);
  }
  await assertCurrent();
  let plan = await read();
  if (!plan) {
    const candidate = { ...identity, recipients: copy(await build()) };
    validatePlan(candidate, activity, dispatchUserId);
    await assertCurrent();
    let failure;
    try { await plans.insertOne({ _id, checksum: sha256(canonical(candidate)), plan: candidate }); }
    catch (error) { failure = error; }
    plan = await read();
    if (!plan) throw failure || new Error('activity-notification-plan-unconfirmed');
  }
  await assertCurrent();
  return plan;
}
async function deliverActivityNotificationPlan({ plan, activity, dispatchUserId = null, assertCurrent, assertAccess, tray, email }) {
  plan = copy(plan); activity = copy(activity);
  validatePlan(plan, activity, dispatchUserId);
  if (![assertCurrent, assertAccess, tray, email].every(fn => typeof fn === 'function')) fail();
  await assertCurrent();
  for (const row of plan.recipients) {
    if (row.tray) {
      await assertCurrent(); await assertAccess(row.userId, 'tray'); await assertCurrent();
      if (await tray(row.userId, activity._id) !== receiptFor(row.userId, activity._id)._id) {
        throw new Error('activity-notification-tray-unconfirmed');
      }
    }
    if (row.email) {
      await assertCurrent(); await assertAccess(row.userId, 'email'); await assertCurrent();
      if (await email(copy(row.email)) !== idFor(row.userId, activity._id)) {
        throw new Error('activity-notification-email-unconfirmed');
      }
    }
  }
  await assertCurrent();
  return planId(activity._id);
}
module.exports = { validatePlanShape, planId, validatePlan, ensureActivityNotificationPlan, deliverActivityNotificationPlan };
