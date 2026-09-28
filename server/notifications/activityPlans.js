import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Settings from '/models/settings';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
import { prepareActivityEmail } from './email';
import { prepareTrayNotification } from './profile';
import { trayDelivery } from './trayQueue';
import { emailOutbox } from './emailQueue';
import { ActivityNotificationIntents, acknowledgeActivityNotifications } from './activityIntents';
const { EJSON, calculateObjectSize } = require('bson');
const { ensureActivityNotificationPlan, deliverActivityNotificationPlan } = require('/server/lib/activityNotificationPlan');
const { readActivityForNotificationIntent } = require('/server/lib/activityNotificationIntent');
const { canonical, sha256 } = require('/models/lib/changeHistoryIntegrity');
const { boardNotificationRecipients } = require('/models/lib/boardNotificationRecipients');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');

export const ActivityNotificationPlans = new Mongo.Collection('activityNotificationPlans');
ActivityNotificationPlans.deny({ insert: () => true, update: () => true, remove: () => true });
// Named service adapters also make real-hook failure injection possible without
// changing the public subscriber registry used by non-activity notifications.
export const activityNotificationServices = {
  prepareEmail: prepareActivityEmail, prepareTray: prepareTrayNotification,
  tray: (userId, activityId) => trayDelivery.deliver(userId, activityId),
  email: job => emailOutbox.enqueue(job),
};
async function assertAccess(activity, userId, service) {
  const [user, board, card, list, settings] = await Promise.all([
    Meteor.users.findOneAsync(userId), activity.boardId ? Boards.findOneAsync(activity.boardId) : null,
    activity.cardId ? Cards.findOneAsync(activity.cardId) : null,
    activity.listId ? Lists.findOneAsync(activity.listId) : null, Settings.findOneAsync(),
  ]);
  if (!user || user.loginDisabled) throw new Error('activity-notification-recipient-denied');
  if (activity.boardId) {
    if (!board || (card && card.boardId !== board._id) || (list && list.boardId !== board._id) ||
        !boardNotificationRecipients([userId], board.members, board.watchers,
          [...(list?.watchers || []), ...(card?.watchers || [])]).includes(userId) ||
        (isAssignedOnlyMember(board, userId) && !card?.assignees?.includes(userId))) {
      throw new Error('activity-notification-recipient-denied');
    }
  }
  const field = service === 'email' ? 'Email' : 'Tray';
  if (!resolveNotificationSetting(service, { adminDefault: settings?.[`notifyDefault${field}`],
    boardOverride: board?.[`notifyOverride${field}`], memberOverride: user.profile?.[`notifyOverride${field}`] })) {
    throw new Error('activity-notification-preference-changed');
  }
}
async function eligible(activity, userId, service) {
  try { await assertAccess(activity, userId, service); return true; }
  catch (error) {
    if (['activity-notification-recipient-denied', 'activity-notification-preference-changed'].includes(error.message)) return false;
    throw error;
  }
}
export async function deliverStoredActivityNotifications(activity, dispatchUserId, buildContext) {
  activity = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  dispatchUserId ??= null;
  const intentId = sha256(canonical(['activity-notification-intent', activity._id]));
  async function guard() {
    if (getFeatureFlags().disableNotifications || getFeatureFlags().disableActivities) throw new Error('activity-notifications-disabled');
    await readActivityForNotificationIntent({ intents: ActivityNotificationIntents.rawCollection(),
      activities: Activities.rawCollection(), intentId, expectedActivity: activity, expectedDispatchUserId: dispatchUserId,
      assertCurrent: async () => {} });
  }
  const plan = await ensureActivityNotificationPlan({ plans: ActivityNotificationPlans.rawCollection(), activity, dispatchUserId,
    assertCurrent: guard, build: async () => {
      const context = await buildContext();
      if (!context || !Array.isArray(context.users) || context.users.length > 10000) throw new Error('activity-notification-context-unavailable');
      const rows = [];
      let bytes = 2048;
      for (const user of context.users) {
        await guard();
        let email = await activityNotificationServices.prepareEmail(user, context.title, context.description, context.params);
        let tray = await activityNotificationServices.prepareTray(user, context.params);
        // Freeze only currently eligible services. Later revocation stops
        // replay instead of silently changing an already persisted audience.
        if (email && !await eligible(activity, user._id, 'email')) email = null;
        if (tray && !await eligible(activity, user._id, 'tray')) tray = false;
        const row = { userId: user._id, email, tray };
        bytes += calculateObjectSize(row) + 32;
        if (bytes > 14 * 1024 * 1024) throw new Error('activity-notification-plan-too-large');
        rows.push(row);
      }
      return rows;
    } });
  await deliverActivityNotificationPlan({ plan, activity, dispatchUserId, assertCurrent: guard,
    assertAccess: (userId, service) => assertAccess(activity, userId, service),
    tray: activityNotificationServices.tray, email: activityNotificationServices.email });
  await acknowledgeActivityNotifications(activity, dispatchUserId);
}
