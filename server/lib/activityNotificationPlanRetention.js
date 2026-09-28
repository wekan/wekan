'use strict';
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { planId, validatePlanShape } = require('./activityNotificationPlan');
const { matchesCompletedActivityNotificationIntent } = require('./activityNotificationIntent');
const intentIdFor = activityId => sha256(canonical(['activity-notification-intent', activityId]));
function activityPlanCleanupInterval(env = process.env) {
  const value = Number(env.ACTIVITY_NOTIFICATION_PLAN_CLEANUP_INTERVAL_MS || 60000);
  if (!Number.isSafeInteger(value) || value < 1000 || value > 86400000) throw new Error('ACTIVITY_NOTIFICATION_PLAN_CLEANUP_INTERVAL_MS must be from 1000 to 86400000');
  return value;
}
function compactReceipt(row) {
  return row?.compactReceiptVersion === 1 && /^[a-f0-9]{64}$/.test(row._id) &&
    /^[a-f0-9]{64}$/.test(row.checksum) && /^[a-f0-9]{64}$/.test(row.activityHash) &&
    Object.keys(row).sort().join(',') === '_id,activityHash,checksum,compactReceiptVersion';
}
// Caller holds the same per-intent reservation as delivery and operator actions.
// Keep the unique plan ID in place so an expired writer cannot recreate a body.
async function compactActivityNotificationPlan({ plans, intents, id, assertCurrent }) {
  if (typeof assertCurrent !== 'function') throw new Error('activity-plan-cleanup-guard-required');
  await assertCurrent();
  const row = await plans.findOne({ _id: id });
  if (!row) return 'missing';
  if (compactReceipt(row)) { await assertCurrent(); return 'compacted'; }
  if (Object.keys(row).sort().join(',') !== '_id,checksum,plan') throw new Error('activity-plan-cleanup-invalid');
  validatePlanShape(row.plan);
  if (row._id !== planId(row.plan.activityId) || row.checksum !== sha256(canonical(row.plan))) throw new Error('activity-plan-cleanup-invalid');
  const intent = await intents.findOne({ _id: intentIdFor(row.plan.activityId) });
  if (!matchesCompletedActivityNotificationIntent(intent, row.plan)) return 'pending';
  await assertCurrent();
  const receipt = { _id: row._id, activityHash: row.plan.activityHash, checksum: row.checksum, compactReceiptVersion: 1 };
  const confirms = async () => canonical(await plans.findOne({ _id: id })) === canonical(receipt);
  let result;
  try { result = await plans.replaceOne({ _id: id, checksum: row.checksum, plan: row.plan }, receipt); }
  catch (error) {
    if (!await confirms()) throw error;
    await assertCurrent(); return 'compacted';
  }
  if (!await confirms()) {
    if (result.matchedCount === 1) throw new Error('activity-plan-cleanup-unconfirmed');
    return 'changed';
  }
  await assertCurrent();
  return 'compacted';
}
function createActivityPlanCleanup({ plans, run, limit = 100 }) {
  if (typeof run !== 'function' || !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error('invalid-activity-plan-cleanup');
  let after = null, running;
  async function scan() {
    const rows = await plans.find({ compactReceiptVersion: { $exists: false },
      _id: { $type: 'string', ...(after ? { $gt: after } : {}) } }, { projection: { _id: 1 } })
      .sort({ _id: 1 }).limit(limit).toArray();
    const result = { visited: rows.length, compacted: 0, retained: 0, failed: 0 };
    for (const row of rows) {
      try { if (await run(row._id) === 'compacted') result.compacted++; else result.retained++; }
      catch (error) { if (error.code === 'sync-busy') result.retained++; else result.failed++; }
    }
    after = rows.length === limit ? rows[rows.length - 1]._id : null;
    return result;
  }
  return () => { if (!running) running = scan().finally(() => { running = null; }); return running; };
}
module.exports = { compactActivityNotificationPlan, createActivityPlanCleanup, activityPlanCleanupInterval, intentIdFor };
