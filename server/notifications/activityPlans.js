import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Settings from '/models/settings';
import { ensureIndex } from '/server/lib/mongoStartup';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
import { prepareActivityEmail } from './email';
import { prepareTrayNotification } from './profile';
import { trayDelivery } from './trayQueue';
import { emailOutbox } from './emailQueue';
import { ActivityNotificationIntents, acknowledgeActivityNotifications } from './activityIntents';
const { EJSON, calculateObjectSize } = require('bson');
const { compactActivityNotificationPlan, createActivityPlanCleanup, activityPlanCleanupInterval } = require('/server/lib/activityNotificationPlanRetention');
const { planId, ensureActivityNotificationPlan, deliverActivityNotificationPlan } = require('/server/lib/activityNotificationPlan');
const { compactCancelledActivityNotification } = require('/server/lib/activityNotificationCancellationRetention');
const { withSyncLease } = require('/server/lib/syncLease');
const { assertActivityNotificationUnpaused } = require('/server/lib/activityNotificationControl');
const { createActivityNotificationRecovery, activityNotificationRecoveryInterval } = require('/server/lib/activityNotificationRecovery');
const { readActivityForNotificationIntent, readActivityNotificationIntentState } = require('/server/lib/activityNotificationIntent');
const { canonical, sha256 } = require('/models/lib/changeHistoryIntegrity');
const { boardNotificationRecipients } = require('/models/lib/boardNotificationRecipients');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
const { isActivityMuted } = require('/models/lib/notificationActivityGroups');

