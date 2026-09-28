import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Activities from '/models/activities';
import { ActivityNotificationIntents } from '/server/notifications/activityIntents';
import { ActivityNotificationPlans, ActivityNotificationLeases, resumeActivityNotifications } from '/server/notifications/activityPlans';
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
        activities: Activities.rawCollection(), plans: ActivityNotificationPlans.rawCollection(), leases: ActivityNotificationLeases.rawCollection() }, query);
      await assertAdmin(this.userId);
      return result;
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      throw new Meteor.Error('activity-recovery-unavailable');
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
      if (error.message === 'activity-notifications-disabled') throw new Meteor.Error('activity-recovery-disabled');
      throw new Meteor.Error('activity-recovery-failed');
    }
  },
});
for (const name of ['activityNotificationRecoveryReport', 'retryActivityNotification']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 30, 10000);
}
