import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import Integrations from '/models/integrations';
import { ensureIndex } from '/server/lib/mongoStartup';
import { fetchSafe } from '/server/lib/ssrfGuard';
const { createWebhookOutbox } = require('/server/lib/webhookOutbox');

// #3695: grouped and scheduled outgoing webhooks (server/lib/webhookOutbox.js).
// Queued bodies are server-private: no client can read or write them.
export const WebhookJobs = new Mongo.Collection('notificationWebhookJobs');
export const WebhookLeases = new Mongo.Collection('notificationWebhookLeases');
for (const collection of [WebhookJobs, WebhookLeases]) {
  collection.deny({ insert: () => true, update: () => true, remove: () => true });
}

export const webhookOutbox = createWebhookOutbox({
  jobs: WebhookJobs.rawCollection(),
  leases: WebhookLeases.rawCollection(),
  getIntegration: id => Integrations.findOneAsync(id),
  oneWayType: Integrations.Const.ONEWAY,
  // The same SSRF-guarded transport as an immediate webhook (IntegrationBleed).
  post: async (url, request) => {
    try {
      return await fetchSafe(url, { ...request, totalTimeoutMs: 30000 });
    } catch (err) {
      if (/^SSRF_GUARD:/.test(err && err.message)) {
        // IntegrationBleed: a webhook pointed at an internal address.
        try {
          require('/server/lib/securityLog').record({
            key: 'ssrf.webhook', action: 'blocked', source: 'webhookQueue',
            detail: String(err.message).slice(0, 160),
          });
        } catch (e) { /* logging must never break the guard */ }
      }
      throw err;
    }
  },
});

Meteor.startup(async () => {
  await ensureIndex(WebhookJobs, { state: 1, nextAttemptAt: 1, integrationId: 1 });
  await ensureIndex(WebhookJobs, { integrationId: 1, state: 1, nextAttemptAt: 1 });
  // Polling finds both new jobs and jobs left by a restart.
  async function scan() {
    try {
      await webhookOutbox.drain();
    } catch (error) {
      console.error('Webhook queue scan failed; queued webhooks will be retried');
    } finally {
      Meteor.setTimeout(scan, 5000);
    }
  }
  Meteor.setTimeout(scan, 5000);
});
