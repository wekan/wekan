const { createHash, randomUUID } = require('node:crypto');
const { withSyncLease } = require('./syncLease');
const { calculateObjectSize } = require('bson');
const { PAYLOAD_FIELDS } = require('./emailOutboxControl');

const idFor = (userId, eventId) => createHash('sha256').update(JSON.stringify([userId, eventId])).digest('hex');
const MAX_JOB_BYTES = 15 * 1024 * 1024;
const MAX_DIGEST_BYTES = 4 * 1024 * 1024;
const RETRY_MS = 5000;

// Raw-driver storage is private to the server. The shared renewable reservation
// primitive uses its own collection here; no list Sync lease is touched.
function createEmailOutbox({ jobs, leases, controls, getUser, send, replyTo, from,
  canReceive = async () => true, now = () => new Date(), leaseOptions = {}, delayMs = 30000 }) {
  async function enqueue({ userId, eventId = randomUUID(), subject, html, language, cardId = null, boardId = null }) {
    if (![userId, eventId, subject, html, language].every(value => typeof value === 'string') ||
        !userId || !eventId || !language || /[\r\n]/.test(subject) ||
        subject.length > 10000 ||
        (cardId !== null && typeof cardId !== 'string') ||
        (boardId !== null && typeof boardId !== 'string')) throw new Error('invalid-email-job');
    const _id = idFor(userId, eventId), createdAt = now();
    const job = { _id, userId, eventId, subject, html, language, cardId, boardId,
      state: 'pending', attempts: 0, createdAt,
      nextAttemptAt: new Date(createdAt.getTime() + delayMs) };
    if (calculateObjectSize(job) > MAX_JOB_BYTES) throw new Error('email-job-too-large');
    try { await jobs.insertOne(job); }
    catch (error) {
      // Duplicate events and lost insert acknowledgements are safe only after
      // reading the durable identity. Never overwrite an earlier rendered copy.
      const existing = await jobs.findOne({ _id });
      if (!existing || existing.userId !== userId || existing.eventId !== eventId) throw error;
    }
    const stored = await jobs.findOne({ _id });
    if (!stored || stored.userId !== userId || stored.eventId !== eventId) throw new Error('email-job-not-stored');
    return _id;
  }

  async function drainUser(userId) {
    try {
      return await withSyncLease(leases, userId, async ({ assertCurrent }) => {
        const control = controls && await controls.findOne({ _id: userId });
        await assertCurrent();
        if (control?.cancelBefore) {
          await jobs.updateMany({ userId, state: 'pending', createdAt: { $lte: control.cancelBefore } }, {
            $set: { state: 'cancelled', finishedAt: now() }, $unset: PAYLOAD_FIELDS,
          });
          await assertCurrent();
        }
        if (control?.paused) {
          // Do not let held mail monopolize the next due scan. Resume explicitly
          // wakes existing jobs, and new jobs still consult this durable flag.
          await jobs.updateMany({ userId, state: 'pending' }, {
            $max: { nextAttemptAt: new Date(now().getTime() + 60000) },
          });
          return;
        }
        const cursor = jobs.find({ userId, state: 'pending', nextAttemptAt: { $lte: now() },
          ...(control?.cancelBefore ? { createdAt: { $gt: control.cancelBefore } } : {}) })
          .sort({ createdAt: 1, _id: 1 }).limit(100).batchSize(1);
        let batch = []; let size = 0;
        // Stream to bound memory even when each queued document is large. A
        // single large event travels alone rather than being silently dropped.
        try {
          for await (const job of cursor) {
            const bytes = Buffer.byteLength(job.html);
            if (batch.length && size + bytes > MAX_DIGEST_BYTES) break;
            batch.push(job); size += bytes;
          }
        } finally { await cursor.close(); }
        if (!batch.length) return;
        let ids = batch.map(job => job._id);
        let selector = { _id: { $in: ids }, userId, state: 'pending' };
        try {
          const user = await getUser(userId);
          await assertCurrent();
          if (!user) {
            await jobs.updateMany(selector, { $set: { state: 'cancelled', finishedAt: now() },
              $unset: { html: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '' } });
            return;
          }
          const permitted = [], cancelled = [];
          for (const job of batch) {
            if (await canReceive(user, job)) permitted.push(job);
            else cancelled.push(job._id);
          }
          await assertCurrent();
          if (cancelled.length) await jobs.updateMany({ _id: { $in: cancelled }, userId, state: 'pending' }, {
            $set: { state: 'cancelled', finishedAt: now() },
            $unset: { html: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '' },
          });
          batch = permitted;
          if (!batch.length) return;
          ids = batch.map(job => job._id);
          selector = { _id: { $in: ids }, userId, state: 'pending' };
          const address = user.emails?.[0]?.address;
          if (user.loginDisabled || typeof address !== 'string' || !address) throw new Error('email-recipient-unavailable');
          const first = batch[0], last = [...batch].reverse().find(job => job.cardId);
          await assertCurrent();
          const result = await send({ to: address.toLowerCase(), from: from(), subject: first.subject,
            html: batch.map(job => job.html).join('<br/>\n\n'), language: first.language,
            userId, replyTo: replyTo(last?.cardId) });
          // Meteor's development console output and hook-suppressed sends can
          // resolve without delivering mail. Only a transport's accepted
          // recipient is evidence sufficient to retire a queued digest.
          if (!result?.accepted?.some(value => {
            const accepted = typeof value === 'string' ? value : value?.address;
            return typeof accepted === 'string' && accepted.toLowerCase() === address.toLowerCase();
          })) throw new Error('email-not-accepted');
          await assertCurrent();
          await jobs.updateMany(selector, { $set: { state: 'sent', finishedAt: now() },
            $unset: { html: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '' } });
          const confirmed = await jobs.countDocuments({ _id: { $in: ids }, userId, state: 'sent' });
          if (confirmed !== ids.length) throw new Error('email-acknowledgement-incomplete');
        } catch (error) {
          await assertCurrent();
          // Retry only still-pending rows, including a partially acknowledged
          // batch. No raw SMTP errors, addresses or credentials enter diagnostics.
          for (const job of batch) {
            const attempts = Math.min(1000, (job.attempts || 0) + 1);
            await jobs.updateOne({ _id: job._id, userId, state: 'pending' }, {
              $set: { attempts, lastFailure: 'delivery-failed',
                nextAttemptAt: new Date(now().getTime() + Math.min(3600000, RETRY_MS * 2 ** Math.min(attempts - 1, 10))) },
            });
          }
        }
      }, { ...leaseOptions, now });
    } catch (error) {
      if (!['sync-busy', 'sync-lease-lost'].includes(error.code)) throw error;
      // Another worker owns this recipient, or this worker lost its reservation.
      // Its pending jobs remain discoverable by subsequent scans.
    }
  }

  async function drain() {
    const due = await jobs.find({ state: 'pending', nextAttemptAt: { $lte: now() } },
      { projection: { userId: 1 } }).sort({ nextAttemptAt: 1, _id: 1 }).limit(100).toArray();
    for (const userId of new Set(due.map(job => job.userId))) {
      try { await drainUser(userId); }
      catch (error) { console.error('Email outbox recipient failed; pending jobs retained'); }
    }
  }
  async function hasPending(userId) {
    return !!await jobs.findOne({ userId, state: 'pending' }, { projection: { _id: 1 } });
  }
  return { enqueue, drain, drainUser, hasPending };
}

// Older profile buffers lack subject/card metadata. Preserve their rendered
// text with a neutral subject, and remove them only after every insert is read
// back. Stable identities make an interrupted migration repeatable.
async function migrateLegacyEmailBuffer(outbox, user, clear) {
  const texts = [...(user.profile?.emailBuffer || [])];
  for (const html of texts) {
    await outbox.enqueue({ userId: user._id, eventId: `legacy:${idFor(user._id, html)}`,
      subject: 'WeKan', html, language: user.getLanguage() || 'en' });
  }
  if (texts.length) await clear(user._id, texts);
}
module.exports = { createEmailOutbox, migrateLegacyEmailBuffer, idFor };
