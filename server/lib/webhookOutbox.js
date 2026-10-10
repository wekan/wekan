'use strict';
// #3695: the durable queue for outgoing webhooks whose delivery settings group
// or schedule them (models/lib/notificationDelivery.js). A webhook with the
// built-in settings never enters it: it is still POSTed at once, as before.
//
// Each queued notification is one job, stored before anything is sent, with
// the time it is due. A pass takes, per webhook, the due jobs of one group,
// POSTs them as one request (models/lib/webhookPayload.js
// combineWebhookBodies), and marks them sent only after a 2xx answer, so a
// restart in the middle loses nothing; a job that failed is retried with
// backoff. Like e-mail, delivery is at-least-once: a crash between the HTTP
// answer and the acknowledgement repeats that one request.
//
// The request goes to the webhook as it is AT DELIVERY: a deleted, disabled
// or two-way webhook cancels its queued jobs, and the current URL and token
// are used - a queued job never carries a credential of its own.
const { createHash, randomUUID } = require('node:crypto');
const { withSyncLease } = require('./syncLease');
const { combineWebhookBodies } = require('../../models/lib/webhookPayload');

const MAX_ATTEMPTS = 10;
const MAX_BATCH = 100;
const MAX_BODY_BYTES = 1024 * 1024;

const jobIdFor = (integrationId, eventId) =>
  createHash('sha256').update(JSON.stringify(['webhook-job', integrationId, eventId])).digest('hex');

function retryDelayMs(attempts) {
  return Math.min(60 * 60000, 30000 * 2 ** Math.max(0, attempts - 1));
}

function createWebhookOutbox({ jobs, leases, getIntegration, post, now = () => new Date(), oneWayType = 'outgoing-webhooks',
  leaseOptions = {} }) {
  // Store one prepared body. `deliverAt` is the time from the webhook's
  // schedule; `groupKey` the group it is sent with.
  async function enqueue({ integrationId, eventId, groupKey, body, deliverAt }) {
    if (![integrationId, eventId, groupKey].every(v => typeof v === 'string' && v && v.length <= 300) ||
        !body || typeof body !== 'object' || Array.isArray(body) || !Number.isFinite(deliverAt)) {
      throw new Error('invalid-webhook-job');
    }
    if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) throw new Error('webhook-job-too-large');
    const createdAt = now();
    const _id = jobIdFor(integrationId, eventId);
    const job = { _id, integrationId, eventId, groupKey, body, state: 'pending', attempts: 0, createdAt,
      nextAttemptAt: new Date(Math.max(deliverAt, createdAt.getTime())) };
    try {
      await jobs.insertOne(job);
    } catch (error) {
      // The same event for the same webhook is stored once, never overwritten.
      const existing = await jobs.findOne({ _id });
      if (!existing || existing.integrationId !== integrationId || existing.eventId !== eventId) throw error;
    }
    return _id;
  }

  async function finish(ids, attemptId, state, extra = {}) {
    await jobs.updateMany({ _id: { $in: ids }, state: 'pending', attemptId },
      { $set: { state, finishedAt: now(), ...extra }, $unset: { body: '', nextAttemptAt: '' } });
  }

  async function drainIntegration(integrationId) {
    try {
      return await withSyncLease(leases, `webhook:${integrationId}`, async ({ assertCurrent }) => {
        const due = await jobs.find({ integrationId, state: 'pending', nextAttemptAt: { $lte: now() } })
          .sort({ nextAttemptAt: 1, createdAt: 1, _id: 1 }).limit(MAX_BATCH).toArray();
        if (!due.length) return;
        const groupKey = due[0].groupKey;
        const batch = due.filter(job => job.groupKey === groupKey);
        const attemptId = randomUUID();
        const ids = batch.map(job => job._id);
        await assertCurrent();
        await jobs.updateMany({ _id: { $in: ids }, state: 'pending' }, { $set: { attemptId } });
        const integration = await getIntegration(integrationId);
        await assertCurrent();
        if (!integration || integration.enabled === false || integration.type !== oneWayType || !integration.url) {
          await finish(ids, attemptId, 'cancelled');
          return;
        }
        const headers = { 'Content-Type': 'application/json' };
        if (integration.token) headers['X-Wekan-Token'] = integration.token;
        let ok = false;
        try {
          const response = await post(integration.url, {
            method: 'POST', headers, body: JSON.stringify(combineWebhookBodies(batch.map(job => job.body))),
          });
          ok = !!response && response.status >= 200 && response.status < 300;
        } catch (error) {
          ok = false;
        }
        await assertCurrent();
        if (ok) {
          await finish(ids, attemptId, 'sent');
          return;
        }
        for (const job of batch) {
          const attempts = (job.attempts || 0) + 1;
          if (attempts >= MAX_ATTEMPTS) {
            await finish([job._id], attemptId, 'failed', { attempts });
          } else {
            await jobs.updateOne({ _id: job._id, state: 'pending', attemptId }, {
              $set: { attempts, nextAttemptAt: new Date(now().getTime() + retryDelayMs(attempts)) },
            });
          }
        }
      }, { ...leaseOptions, now });
    } catch (error) {
      if (['sync-busy', 'sync-lease-lost'].includes(error.code)) return undefined;
      throw error;
    }
  }

  async function drain() {
    const due = await jobs.aggregate([
      { $match: { state: 'pending', nextAttemptAt: { $lte: now() } } },
      { $group: { _id: '$integrationId', nextAttemptAt: { $min: '$nextAttemptAt' } } },
      { $sort: { nextAttemptAt: 1, _id: 1 } },
      { $limit: 100 },
    ]).toArray();
    for (const row of due) {
      try { await drainIntegration(row._id); }
      catch (error) { console.error('Webhook queue: delivery failed; queued jobs retained'); }
    }
  }

  return { enqueue, drain, drainIntegration };
}

module.exports = { createWebhookOutbox, jobIdFor, retryDelayMs, MAX_ATTEMPTS };
