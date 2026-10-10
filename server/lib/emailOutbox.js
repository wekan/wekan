const { randomUUID } = require('node:crypto');
const { idFor, matchesEmailJob } = require('./emailReceiptIdentity');
const { withSyncLease } = require('./syncLease');
const { calculateObjectSize } = require('bson');
const { PAYLOAD_FIELDS } = require('./emailOutboxControl');
const { MAX_EMAIL_ATTEMPTS, emailRetryDecision } = require('./emailRetryPolicy');

const MAX_JOB_BYTES = 15 * 1024 * 1024;
const MAX_DIGEST_BYTES = 4 * 1024 * 1024;

// Raw-driver storage is private to the server. The shared renewable reservation
// primitive uses its own collection here; no list Sync lease is touched.
function createEmailOutbox({ jobs, leases, controls, getUser, send, replyTo, from,
  canReceive = async () => true,
  withDeliverySlot = (work, { assertOwner }) => work({ assertCurrent: assertOwner }), random = Math.random, now = () => new Date(), leaseOptions = {}, delayMs = 30000 }) {
  // #5171: `text` is the plain-text alternative of a clearly arranged item,
  // `groupKey` keeps one e-mail to one board/card/notification, and
  // `deliverAt` (ms) is the scheduled delivery time from the recipient's
  // delivery settings (models/lib/notificationDelivery.js). All three are
  // optional: a job without them is delivered exactly as before.
  async function enqueue({ userId, eventId = randomUUID(), subject, html, language, cardId = null, boardId = null,
    text, groupKey, deliverAt }) {
    if (![userId, eventId, subject, html, language].every(value => typeof value === 'string') ||
        !userId || !eventId || !language || /[\r\n]/.test(subject) ||
        subject.length > 10000 ||
        (cardId !== null && typeof cardId !== 'string') ||
        (boardId !== null && typeof boardId !== 'string') ||
        (text !== undefined && typeof text !== 'string') ||
        (groupKey !== undefined && (typeof groupKey !== 'string' || !groupKey || groupKey.length > 300)) ||
        (deliverAt !== undefined && !Number.isFinite(deliverAt))) throw new Error('invalid-email-job');
    const _id = idFor(userId, eventId), createdAt = now();
    const due = deliverAt !== undefined
      ? new Date(Math.max(deliverAt, createdAt.getTime()))
      : new Date(createdAt.getTime() + delayMs);
    const job = { _id, userId, eventId, subject, html, language, cardId, boardId,
      ...(text !== undefined ? { text } : {}), ...(groupKey !== undefined ? { groupKey } : {}),
      state: 'pending', attempts: 0, cycleAttempts: 0, createdAt,
      nextAttemptAt: due };
    if (calculateObjectSize(job) > MAX_JOB_BYTES) throw new Error('email-job-too-large');
    try { await jobs.insertOne(job); }
    catch (error) {
      // Duplicate events and lost insert acknowledgements are safe only after
      // reading the durable identity. Never overwrite an earlier rendered copy.
      const existing = await jobs.findOne({ _id });
      if (!matchesEmailJob(existing, userId, eventId)) throw error;
    }
    const stored = await jobs.findOne({ _id });
    if (!matchesEmailJob(stored, userId, eventId)) throw new Error('email-job-not-stored');
    return _id;
  }

  async function drainUser(userId) {
    try {
      return await withSyncLease(leases, userId, async ({ assertCurrent: assertRecipient }) =>
        withDeliverySlot(async ({ assertCurrent }) => {
          const control = controls && await controls.findOne({ _id: userId });
          await assertCurrent();
          if (control?.cancelBefore) {
            await jobs.updateMany({ userId, state: { $in: ['pending', 'failed'] }, createdAt: { $lte: control.cancelBefore } }, {
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
          let batch = []; let size = 0; let batchKey;
          // Stream to bound memory even when each queued document is large. A
          // single large event travels alone rather than being silently dropped.
          try {
            for await (const job of cursor) {
              // #5171: one e-mail carries one group. Jobs without a key are
              // the built-in "everything due for this recipient" group; other
              // groups wait for the next pass (a second later).
              const key = job.groupKey ?? null;
              if (batchKey === undefined) batchKey = key;
              else if (key !== batchKey) continue;
              const bytes = Buffer.byteLength(job.html);
              if (batch.length && size + bytes > MAX_DIGEST_BYTES) break;
              batch.push(job); size += bytes;
            }
          } finally { await cursor.close(); }
          if (!batch.length) return;
          const attemptId = randomUUID(), reserved = [];
          for (const job of batch) {
            await assertCurrent();
            const previous = job.cycleAttempts ?? job.attempts ?? 0;
            if (!Number.isSafeInteger(previous) || previous < 0) throw new Error('invalid-email-attempt-count');
            const selector = { _id: job._id, userId, state: 'pending',
              cycleAttempts: job.cycleAttempts ?? { $exists: false },
              retryRequestId: job.retryRequestId ?? { $exists: false } };
            if (previous >= MAX_EMAIL_ATTEMPTS) {
              await jobs.updateOne(selector, { $set: { state: 'failed', lastFailure: 'retry-limit', failedAt: now() },
                $unset: { nextAttemptAt: '' } });
              continue;
            }
            const cycleAttempts = previous + 1;
            try {
              await jobs.updateOne(selector, { $set: { cycleAttempts, attemptId, lastAttemptAt: now() } });
            } catch (error) {
              if (!await jobs.findOne({ _id: job._id, userId, state: 'pending', attemptId, cycleAttempts })) throw error;
            }
            if (!await jobs.findOne({ _id: job._id, userId, state: 'pending', attemptId, cycleAttempts })) {
              throw new Error('email-attempt-not-stored');
            }
            reserved.push({ ...job, cycleAttempts });
          }
          batch = reserved;
          if (!batch.length) return;
          let phase = 'preparation';
          let ids = batch.map(job => job._id);
          let selector = { _id: { $in: ids }, userId, state: 'pending', attemptId };
          try {
            const user = await getUser(userId);
            await assertCurrent();
            if (!user) {
              await jobs.updateMany(selector, { $set: { state: 'cancelled', finishedAt: now() },
                $unset: { html: '', text: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '' } });
              return;
            }
            const permitted = [], cancelled = [];
            for (const job of batch) {
              if (await canReceive(user, job)) permitted.push(job);
              else cancelled.push(job._id);
            }
            await assertCurrent();
            if (cancelled.length) await jobs.updateMany({ _id: { $in: cancelled }, userId, state: 'pending', attemptId }, {
              $set: { state: 'cancelled', finishedAt: now() },
              $unset: { html: '', text: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '' },
            });
            batch = permitted;
            if (!batch.length) return;
            ids = batch.map(job => job._id);
            selector = { _id: { $in: ids }, userId, state: 'pending', attemptId };
            const address = user.emails?.[0]?.address;
            if (user.loginDisabled || typeof address !== 'string' || !address) throw Object.assign(new Error('Email recipient unavailable'), { code: 'email-recipient-unavailable' });
            const first = batch[0], last = [...batch].reverse().find(job => job.cardId);
            await assertCurrent();
            phase = 'smtp';
            // #5171: a plain-text alternative only when every item has one.
            const plain = batch.every(job => typeof job.text === 'string')
              ? { text: batch.map(job => job.text).join('\n\n') } : {};
            const result = await send({ to: address.toLowerCase(), from: from(), subject: first.subject,
              html: batch.map(job => job.html).join('<br/>\n\n'), language: first.language, ...plain,
              userId, replyTo: replyTo(last?.cardId, userId) });
            // Meteor's development console output and hook-suppressed sends can
            // resolve without delivering mail. Only a transport's accepted
            // recipient is evidence sufficient to retire a queued digest.
            if (!result?.accepted?.some(value => {
              const accepted = typeof value === 'string' ? value : value?.address;
              return typeof accepted === 'string' && accepted.toLowerCase() === address.toLowerCase();
            })) throw Object.assign(new Error('Email acceptance not confirmed'), { code: 'email-not-accepted' });
            phase = 'acknowledgement';
            await assertCurrent();
            await jobs.updateMany(selector, { $set: { state: 'sent', finishedAt: now() },
              $unset: { html: '', text: '', subject: '', language: '', cardId: '', nextAttemptAt: '', lastFailure: '' } });
            const confirmed = await jobs.countDocuments({ _id: { $in: ids }, userId, state: 'sent' });
            if (confirmed !== ids.length) throw new Error('email-acknowledgement-incomplete');
          } catch (error) {
            await assertCurrent();
            // Retry only still-pending rows, including a partially acknowledged
            // batch. No raw SMTP errors, addresses or credentials enter diagnostics.
            for (const job of batch) {
              const attempts = Math.min(Number.MAX_SAFE_INTEGER, (job.attempts || 0) + 1);
              const decision = emailRetryDecision(error, phase, job.cycleAttempts, now(), random);
              await jobs.updateOne({ _id: job._id, userId, state: 'pending', attemptId }, {
                $set: { attempts, ...decision },
                $unset: decision.state === 'failed' ? { nextAttemptAt: '' } : { failedAt: '' },
              });
            }
          }
        }, { assertOwner: assertRecipient }), { ...leaseOptions, now });
    } catch (error) {
      if (error.code === 'email-capacity-busy') return 'capacity-busy';
      if (!['sync-busy', 'sync-lease-lost'].includes(error.code)) throw error;
      // Another worker owns this recipient, or this worker lost its reservation.
      // Its pending jobs remain discoverable by subsequent scans.
    }
  }

  let draining;
  async function drainBatch() {
    // Select recipients, not the first hundred messages: one large backlog
    // must not hide everyone else. Keep payloads out of this scheduling query.
    const due = await jobs.aggregate([
      { $match: { state: 'pending', nextAttemptAt: { $lte: now() } } },
      { $group: { _id: '$userId', nextAttemptAt: { $min: '$nextAttemptAt' } } },
      { $sort: { nextAttemptAt: 1, _id: 1 } },
      { $limit: 100 },
    ]).toArray();
    let next = 0;
    async function worker() {
      while (next < due.length) {
        const userId = due[next++]._id;
        try { if (await drainUser(userId) === 'capacity-busy') return; }
        catch (error) { console.error('Email outbox recipient failed; pending jobs retained'); }
      }
    }
    // Four independent recipients can progress while another SMTP request is
    // slow. The per-recipient distributed lease still excludes other senders.
    await Promise.all(Array.from({ length: Math.min(4, due.length) }, worker));
  }
  function drain() {
    // Concurrent callers share this pass instead of multiplying its pool.
    if (!draining) draining = drainBatch().finally(() => { draining = null; });
    return draining;
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
