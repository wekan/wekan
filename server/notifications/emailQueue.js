import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import EmailLocalization from '/server/lib/emailLocalization';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
import { ensureIndex } from '/server/lib/mongoStartup';
const { createEmailOutbox, migrateLegacyEmailBuffer } = require('/server/lib/emailOutbox');
const { createEmailReceiptMaintenance, emailReceiptPolicy } = require('/server/lib/emailReceiptRetention');
const { createEmailSendSlots } = require('/server/lib/emailSendSlots');
const { buildReplyToAddress } = require('/server/lib/inboundEmailReplyToken');

// Mail payloads remain private; admin methods expose only recipient summaries.
export const EmailJobs = new Mongo.Collection('notificationEmailJobs');
export const EmailLeases = new Mongo.Collection('notificationEmailLeases');
export const EmailControls = new Mongo.Collection('notificationEmailControls');
export const EmailCommands = new Mongo.Collection('notificationEmailCommands');
export const EmailSendSlots = new Mongo.Collection('notificationEmailSendSlots');
for (const collection of [EmailJobs, EmailLeases, EmailControls, EmailCommands, EmailSendSlots]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}
const configuredDelay = Number(process.env.EMAIL_NOTIFICATION_TIMEOUT);
const delayMs = Number.isFinite(configuredDelay) && configuredDelay > 0 ? configuredDelay : 30000;
// #5171: the immediate e-mail delay, which a quiet-hours window starts from.
export const emailDelayMs = delayMs;
export const emailOutbox = createEmailOutbox({
  withDeliverySlot: createEmailSendSlots(EmailSendSlots.rawCollection()),
  jobs: EmailJobs.rawCollection(), controls: EmailControls.rawCollection(), leases: EmailLeases.rawCollection(), delayMs,
  getUser: id => ReactiveCache.getUser(id),
  send: mail => EmailLocalization.sendEmail(mail),
  canReceive: async (user, job) => {
    // Legacy profile buffers have no board identity to re-check. New jobs
    // must still belong to an active member when the deferred send occurs.
    const board = job.boardId ? await ReactiveCache.getBoard(job.boardId) : null;
    if (job.boardId && !board?.members?.some(member => member.userId === user._id && member.isActive === true)) return false;
    if (!job.boardId) return user.profile?.notifyOverrideEmail !== false;
    const setting = await ReactiveCache.getCurrentSetting();
    return resolveNotificationSetting('email', { adminDefault: setting?.notifyDefaultEmail,
      boardOverride: board?.notifyOverrideEmail, memberOverride: user.profile?.notifyOverrideEmail });
  },
  from: () => Accounts.emailTemplates.from,
  // ReplyBleed (GHSA-mc7c-cv99-64h7): the address names the card AND this
  // recipient, and expires, so a reply is attributed to the person it was
  // sent to - never to whatever From address the reply claims.
  replyTo: (cardId, userId) => {
    const secret = process.env.INBOUND_EMAIL_HMAC_SECRET, domain = process.env.INBOUND_EMAIL_DOMAIN;
    if (!cardId || !userId || !secret || !domain) return '';
    try { return buildReplyToAddress({ cardId, userId, secret, domain }); } catch (error) { return ''; }
  },
});

const receiptPolicy = emailReceiptPolicy();
export const maintainEmailReceipts = createEmailReceiptMaintenance({
  jobs: EmailJobs.rawCollection(), commands: EmailCommands.rawCollection(), days: receiptPolicy.days,
});
Meteor.startup(async () => {
  await ensureIndex(EmailJobs, { state: 1, nextAttemptAt: 1, _id: 1 });
  await ensureIndex(EmailJobs, { userId: 1, state: 1, createdAt: 1, _id: 1 });
  await ensureIndex(EmailControls, { paused: 1, _id: 1 });
  await ensureIndex(EmailJobs, { state: 1, compactReceiptVersion: 1, finishedAt: 1, _id: 1 });
  await ensureIndex(EmailCommands, { status: 1, compactReceiptVersion: 1, finishedAt: 1, _id: 1 });
  async function maintainReceipts() {
    try { await maintainEmailReceipts(); }
    catch (error) { console.error('Email receipt maintenance failed; replay protection retained'); }
    finally { Meteor.setTimeout(maintainReceipts, receiptPolicy.intervalMs); }
  }
  Meteor.setTimeout(maintainReceipts, receiptPolicy.intervalMs);
  await ensureIndex(Meteor.users, { 'profile.emailBuffer.0': 1 });
  // Polling discovers both new jobs and pre-restart work. Schedule after each
  // pass so a slow SMTP server cannot accumulate overlapping scans.
  async function scan() {
    try {
      const users = await Meteor.users.find({ 'profile.emailBuffer.0': { $exists: true } },
        { fields: { 'profile.emailBuffer': 1, 'profile.language': 1 }, limit: 100 }).fetchAsync();
      for (const user of users) {
        try {
          await migrateLegacyEmailBuffer(emailOutbox, user, (id, texts) => Meteor.users.rawCollection()
            .updateOne({ _id: id }, { $pullAll: { 'profile.emailBuffer': texts } }));
        } catch (error) {
          console.error('Legacy email buffer migration failed; original text retained');
        }
      }
      await emailOutbox.drain();
    } catch (error) {
      console.error('Email outbox scan failed; pending mail will be retried');
    } finally {
      Meteor.setTimeout(scan, 1000);
    }
  }
  await scan();
});
