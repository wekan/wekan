'use strict';
const { EJSON } = require('bson');
const { validateSyncEffectPolicy, assertSyncEffectPolicy } = require('./syncEffectPolicy');
const { notificationActivityIdentity, planId: notificationId } = require('./syncNotificationPlan');
const { planId: webhookId } = require('./syncWebhookPlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
// These adapters must reconcile their own durable receipts on replay. This
// coordinator never treats activity insertion or a resolved Promise alone as
// acknowledgement. Rules are mandatory even when notifications are disabled.
// `trigger` (manual or scheduled) reaches every stage, which checks the Sync
// activation switches itself (server/lib/syncActivation.js).
async function deliverSyncActivity({ effectId, activity, policy, assertCurrent, readPolicy,
  rules, notifications, webhooks, trigger }) {
  if (typeof effectId !== 'string' || !/^[a-f0-9]{64}$/.test(effectId) ||
      typeof assertCurrent !== 'function' || typeof readPolicy !== 'function') throw new Error('sync-activity-delivery-invalid');
  const saved = copy(activity), captured = validateSyncEffectPolicy(policy);
  notificationActivityIdentity(saved);
  if (typeof saved.listId !== 'string' || !saved.listId || saved.listId.length > 1024) {
    throw new Error('sync-activity-delivery-invalid');
  }
  if (!captured.activities || typeof rules !== 'function' ||
      (captured.notifications && (typeof notifications !== 'function' || typeof webhooks !== 'function'))) {
    throw new Error('sync-activity-delivery-adapter-required');
  }
  const guard = async () => {
    await assertCurrent();
    await assertSyncEffectPolicy(captured, readPolicy);
    await assertCurrent();
  };
  const run = async (adapter, expected) => {
    await guard();
    const receipt = await adapter({ effectId, activity: copy(saved), policy: { ...captured }, assertCurrent: guard, trigger });
    if (receipt !== expected) throw new Error('sync-activity-delivery-unconfirmed');
    await guard();
  };
  await run(rules, effectId);
  if (captured.notifications) {
    await run(notifications, notificationId(saved._id));
    await run(webhooks, webhookId(saved._id));
  }
  await guard();
  return effectId;
}
module.exports = { deliverSyncActivity };
