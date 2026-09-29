import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Email, EmailInternals } from 'meteor/email';
import { SyncRuleEmailAttempts, SyncRuleEmailCommands, SyncRuleEmailOutcomes, SyncRuleEmailResolutions } from '/server/notifications/storedRulePlans';
import { EmailSendSlots } from '/server/notifications/emailQueue';
import { SyncRulePlans } from '/server/notifications/storedRulePlans';
import Activities from '/models/activities';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Rules from '/models/rules';
import Actions from '/models/actions';
import { RulesHelper } from '/server/rulesHelper';
const { syncRuleEmailReport } = require('/server/lib/syncRuleEmailReport');
const { ruleEmailRecoveryDetail, resolveRuleEmailAttempt,
  resendUnconfirmedRuleEmail } = require('/server/lib/syncRuleEmailResolution');
const { withSyncLease } = require('/server/lib/syncLease');
const { listLegacyRuleEmailCommands, rebindLegacyRuleEmailCommand,
  discardLegacyRuleEmailCommand } = require('/server/lib/syncRuleEmailLegacy');
const { canonical } = require('/models/lib/changeHistoryIntegrity');
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
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
  if (error?.reason && /^[a-z-]+$/.test(error.reason) && error.message === `rule-email-legacy-${error.reason}`) {
    return new Meteor.Error(`rule-email-legacy-${error.reason}`);
  }
  if (error?.message === 'rule-email-legacy-access-denied') return new Meteor.Error('rule-email-legacy-access-denied');
  if (error?.code === 'sync-busy') return new Meteor.Error('rule-email-resolution-busy');
  return new Meteor.Error('rule-email-resolution-failed');
}
const legacyCollections = () => ({ commands: SyncRuleEmailCommands.rawCollection(), plans: SyncRulePlans.rawCollection(),
  attempts: SyncRuleEmailAttempts.rawCollection(), resolutions: SyncRuleEmailResolutions.rawCollection() });
// The re-bind re-checks what a stored rule run checks: the rule's actor is
// still enabled with write access to the card, and the rule and its action
// are exactly what the plan captured.
async function assertLegacyAccess({ activity, invocation }) {
  const denied = () => { throw new Error('rule-email-legacy-access-denied'); };
  const [user, board, card, rule, action] = await Promise.all([
    Meteor.users.findOneAsync(activity.userId), Boards.findOneAsync(activity.boardId),
    Cards.findOneAsync({ _id: activity.cardId, boardId: activity.boardId }),
    Rules.rawCollection().findOne({ _id: invocation.rule._id }), Actions.rawCollection().findOne({ _id: invocation.action?._id }),
  ]);
  if (!user || user.loginDisabled || !board || !card || !memberCan(board.members, user._id, 'write') ||
      (isAssignedOnlyMember(board, user._id) && !card.assignees?.includes(user._id))) denied();
  if (!rule || !action || canonical(rule) !== canonical(invocation.rule) || canonical(action) !== canonical(invocation.action)) denied();
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
  async syncRuleEmailLegacyList(page) {
    check(page, Match.Where(value => Number.isSafeInteger(value) && value >= 0));
    await assertAdmin(this.userId);
    try { return await listLegacyRuleEmailCommands({ ...legacyCollections(), page }); } catch (error) { throw translate(error); }
  },
  async syncRuleEmailLegacyRebind(commandId) {
    check(commandId, CommandId);
    const admin = await assertAdmin(this.userId);
    try {
      return await exclusive(commandId, async ({ assertCurrent }) => {
        await assertCurrent();
        return rebindLegacyRuleEmailCommand({ ...legacyCollections(), commandId, operator: admin.username || admin._id,
          readActivity: id => Activities.findOneAsync(id, { transform: null }), assertAccess: assertLegacyAccess,
          prepare: (activity, action) => RulesHelper.prepareEmailCommand(activity, action) });
      });
    } catch (error) { throw translate(error); }
  },
  async syncRuleEmailLegacyDiscard(commandId) {
    check(commandId, CommandId);
    const admin = await assertAdmin(this.userId);
    try {
      return await exclusive(commandId, async ({ assertCurrent }) => {
        await assertCurrent();
        return discardLegacyRuleEmailCommand({ ...legacyCollections(), commandId, operator: admin.username || admin._id });
      });
    } catch (error) { throw translate(error); }
  },
});
DDPRateLimiter.addRule({ name: 'syncRuleEmailRecoveryReport', type: 'method', connectionId() { return true; } }, 30, 10000);
for (const name of ['syncRuleEmailRecoveryDetail', 'syncRuleEmailRecoveryResolve', 'syncRuleEmailRecoveryResend',
  'syncRuleEmailLegacyList', 'syncRuleEmailLegacyRebind', 'syncRuleEmailLegacyDiscard']) {
  DDPRateLimiter.addRule({ name, type: 'method', connectionId() { return true; } }, 10, 10000);
}
