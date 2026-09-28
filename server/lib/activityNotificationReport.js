'use strict';
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { readActivityNotificationControl } = require('./activityNotificationControl');
const { validateCancelledActivityNotificationIntent } = require('./activityNotificationCancellationReceipt');
const { planId } = require('./activityNotificationPlan');
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const date = value => value instanceof Date && Number.isFinite(+value) ? value : null;

// Ten summaries only. Rendered email payloads and saved activity snapshots are
// not selected. Current activity content is hashed on the server to detect
// changed input; neither that content nor recipient/mailbox data is returned.
async function activityNotificationReport({ intents, activities, plans, leases, controls, now = () => new Date() }, { search = '', page = 1 } = {}) {
  if (typeof search !== 'string' || search.length > 100 || !Number.isSafeInteger(page) || page < 1 || page > 100000) {
    throw new Error('invalid-activity-notification-report');
  }
  const pattern = search.trim() ? new RegExp(escape(search.trim()), 'i') : null;
  const query = { state: { $in: ['pending', 'cancelled'] }, ...(pattern ? { $or: ['_id', 'activity._id', 'activity.boardId', 'activity.cardId', 'activityId', 'boardId', 'cardId']
    .map(key => ({ [key]: pattern })) } : {}) };
  const total = await intents.countDocuments(query);
  page = Math.min(page, Math.max(1, Math.ceil(total / 10)));
  const pending = await intents.find(query, { projection: { _id: 1, version: 1, state: 1, activityHash: 1,
    writerId: 1, dispatchUserId: 1, activityId: 1, boardId: 1, cardId: 1, createdAt: 1, 'activity._id': 1, 'activity.createdAt': 1, 'activity.boardId': 1, 'activity.cardId': 1 } })
    .sort({ _id: 1 }).skip((page - 1) * 10).limit(10).toArray();
  const rows = [];
  for (const row of pending) {
    const summary = row.state === 'cancelled' ? { _id: row.activityId, boardId: row.boardId, cardId: row.cardId, createdAt: row.createdAt } : row.activity;
    const activityId = text(summary?._id) ? summary._id : '';
    const item = { intentId: hash(row._id) ? row._id : '', activityId,
      boardId: text(summary?.boardId) ? summary.boardId : '',
      cardId: text(summary?.cardId) ? summary.cardId : '',
      createdAt: date(summary?.createdAt), status: 'invalid', canRetry: false, paused: false, controlRevision: null, canControl: false };
    if (row.state === 'cancelled') {
      try {
        validateCancelledActivityNotificationIntent(row, row._id);
        const control = await readActivityNotificationControl({ controls, intentId: row._id });
        if (control.cancelled) {
          item.status = 'cancelled'; item.paused = true; item.controlRevision = control.revision;
        }
      } catch (error) {
        if (!['activity-cancellation-cleanup-invalid', 'activity-notification-control-invalid'].includes(error.message)) throw error;
      }
      rows.push(item);
      continue;
    }
    const valid = item.intentId && activityId && row.version === 1 && hash(row.activityHash) && text(row.writerId) &&
      (row.dispatchUserId === null || text(row.dispatchUserId)) &&
      row._id === sha256(canonical(['activity-notification-intent', activityId]));
    if (valid) {
      const lease = await leases.findOne({ _id: row._id }, { projection: { _id: 1, expiresAt: 1 } });
      if (date(lease?.expiresAt) && lease.expiresAt > now()) item.status = 'processing';
      else {
        const activity = await activities.findOne({ _id: activityId });
        if (!activity) item.status = 'missing';
        else {
          let unchanged = false;
          try { unchanged = sha256(canonical(activity)) === row.activityHash; } catch (error) { /* Invalid stored BSON cannot authorize retry. */ }
          if (!unchanged) item.status = 'changed';
          else {
            const plan = await plans.findOne({ _id: planId(activityId) }, { projection: { _id: 1, checksum: 1, compactReceiptVersion: 1,
              'plan.version': 1, 'plan.activityId': 1, 'plan.activityHash': 1, 'plan.dispatchUserId': 1 } });
            if (!plan) item.status = 'preparing';
            else if (plan.compactReceiptVersion !== undefined || !hash(plan.checksum) || plan.plan?.version !== 1 ||
                plan.plan.activityId !== activityId || plan.plan.activityHash !== row.activityHash || plan.plan.dispatchUserId !== row.dispatchUserId) {
              item.status = 'inconsistent';
            } else item.status = 'pending';
          }
        }
      }
      try {
        const control = await readActivityNotificationControl({ controls, intentId: row._id });
        item.paused = control.paused;
        item.controlRevision = control.revision;
        if (control.cancelled) item.status = 'cancelled';
        item.canControl = !control.cancelled && item.status !== 'processing' && control.revision < Number.MAX_SAFE_INTEGER;
      } catch (error) {
        if (error.message !== 'activity-notification-control-invalid') throw error;
        item.status = 'invalid';
      }
      item.canRetry = item.controlRevision !== null && !item.paused && ['pending', 'preparing'].includes(item.status);
    }
    rows.push(item);
  }
  return { total, page, rows };
}
module.exports = { activityNotificationReport };
