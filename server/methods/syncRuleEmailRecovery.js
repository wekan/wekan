import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { SyncRuleEmailAttempts } from '/server/notifications/storedRulePlans';
const { syncRuleEmailReport } = require('/server/lib/syncRuleEmailReport');
async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
}
Meteor.methods({
  async syncRuleEmailRecoveryReport(query) {
    check(query, { search: String, page: Number, status: String });
    await assertAdmin(this.userId);
    try {
      const result = await syncRuleEmailReport(SyncRuleEmailAttempts.rawCollection(), query);
      await assertAdmin(this.userId);
      return result;
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      throw new Meteor.Error('sync-rule-email-report-unavailable');
    }
  },
});
DDPRateLimiter.addRule({ name: 'syncRuleEmailRecoveryReport', type: 'method', connectionId() { return true; } }, 30, 10000);
