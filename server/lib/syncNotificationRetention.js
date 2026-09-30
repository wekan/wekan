'use strict';
// Retention for stored Sync notification plans (maintainer decision of
// 2026-09-30): after SYNC_RECEIPT_METADATA_DAYS (90) a delivered plan is
// compacted to a permanent minimal id and outcome.
//
// A plan keeps each recipient's rendered email subject and HTML. It had no
// completion evidence of its own - delivery is confirmed by the tray receipt
// and the email outbox - so a plan could never be told finished. A receipt
//   { _id: planId, version: 1, activityHash, checksum, completedAt }
// is now written once delivery is confirmed; the first one stored wins, with
// its timestamp. A plan whose receipt is older than the policy is replaced IN
// PLACE by { _id, activityHash, checksum, compactReceiptVersion: 1 } - the same
// _id, so a late replay can never rebuild and resend it. A replay that finds
// the compact form returns as delivered; within the policy a replay still
// re-checks every recipient, as it always did.
const kit = require('./syncPlanRetention').createPlanRetentionKit('sync-notification');

module.exports = { isCompactNotificationPlan: kit.isCompactPlan, recordNotificationCompletion: kit.recordPlanCompletion,
  readCompactedNotification: kit.readCompactedPlan, compactNotificationBatch: kit.compactPlanBatch,
  createSyncNotificationRetention: kit.createPlanRetention };
