import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import { ActivityNotificationIntents } from '/server/notifications/activityIntents';
import { ActivityNotificationPlans, ActivityNotificationLeases, ActivityNotificationControls, resumeActivityNotifications, cleanupCancelledActivityNotifications } from '/server/notifications/activityPlans';
const { controlActivityNotification, cancelActivityNotification } = require('/server/lib/activityNotificationControl');
const { activityNotificationReport } = require('/server/lib/activityNotificationReport');
async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
}
Meteor.methods({
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
for (const name of ['activityNotificationRecoveryReport', 'retryActivityNotification', 'controlActivityNotificationRecovery', 'cancelActivityNotificationRecovery']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 30, 10000);
}
