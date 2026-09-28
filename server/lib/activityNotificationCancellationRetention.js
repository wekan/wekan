'use strict';
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { readActivityNotificationControl } = require('./activityNotificationControl');
const { validateActivityNotificationIntent } = require('./activityNotificationIntent');
const { planId, validatePlanShape } = require('./activityNotificationPlan');
const { validateCancelledActivityNotificationIntent: validateReceipt } = require('./activityNotificationCancellationReceipt');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const fail = () => { throw new Error('activity-cancellation-cleanup-invalid'); };
// Caller holds the delivery/operator reservation. Do not delete either unique
// row: even a plan that was never prepared needs a tombstone before the intent
// snapshot is removed, so a delayed first writer cannot recreate its payload.
async function compactCancelledActivityNotification({ controls, intents, plans, intentId, assertCurrent }) {
  if (typeof assertCurrent !== 'function') throw new Error('activity-cancellation-cleanup-guard-required');
  await assertCurrent();
  const control = await readActivityNotificationControl({ controls, intentId });
  if (!control.cancelled) return 'pending';
  const guard = async () => {
    await assertCurrent();
    if (canonical(await readActivityNotificationControl({ controls, intentId })) !== canonical(control)) {
      throw new Error('activity-cancellation-cleanup-control-changed');
    }
  };
  await guard();
  const original = await intents.findOne({ _id: intentId });
  if (!original) return 'missing';
  let receipt;
  if (original.state === 'cancelled') {
    validateReceipt(original, intentId);
    receipt = original;
  } else {
    if (original.state !== 'pending') return 'retained';
    validateActivityNotificationIntent(original, original.activity, original.dispatchUserId);
    receipt = { _id: original._id, activityHash: original.activityHash, activityId: original.activity._id,
      boardId: original.activity.boardId ?? null, cardId: original.activity.cardId ?? null,
      createdAt: original.activity.createdAt, dispatchUserId: original.dispatchUserId,
      state: 'cancelled', version: 1, writerId: original.writerId };
    validateReceipt(receipt, intentId);
  }
  const id = planId(receipt.activityId), plan = await plans.findOne({ _id: id });
  let checksum = null;
  if (plan?.cancelled === true) {
    if (plan._id !== id || plan.activityHash !== receipt.activityHash || plan.compactReceiptVersion !== 1 ||
        !(plan.checksum === null || hash(plan.checksum)) ||
        Object.keys(plan).sort().join(',') !== '_id,activityHash,cancelled,checksum,compactReceiptVersion') fail();
    checksum = plan.checksum;
  } else if (plan) {
    if (Object.keys(plan).sort().join(',') !== '_id,checksum,plan') fail();
    validatePlanShape(plan.plan);
    if (plan._id !== id || plan.plan.activityId !== receipt.activityId || plan.plan.activityHash !== receipt.activityHash ||
        plan.plan.dispatchUserId !== receipt.dispatchUserId || plan.checksum !== sha256(canonical(plan.plan))) fail();
    checksum = plan.checksum;
  }
  const planReceipt = { _id: id, activityHash: receipt.activityHash, checksum, compactReceiptVersion: 1, cancelled: true };
  async function confirmedWrite(collection, selector, value, insert = false) {
    await guard();
    let failure;
    try {
      if (insert) await collection.insertOne(value);
      else await collection.replaceOne(selector, value);
    } catch (error) { failure = error; }
    if (canonical(await collection.findOne({ _id: value._id })) !== canonical(value)) {
      throw failure || new Error('activity-cancellation-cleanup-unconfirmed');
    }
    await guard();
  }
  if (!plan || !plan.cancelled) await confirmedWrite(plans, plan, planReceipt, !plan);
  // Confirm the plan tombstone even on a repeat after interrupted cleanup.
  await guard();
  if (canonical(await plans.findOne({ _id: id })) !== canonical(planReceipt)) fail();
  if (original.state !== 'cancelled') await confirmedWrite(intents, original, receipt);
  await guard();
  if (canonical(await intents.findOne({ _id: intentId })) !== canonical(receipt)) {
    throw new Error('activity-cancellation-cleanup-unconfirmed');
  }
  return 'compacted';
}
module.exports = { compactCancelledActivityNotification };