export const ActivityNotificationPlans = new Mongo.Collection('activityNotificationPlans');
ActivityNotificationPlans.deny({ insert: () => true, update: () => true, remove: () => true });
export const ActivityNotificationLeases = new Mongo.Collection('activityNotificationLeases');
ActivityNotificationLeases.deny({ insert: () => true, update: () => true, remove: () => true });
export const ActivityNotificationControls = new Mongo.Collection('activityNotificationControls');
ActivityNotificationControls.deny({ insert: () => true, update: () => true, remove: () => true });
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
  // #572: a kind of activity the member muted reaches neither the bell nor
  // email. Checked when the plan is frozen and again before delivery.
  if (isActivityMuted(activity.activityType, user.profile?.notifyMutedActivities)) {
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
async function deliverWithinReservation(activity, dispatchUserId, buildContext, assertCurrent) {
  activity = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  dispatchUserId ??= null;
  const intentId = sha256(canonical(['activity-notification-intent', activity._id]));
  async function guard() {
    await assertCurrent();
    await assertActivityNotificationUnpaused({ controls: ActivityNotificationControls.rawCollection(), intentId });
    if (getFeatureFlags().disableNotifications || getFeatureFlags().disableActivities) throw new Error('activity-notifications-disabled');
    await readActivityForNotificationIntent({ intents: ActivityNotificationIntents.rawCollection(),
      activities: Activities.rawCollection(), intentId, expectedActivity: activity, expectedDispatchUserId: dispatchUserId,
      assertCurrent });
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
  await guard();
  await acknowledgeActivityNotifications(activity, dispatchUserId, assertCurrent);
  try {
    await compactActivityNotificationPlan({ plans: ActivityNotificationPlans.rawCollection(),
      intents: ActivityNotificationIntents.rawCollection(), id: planId(activity._id), assertCurrent });
  } catch (error) { console.error('Completed activity notification payload cleanup failed; receipt retained'); }
  return 'completed';
}

const intentIdFor = activityId => sha256(canonical(['activity-notification-intent', activityId]));
export async function deliverStoredActivityNotifications(activity, dispatchUserId, buildContext) {
  activity = EJSON.parse(EJSON.stringify(activity), { relaxed: true });
  dispatchUserId ??= null;
  return withSyncLease(ActivityNotificationLeases.rawCollection(), intentIdFor(activity._id), async ({ assertCurrent }) => {
    const state = await readActivityNotificationIntentState({ intents: ActivityNotificationIntents.rawCollection(),
      activity, dispatchUserId, assertCurrent });
    if (state === 'completed') return 'completed';
    if (state === 'cancelled') throw new Error('activity-notification-cancelled');
    return deliverWithinReservation(activity, dispatchUserId, buildContext, assertCurrent);
  });
}
const cancellationCleanupOptions = (intentId, assertCurrent) => ({ intentId, assertCurrent,
  controls: ActivityNotificationControls.rawCollection(), intents: ActivityNotificationIntents.rawCollection(),
  plans: ActivityNotificationPlans.rawCollection() });
export async function cleanupCancelledActivityNotifications(intentId, assertAllowed = async () => {}) {
  await assertAllowed();
  return withSyncLease(ActivityNotificationLeases.rawCollection(), intentId, ({ assertCurrent: assertOwner }) =>
    compactCancelledActivityNotification(cancellationCleanupOptions(intentId, async () => {
      await assertOwner(); await assertAllowed();
    })));
}
export async function resumeActivityNotifications(intentId, { assertAllowed = async () => {} } = {}) {
  if (typeof assertAllowed !== 'function') throw new Error('activity-recovery-access-guard-required');
  await assertAllowed();
  return withSyncLease(ActivityNotificationLeases.rawCollection(), intentId, async ({ assertCurrent: assertOwner }) => {
    const assertCurrent = async () => { await assertOwner(); await assertAllowed(); };
    await assertCurrent();
    const row = await ActivityNotificationIntents.rawCollection().findOne({ _id: intentId });
    if (row?.state === 'cancelled') throw new Error('activity-notification-cancelled');
    if (!row || row.state !== 'pending') return 'skipped';
    try {
      await assertActivityNotificationUnpaused({ controls: ActivityNotificationControls.rawCollection(), intentId });
    } catch (error) {
      if (error.message !== 'activity-notification-cancelled') throw error;
      await compactCancelledActivityNotification(cancellationCleanupOptions(intentId, assertCurrent));
      throw error;
    }
    const activity = await readActivityForNotificationIntent({ intents: ActivityNotificationIntents.rawCollection(),
      activities: Activities.rawCollection(), intentId, assertCurrent });
    // Load lazily to avoid a module cycle with the ordinary after.insert hook.
    const { prepareActivityNotification } = require('/server/models/activities');
    return deliverWithinReservation(activity, row.dispatchUserId,
      () => prepareActivityNotification(row.dispatchUserId, activity), assertCurrent);
  });
}
export const recoverActivityNotifications = createActivityNotificationRecovery({
  intents: ActivityNotificationIntents.rawCollection(), run: resumeActivityNotifications,
});
const recoveryInterval = activityNotificationRecoveryInterval();
Meteor.startup(async () => {
  await ensureIndex(ActivityNotificationIntents, { state: 1, _id: 1 });
  async function scan() {
    try { await recoverActivityNotifications(); }
    catch (error) { console.error('Activity notification recovery scan failed; pending evidence retained'); }
    finally { Meteor.setTimeout(scan, recoveryInterval); }
  }
  // Begin asynchronously after installing the pending-work index.
  Meteor.setTimeout(scan, recoveryInterval);
});

export const cleanupActivityNotificationPlans = createActivityPlanCleanup({
  plans: ActivityNotificationPlans.rawCollection(), run: async id => {
    const row = await ActivityNotificationPlans.rawCollection().findOne({ _id: id }, { projection: { 'plan.activityId': 1 } });
    if (!row) return 'missing';
    if (typeof row.plan?.activityId !== 'string' || !row.plan.activityId || row.plan.activityId.length > 1024) return 'invalid';
    return withSyncLease(ActivityNotificationLeases.rawCollection(), intentIdFor(row.plan.activityId), ({ assertCurrent }) =>
      compactActivityNotificationPlan({ plans: ActivityNotificationPlans.rawCollection(),
        intents: ActivityNotificationIntents.rawCollection(), id, assertCurrent }));
  },
});
const planCleanupInterval = activityPlanCleanupInterval();
Meteor.startup(async () => {
  await ensureIndex(ActivityNotificationPlans, { compactReceiptVersion: 1, _id: 1 });
  async function scan() {
    try { await cleanupActivityNotificationPlans(); }
    catch (error) { console.error('Activity notification plan cleanup failed; receipts retained'); }
    finally { Meteor.setTimeout(scan, planCleanupInterval); }
  }
  Meteor.setTimeout(scan, planCleanupInterval);
});
