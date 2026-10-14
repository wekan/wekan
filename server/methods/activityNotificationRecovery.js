import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import { ActivityNotificationIntents } from '/server/notifications/activityIntents';
import { ActivityNotificationPlans, ActivityNotificationLeases, ActivityNotificationControls, resumeActivityNotifications, cleanupCancelledActivityNotifications, giveUpActivityNotification, recoverActivityNotifications } from '/server/notifications/activityPlans';
const { olderThanSelector } = require('/server/lib/activityNotificationExpiry');
const { controlActivityNotification, cancelActivityNotification } = require('/server/lib/activityNotificationControl');
const { activityNotificationReport } = require('/server/lib/activityNotificationReport');
const BULK_LIMIT = 5000;
async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
}
Meteor.methods({
  // #6768: bulk actions, so a long list is handled in one click, not per row.
  // Cancel every pending notification whose activity is older than `days`.
  async cancelActivityNotificationsOlderThan(request) {
    check(request, { days: Number });
    await assertAdmin(this.userId);
    if (!Number.isFinite(request.days) || request.days < 0 || request.days > 3650) throw new Meteor.Error('activity-recovery-invalid-request');
    const rows = await ActivityNotificationIntents.rawCollection().find(olderThanSelector(request.days), { projection: { _id: 1 } })
      .limit(BULK_LIMIT).toArray();
    let cancelled = 0;
    for (const { _id } of rows) {
      await assertAdmin(this.userId);
      try { await giveUpActivityNotification(_id, 'admin'); cancelled += 1; } catch (error) { /* busy or already done: the next pass */ }
    }
    const remaining = await ActivityNotificationIntents.rawCollection().countDocuments(olderThanSelector(request.days));
    return { cancelled, remaining };
  },
  // Retry every pending notification now, a page at a time.
  async retryAllActivityNotifications() {
    await assertAdmin(this.userId);
    const totals = { visited: 0, completed: 0, skipped: 0, failed: 0, busy: 0, cancelled: 0 };
    for (let i = 0; i < 50; i += 1) {
      await assertAdmin(this.userId);
      const result = await recoverActivityNotifications();
      for (const key of Object.keys(totals)) totals[key] += result[key] || 0;
      if (result.visited < 100) break;
    }
    return totals;
  },

  async activityNotificationRecoveryReport(query) {
    check(query, { search: String, page: Number });
    await assertAdmin(this.userId);
    try {
      const result = await activityNotificationReport({ intents: ActivityNotificationIntents.rawCollection(),
        activities: Activities.rawCollection(), plans: ActivityNotificationPlans.rawCollection(), leases: ActivityNotificationLeases.rawCollection(),
        controls: ActivityNotificationControls.rawCollection() }, query);
      await assertAdmin(this.userId);
      return result;
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      throw new Meteor.Error('activity-recovery-unavailable');
    }
  },
  async controlActivityNotificationRecovery(request) {
    check(request, { intentId: String, paused: Boolean, expectedRevision: Number, requestId: String });
    await assertAdmin(this.userId);
    try {
      const result = await controlActivityNotification({ ...request, actorId: this.userId,
        controls: ActivityNotificationControls.rawCollection(), intents: ActivityNotificationIntents.rawCollection(),
        leases: ActivityNotificationLeases.rawCollection(), assertAdmin: () => assertAdmin(this.userId) });
      await assertAdmin(this.userId);
      return result;
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      if (['sync-busy', 'sync-lease-lost'].includes(error.code)) throw new Meteor.Error('activity-recovery-busy');
      if (['activity-notification-control-conflict', 'activity-notification-control-not-pending', 'activity-notification-cancelled'].includes(error.message)) {
        throw new Meteor.Error('activity-recovery-control-conflict');
      }
      throw new Meteor.Error('activity-recovery-control-failed');
    }
  },
  async cancelActivityNotificationRecovery(request) {
    check(request, { intentId: String, expectedRevision: Number, requestId: String });
    await assertAdmin(this.userId);
    try {
      const result = await cancelActivityNotification({ ...request, actorId: this.userId,
        controls: ActivityNotificationControls.rawCollection(), intents: ActivityNotificationIntents.rawCollection(),
        leases: ActivityNotificationLeases.rawCollection(), assertAdmin: () => assertAdmin(this.userId) });
      try { await cleanupCancelledActivityNotifications(request.intentId, () => assertAdmin(this.userId)); }
      catch (error) { console.error('Cancelled activity payload cleanup incomplete; automatic recovery will retry'); }
      await assertAdmin(this.userId);
      return result;
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      if (['sync-busy', 'sync-lease-lost'].includes(error.code)) throw new Meteor.Error('activity-recovery-busy');
      if (['activity-notification-control-conflict', 'activity-notification-control-not-pending', 'activity-notification-cancelled'].includes(error.message)) {
        throw new Meteor.Error('activity-recovery-control-conflict');
      }
      throw new Meteor.Error('activity-recovery-control-failed');
    }
  },
  async retryActivityNotification(request) {
    check(request, { intentId: String });
    await assertAdmin(this.userId);
    if (!/^[a-f0-9]{64}$/.test(request.intentId)) throw new Meteor.Error('activity-recovery-invalid-request');
    try {
      const status = await resumeActivityNotifications(request.intentId, { assertAllowed: () => assertAdmin(this.userId) });
      await assertAdmin(this.userId);
      return { status };
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      if (['sync-busy', 'sync-lease-lost'].includes(error.code)) throw new Meteor.Error('activity-recovery-busy');
      if (['activity-notification-recipient-denied', 'activity-notification-preference-changed'].includes(error.message)) throw new Meteor.Error('activity-recovery-denied');
      if (error.message === 'activity-notification-activity-unconfirmed') throw new Meteor.Error('activity-recovery-source-unavailable');
      if (error.message === 'activity-notification-cancelled') throw new Meteor.Error('activity-recovery-status-cancelled');
      if (error.message === 'activity-notification-paused') throw new Meteor.Error('activity-recovery-paused');
      if (error.message === 'activity-notifications-disabled') throw new Meteor.Error('activity-recovery-disabled');
      throw new Meteor.Error('activity-recovery-failed');
    }
  },
});
for (const name of ['activityNotificationRecoveryReport', 'retryActivityNotification', 'controlActivityNotificationRecovery', 'cancelActivityNotificationRecovery',
  'cancelActivityNotificationsOlderThan', 'retryAllActivityNotifications']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 30, 10000);
}
