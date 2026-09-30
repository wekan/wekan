'use strict';
// Retention for stored Sync rule plans (maintainer decision of 2026-09-30),
// through the shared plan retention (syncPlanRetention.js). A rule plan keeps
// the matched rules' and actions' whole documents - an email action's
// recipients and text among them. Once every action of the plan is done
// (executeRulePlan confirmed its 'rules' receipt) a completion receipt with its
// time is written; SYNC_RECEIPT_METADATA_DAYS (90) later the plan is compacted
// in place. A replay of the compact form returns as done. Nothing else needs
// the whole plan by then: every action has its own receipt, and a rule email
// command is compacted on its own schedule (syncRuleEmailRetention.js).
const kit = require('./syncPlanRetention').createPlanRetentionKit('sync-rule');

module.exports = { isCompactRulePlan: kit.isCompactPlan, recordRuleCompletion: kit.recordPlanCompletion,
  readCompactedRule: kit.readCompactedPlan, createSyncRuleRetention: kit.createPlanRetention };
