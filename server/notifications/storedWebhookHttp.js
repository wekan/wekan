import { fetchSafe } from '/server/lib/ssrfGuard';
const { deliverStoredWebhookHttp } = require('/server/lib/syncWebhookHttp');

// Internal adapter. Storage/access/response-effect adapters belong to the
// durable operation; they cannot replace the application's network guard.
export function sendStoredWebhook({ item, responses, assertCurrent, assertTarget, completeResponse }) {
  return deliverStoredWebhookHttp({ item, responses, assertCurrent, assertTarget, completeResponse, requestHttp: fetchSafe });
}
