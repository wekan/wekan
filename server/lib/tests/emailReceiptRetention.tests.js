import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Meteor } from 'meteor/meteor';
import { EmailJobs, EmailCommands, emailOutbox } from '/server/notifications/emailQueue';
const { idFor } = require('/server/lib/emailReceiptIdentity');

// Run with EMAIL_RECEIPT_SWEEP_INTERVAL_MS=1000. Observe the real startup
// scheduler rather than invoking maintenance directly or replacing timers.
describe('Email receipt retention in Meteor', function () {
  this.timeout(15000);
  it('scheduled compaction retains event replay protection and command identities', async function () {
    if (!Meteor.isAppTest || process.env.EMAIL_RECEIPT_SWEEP_INTERVAL_MS !== '1000') this.skip();
    const userId = `retention-${randomUUID()}`, eventId = randomUUID(), requestId = randomUUID();
    const jobs = EmailJobs.rawCollection(), commands = EmailCommands.rawCollection();
    const _id = idFor(userId, eventId), finishedAt = new Date('2000-01-01');
    try {
      await jobs.insertOne({ _id, userId, eventId, state: 'sent', finishedAt, html: 'old private content' });
      await commands.insertOne({ _id: requestId, userId, actorId: 'old-admin', action: 'cancel', status: 'completed', finishedAt });
      const until = Date.now() + 10000;
      while (Date.now() < until) {
        if ((await jobs.findOne({ _id }))?.compactReceiptVersion === 1 &&
            (await commands.findOne({ _id: requestId }))?.compactReceiptVersion === 1) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      assert.deepEqual(await jobs.findOne({ _id }), { _id, state: 'sent', compactReceiptVersion: 1 });
      assert.equal((await commands.findOne({ _id: requestId })).compactReceiptVersion, 1);
      assert.equal(await emailOutbox.enqueue({ userId, eventId, subject: 'replay', html: 'replay', language: 'en' }), _id);
      assert.deepEqual(await jobs.findOne({ _id }), { _id, state: 'sent', compactReceiptVersion: 1 });
    } finally {
      await jobs.deleteOne({ _id });
      await commands.deleteOne({ _id: requestId });
    }
  });
});
