'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { idFor: emailId } = require('./emailOutbox');
const { receiptFor } = require('./trayDelivery');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-notification-plan-invalid'); };
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const keys = (value, expected) => value && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === expected.split(',').sort().join(',');
const MAX_BYTES = 15 * 1024 * 1024;
function identity(activity) {
  if (!activity || !['_id','boardId','cardId','userId'].every(key => text(activity[key]))) fail();
  return { activityId: activity._id, activityHash: sha256(canonical(activity)),
    boardId: activity.boardId, cardId: activity.cardId, actorId: activity.userId };
}
function validateRecipient(row, plan) {
  if (!keys(row,'userId,tray,email') || !text(row.userId) || typeof row.tray !== 'boolean') fail();
  const job = row.email;
  if (job === null) return;
  if (!keys(job,'userId,eventId,subject,html,language,cardId,boardId') || job.userId !== row.userId ||
      job.eventId !== plan.activityId || job.cardId !== plan.cardId || job.boardId !== plan.boardId ||
      !text(job.language) || typeof job.subject !== 'string' || job.subject.length > 10000 ||
      /[\r\n]/.test(job.subject) || typeof job.html !== 'string') fail();
}
function validateNotificationPlan(plan, activity) {
  const expected = identity(activity);
  if (!keys(plan,'version,activityId,activityHash,boardId,cardId,actorId,recipients') || plan.version !== 1 ||
      Object.entries(expected).some(([key,value]) => plan[key] !== value) ||
      !Array.isArray(plan.recipients) || plan.recipients.length > 10000) fail();
  const seen = new Set();
  for (const row of plan.recipients) {
    validateRecipient(row, plan);
    if (seen.has(row.userId)) fail();
    seen.add(row.userId);
  }
  if (calculateObjectSize(plan) > MAX_BYTES) fail();
  return true;
}
// The caller selects authorized recipients once, from the ordinary activity
// payload builder. Service preparation reads preferences/renders content but
// must not write or deliver. Replays use the persisted plan, not these readers.
async function prepareNotificationPlan({ activity, recipientIds, getUser, prepareEmail, prepareTray }) {
  activity = copy(activity);
  const plan = { version: 1, ...identity(activity), recipients: [] };
  if (!Array.isArray(recipientIds) || recipientIds.length > 10000 ||
      !recipientIds.every(text) || new Set(recipientIds).size !== recipientIds.length ||
      ![getUser, prepareEmail, prepareTray].every(fn => typeof fn === 'function')) fail();
  const ids = [...recipientIds];
  let bytes = calculateObjectSize(plan);
  for (const userId of ids) {
    const user = await getUser(userId);
    if (user?._id !== userId) fail();
    const [email, tray] = await Promise.all([
      Promise.resolve(prepareEmail(user, copy(activity))).then(copy), prepareTray(user, copy(activity)),
    ]);
    const row = copy({ userId, email, tray });
    validateRecipient(row, plan);
    bytes += calculateObjectSize(row) + 32;
    if (bytes > MAX_BYTES) fail();
    plan.recipients.push(row);
  }
  validateNotificationPlan(plan, activity);
  return plan;
}
const planId = activityId => sha256(canonical(['sync-notifications', activityId]));
// With `receipts`, a plan compacted after delivery (syncNotificationRetention.js)
// is returned as { compacted: true, id }: it was delivered and is never rebuilt.
async function ensureNotificationPlan({ plans, activity, build, assertCurrent, receipts = null }) {
  activity = copy(activity);
  const { activityHash } = identity(activity);
  if (typeof build !== 'function' || typeof assertCurrent !== 'function') fail();
  const _id = planId(activity._id);
  async function read() {
    const row = await plans.findOne({ _id });
    if (!row) return null;
    if (row.compactReceiptVersion !== undefined) {
      if (!receipts || row._id !== _id) fail();
      const { readCompactedNotification } = require('./syncNotificationRetention');
      return { compacted: true, id: await readCompactedNotification({ receipts, row, activityHash }) };
    }
    if (!keys(row,'_id,plan,checksum') || row._id !== _id) fail();
    validateNotificationPlan(row.plan, activity);
    if (row.checksum !== sha256(canonical(row.plan))) fail();
    return copy(row.plan);
  }
  await assertCurrent();
  let plan = await read();
  if (!plan) {
    const candidate = copy(await build(copy(activity)));
    validateNotificationPlan(candidate, activity);
    await assertCurrent();
    let failure;
    try { await plans.insertOne({ _id, plan: candidate, checksum: sha256(canonical(candidate)) }); }
    catch (error) { failure = error; }
    plan = await read();
    if (!plan) throw failure || new Error('sync-notification-plan-unconfirmed');
  }
  await assertCurrent();
  return plan;
}
// Confirms tray receipt and durable email enqueue only, NOT SMTP acceptance,
// rule actions or webhooks. A caller must not treat this as their completion.
async function deliverNotificationPlan({ plan, activity, tray, email, assertCurrent, assertRecipient }) {
  plan = copy(plan); activity = copy(activity);
  validateNotificationPlan(plan, activity);
  if (![assertCurrent, assertRecipient].every(fn => typeof fn === 'function') ||
      (plan.recipients.some(row => row.tray) && typeof tray?.deliver !== 'function') ||
      (plan.recipients.some(row => row.email) && typeof email?.enqueue !== 'function')) fail();
  async function guard(row) {
    await assertCurrent();
    if (await assertRecipient(row.userId, copy(activity)) !== true) throw new Error('sync-notification-recipient-denied');
    await assertCurrent();
  }
  await assertCurrent();
  for (const row of plan.recipients) {
    await guard(row);
    if (row.tray) {
      if (await tray.deliver(row.userId, plan.activityId) !== receiptFor(row.userId, plan.activityId)._id) {
        throw new Error('sync-notification-tray-unconfirmed');
      }
      await guard(row);
    }
    if (row.email) {
      if (await email.enqueue(copy(row.email)) !== emailId(row.userId, plan.activityId)) {
        throw new Error('sync-notification-email-unconfirmed');
      }
      await guard(row);
    }
  }
  await assertCurrent();
  return planId(plan.activityId);
}
module.exports = { notificationActivityIdentity: identity, prepareNotificationPlan, validateNotificationPlan, ensureNotificationPlan, deliverNotificationPlan, planId };
