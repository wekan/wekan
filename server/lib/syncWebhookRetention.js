'use strict';
// Retention for stored Sync webhook plans (maintainer decision of 2026-09-30),
// through the shared plan retention (syncPlanRetention.js). A webhook plan
// keeps each target's URL, its X-Wekan-Token credential and the request body;
// a response row keeps the receiver's reply, and a comment plan the comment
// text. After every target's delivery is confirmed a completion receipt is
// written, and SYNC_RECEIPT_METADATA_DAYS (90) later the response and comment
// plan rows - read only while a delivery receipt is missing - are removed and
// the plan is compacted. Delivery and comment receipts, already minimal, stay.
const kit = require('./syncPlanRetention').createPlanRetentionKit('sync-webhook');

// The rows only an uncompleted plan could need.
function webhookDependents({ responses, commentPlans }) {
  return async row => {
    const { deliveryId } = require('./syncWebhookPlan');
    const ids = (row.plan?.targets || []).map(target => deliveryId(row.plan.activityId, target.integrationId));
    if (!ids.length) return;
    await responses.deleteMany({ _id: { $in: ids } });
    await commentPlans.deleteMany({ _id: { $in: ids } });
  };
}

function createSyncWebhookRetention({ plans, receipts, responses, commentPlans, ...options }) {
  return kit.createPlanRetention({ plans, receipts, ...options,
    beforeCompact: webhookDependents({ responses, commentPlans }) });
}

module.exports = { isCompactWebhookPlan: kit.isCompactPlan, recordWebhookCompletion: kit.recordPlanCompletion,
  readCompactedWebhook: kit.readCompactedPlan, createSyncWebhookRetention, webhookDependents };
