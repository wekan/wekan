import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Settings from '/models/settings';
import { getFeatureFlags } from '/models/lib/featureFlags';
const { validateSyncTrigger, assertSyncActivation } = require('/server/lib/syncActivation');
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
import { ensureIndex } from '/server/lib/mongoStartup';
import { prepareActivityDeliveryPlan } from '/server/notifications/prepareDelivery';
import { trayDelivery } from '/server/notifications/trayQueue';
import { emailOutbox } from '/server/notifications/emailQueue';
const { EJSON } = require('bson');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { reuseWithinEvaluation } = require('/server/lib/syncGuardWindow');
const { ensureNotificationPlan, deliverNotificationPlan, notificationActivityIdentity, planId: notificationPlanId } = require('/server/lib/syncNotificationPlan');
const { recordNotificationCompletion, createSyncNotificationRetention } = require('/server/lib/syncNotificationRetention');
const { syncReceiptPolicy } = require('/server/lib/syncRuleEmailRetention');
const { canReceiveStoredNotification } = require('/server/lib/syncNotificationAccess');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');

export const SyncNotificationPlans = new Mongo.Collection('listSyncNotificationPlans');
SyncNotificationPlans.deny({ insert: () => true, update: () => true, remove: () => true });
// Delivery receipts: written once a plan's delivery is confirmed, kept for
// good; they are what lets a plan be compacted and a late replay skip it.
export const SyncNotificationReceipts = new Mongo.Collection('listSyncNotificationReceipts');
SyncNotificationReceipts.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(SyncNotificationPlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
  await ensureIndex(SyncNotificationReceipts, { completedAt: 1, _id: 1 });
  // Retention (maintainer decision of 2026-09-30): compact delivered plans
  // after SYNC_RECEIPT_METADATA_DAYS (90). A failed pass is retried.
  const { days, intervalMs } = syncReceiptPolicy();
  const retention = createSyncNotificationRetention({ plans: SyncNotificationPlans.rawCollection(),
    receipts: SyncNotificationReceipts.rawCollection(), days });
  Meteor.setInterval(() => {
    retention.sweep().catch(() => console.error('Sync notification retention pass failed; it is retried on the next pass'));
  }, intervalMs);
});

// Internal stage only: the caller supplies the journal's ownership/access guard.
// Returning confirms tray receipts and email enqueue, not rules, SMTP or webhooks.
// Plans are compacted after delivery plus SYNC_RECEIPT_METADATA_DAYS, never
// deleted: the _id must stay taken so a late replay cannot resend.
export async function runStoredSyncNotifications({ activity, policy, assertCurrent, trigger }) {
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  notificationActivityIdentity(saved);
  policy = validateSyncEffectPolicy(policy);
  if (!policy.activities || !policy.notifications || typeof assertCurrent !== 'function' ||
      typeof saved.listId !== 'string' || !saved.listId) throw new Error('sync-notification-stage-invalid');
  validateSyncTrigger(trigger);
  async function context() {
    const [board,card,list] = await Promise.all([
      Boards.findOneAsync(saved.boardId), Cards.findOneAsync({ _id: saved.cardId, boardId: saved.boardId, listId: saved.listId }),
      Lists.findOneAsync({ _id: saved.listId, boardId: saved.boardId }),
    ]);
    if (!board || !card || !list) throw new Error('sync-notification-context-unavailable');
    assertSyncActivation({ board, trigger, flags: getFeatureFlags() });
    return { board,card,list };
  }
  const guard = reuseWithinEvaluation(async () => {
    await assertCurrent();
    await assertSyncEffectPolicy(policy, async () => syncEffectPolicy(getFeatureFlags()));
    const stored = await Activities.findOneAsync(saved._id, { transform: null });
    if (!stored || canonical(stored) !== canonical(saved)) throw new Error('sync-notification-activity-changed');
    await context();
    await assertCurrent();
  });
  async function recipient(userId) {
    await guard();
    const user = await Meteor.users.findOneAsync(userId);
    const current = await context();
    return canReceiveStoredNotification({ ...current, user, activity: saved });
  }
  async function service(userId, name) {
    await guard();
    const [user, setting, current] = await Promise.all([
      Meteor.users.findOneAsync(userId), Settings.findOneAsync(), context(),
    ]);
    if (!canReceiveStoredNotification({ ...current, user, activity: saved })) throw new Error('sync-notification-recipient-denied');
    const field = name === 'tray' ? 'Tray' : 'Email';
    if (!resolveNotificationSetting(name, { adminDefault: setting?.[`notifyDefault${field}`],
      boardOverride: current.board[`notifyOverride${field}`], memberOverride: user.profile?.[`notifyOverride${field}`] })) {
      throw new Error('sync-notification-preference-changed');
    }
    await guard();
  }
  const plan = await ensureNotificationPlan({ plans: SyncNotificationPlans.rawCollection(), activity: saved,
    receipts: SyncNotificationReceipts.rawCollection(), assertCurrent: guard, build: async activity => {
      const candidate = await prepareActivityDeliveryPlan({ activity, assertCurrent: guard });
      const recipients = [];
      // Select only currently permitted candidates in the first snapshot.
      // Once saved, a revoked recipient stops replay rather than being silently
      // removed or replaced by a newly eligible watcher.
      for (const row of candidate.recipients) {
        if (await recipient(row.userId)) recipients.push(row);
      }
      return { ...candidate, recipients };
    } });
  // Compacted: delivered more than the retention period ago; nothing to resend.
  if (plan.compacted) { await assertCurrent(); return plan.id; }
  const id = await deliverNotificationPlan({ plan, activity: saved, assertCurrent: guard, assertRecipient: recipient,
    tray: { deliver: async (userId, activityId) => { await service(userId, 'tray'); return trayDelivery.deliver(userId, activityId); } },
    email: { enqueue: async job => { await service(job.userId, 'email'); return emailOutbox.enqueue(job); } },
  });
  const stored = await SyncNotificationPlans.rawCollection().findOne({ _id: notificationPlanId(saved._id) });
  await recordNotificationCompletion({ receipts: SyncNotificationReceipts.rawCollection(), id,
    activityHash: plan.activityHash, checksum: stored?.checksum });
  return id;
}
