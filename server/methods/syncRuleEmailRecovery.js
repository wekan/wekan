import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Email, EmailInternals } from 'meteor/email';
import { SyncRuleEmailAttempts, SyncRuleEmailCommands, SyncRuleEmailOutcomes, SyncRuleEmailResolutions } from '/server/notifications/storedRulePlans';
import { EmailSendSlots } from '/server/notifications/emailQueue';
const { syncRuleEmailReport } = require('/server/lib/syncRuleEmailReport');
const { ruleEmailRecoveryDetail, resolveRuleEmailAttempt,
  resendUnconfirmedRuleEmail } = require('/server/lib/syncRuleEmailResolution');
const { withSyncLease } = require('/server/lib/syncLease');
const { createEmailSendSlots } = require('/server/lib/emailSendSlots');
const withEmailSlot = createEmailSendSlots(EmailSendSlots.rawCollection());
const CommandId = Match.Where(value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value));
async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1, username: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
  return user;
}
const collections = () => ({ attempts: SyncRuleEmailAttempts.rawCollection(), commands: SyncRuleEmailCommands.rawCollection(),
  outcomes: SyncRuleEmailOutcomes.rawCollection(), resolutions: SyncRuleEmailResolutions.rawCollection(),
  MailComposer: EmailInternals.NpmModules.mailcomposer.module });
// Known refusals keep their reason so the page can say why; anything else is
// reported without its text, which may carry addresses or SMTP details.
function translate(error) {
  if (error?.error === 'not-authorized') return error;
  if (error?.reason && /^[a-z-]+$/.test(error.reason) && error.message === `rule-email-resolution-${error.reason}`) {
    return new Meteor.Error(`rule-email-resolution-${error.reason}`);
  }
  if (error?.code === 'sync-busy') return new Meteor.Error('rule-email-resolution-busy');
  return new Meteor.Error('rule-email-resolution-failed');
}
// One administrator decision per command at a time, across server processes.
async function exclusive(commandId, work) {
  return withSyncLease(EmailSendSlots.rawCollection(), `rule-email-resolve-${commandId}`, work);
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
  async syncRuleEmailRecoveryDetail(commandId) {
    check(commandId, CommandId);
    await assertAdmin(this.userId);
    try { return await ruleEmailRecoveryDetail({ ...collections(), commandId }); } catch (error) { throw translate(error); }
  },
  async syncRuleEmailRecoveryResolve({ commandId, decision }) {
    check(commandId, CommandId);
    check(decision, Match.OneOf('mark-sent', 'drop'));
    const admin = await assertAdmin(this.userId);
    try {
      return await exclusive(commandId, async ({ assertCurrent }) => {
        await assertCurrent();
        return resolveRuleEmailAttempt({ ...collections(), commandId, decision, operator: admin.username || admin._id });
      });
    } catch (error) { throw translate(error); }
  },
  async syncRuleEmailRecoveryResend(commandId) {
    check(commandId, CommandId);
    const admin = await assertAdmin(this.userId);
    try {
      return await exclusive(commandId, lease => withEmailSlot(({ assertCurrent }) =>
        resendUnconfirmedRuleEmail({ ...collections(), commandId, operator: admin.username || admin._id,
          assertCurrent, send: mail => Email.sendAsync(mail) }), { assertOwner: lease.assertCurrent }));
    } catch (error) { throw translate(error); }
  },
});
DDPRateLimiter.addRule({ name: 'syncRuleEmailRecoveryReport', type: 'method', connectionId() { return true; } }, 30, 10000);
for (const name of ['syncRuleEmailRecoveryDetail', 'syncRuleEmailRecoveryResolve', 'syncRuleEmailRecoveryResend']) {
  DDPRateLimiter.addRule({ name, type: 'method', connectionId() { return true; } }, 10, 10000);
}
