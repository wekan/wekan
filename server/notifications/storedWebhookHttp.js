// Off Sandstorm exactly fetchSafe (server/lib/ssrfGuard.js); in a grain, through
// the Powerbox grant a board admin gave this webhook, when there is one.
import { webhookFetch } from '/server/sandstormEgress';
const { deliverStoredWebhookHttp } = require('/server/lib/syncWebhookHttp');

// Internal adapter. Storage/access/response-effect adapters belong to the
// durable operation; they cannot replace the application's network guard.
export function sendStoredWebhook({ item, responses, assertCurrent, assertTarget, completeResponse }) {
  return deliverStoredWebhookHttp({ item, responses, assertCurrent, assertTarget, completeResponse, requestHttp: webhookFetch });
}
