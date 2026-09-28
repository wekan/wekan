import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Settings from '/models/settings';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
import { ensureIndex } from '/server/lib/mongoStartup';
import { prepareActivityDeliveryPlan } from '/server/notifications/prepareDelivery';
import { trayDelivery } from '/server/notifications/trayQueue';
import { emailOutbox } from '/server/notifications/emailQueue';
const { EJSON } = require('bson');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { ensureNotificationPlan, deliverNotificationPlan, notificationActivityIdentity } = require('/server/lib/syncNotificationPlan');
const { canReceiveStoredNotification } = require('/server/lib/syncNotificationAccess');
const { validateSyncEffectPolicy, assertSyncEffectPolicy, syncEffectPolicy } = require('/server/lib/syncEffectPolicy');

export const SyncNotificationPlans = new Mongo.Collection('listSyncNotificationPlans');
SyncNotificationPlans.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(SyncNotificationPlans, { 'plan.boardId': 1, 'plan.cardId': 1 });
});

// Internal stage only: the caller supplies the journal's ownership/access guard.
// Returning confirms tray receipts and email enqueue, not rules, SMTP or webhooks.
// Retain plans without TTL; job activation and retention are separate work.
export async function runStoredSyncNotifications({ activity, policy, assertCurrent }) {
  const saved = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  notificationActivityIdentity(saved);
  policy = validateSyncEffectPolicy(policy);
  if (!policy.activities || !policy.notifications || typeof assertCurrent !== 'function' ||
      typeof saved.listId !== 'string' || !saved.listId) throw new Error('sync-notification-stage-invalid');
  async function context() {
    const [board,card,list] = await Promise.all([
      Boards.findOneAsync(saved.boardId), Cards.findOneAsync({ _id: saved.cardId, boardId: saved.boardId, listId: saved.listId }),
      Lists.findOneAsync({ _id: saved.listId, boardId: saved.boardId }),
    ]);
    if (!board || !card || !list) throw new Error('sync-notification-context-unavailable');
    return { board,card,list };
  }
  async function guard() {
    await assertCurrent();
    await assertSyncEffectPolicy(policy, async () => syncEffectPolicy(getFeatureFlags()));
    const stored = await Activities.findOneAsync(saved._id, { transform: null });
    if (!stored || canonical(stored) !== canonical(saved)) throw new Error('sync-notification-activity-changed');
    await context();
    await assertCurrent();
  }
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
    assertCurrent: guard, build: async activity => {
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
  return deliverNotificationPlan({ plan, activity: saved, assertCurrent: guard, assertRecipient: recipient,
    tray: { deliver: async (userId, activityId) => { await service(userId, 'tray'); return trayDelivery.deliver(userId, activityId); } },
    email: { enqueue: async job => { await service(job.userId, 'email'); return emailOutbox.enqueue(job); } },
  });
}
