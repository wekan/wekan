import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { EmailJobs, EmailLeases, EmailControls, EmailCommands } from '/server/notifications/emailQueue';
const { emailOutboxReport } = require('/server/lib/emailOutboxReport');
const { controlEmailOutbox } = require('/server/lib/emailOutboxControl');

async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
}
Meteor.methods({
  async emailRecoveryReport(query) {
    check(query, { search: String, page: Number });
    await assertAdmin(this.userId);
    const result = await emailOutboxReport({ jobs: EmailJobs.rawCollection(), controls: EmailControls.rawCollection(),
      users: Meteor.users.rawCollection() }, query);
    await assertAdmin(this.userId);
    return result;
  },
  async controlEmailRecovery(request) {
    check(request, { userId: String, action: String, requestId: String });
    await assertAdmin(this.userId);
    try {
      const result = await controlEmailOutbox({ jobs: EmailJobs.rawCollection(), controls: EmailControls.rawCollection(),
        commands: EmailCommands.rawCollection(), leases: EmailLeases.rawCollection(), ...request,
        actorId: this.userId, assertAdmin: () => assertAdmin(this.userId) });
      await assertAdmin(this.userId);
      return result;
    } catch (error) {
      if (error.error === 'not-authorized') throw error;
      if (['sync-busy', 'sync-lease-lost'].includes(error.code)) throw new Meteor.Error('email-recovery-busy');
      throw new Meteor.Error('email-recovery-failed');
    }
  },
});
for (const name of ['emailRecoveryReport', 'controlEmailRecovery']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 30, 10000);
}
