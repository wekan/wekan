/**
 * server/lib/webhookGuard.js — non-blocking, error-isolated webhook delivery
 *
 * Outgoing webhooks are fired from the `Activities.after.insert` hook. If the
 * delivery throws (network error, timeout, slow/unreachable endpoint, invalid
 * response), that exception must NOT propagate into the activity insert or the
 * originating operation (e.g. adding/removing a card member). Otherwise the
 * member update is aborted / rolled back and never persists.
 *
 * `safeDeliver` runs the supplied delivery function and ALWAYS resolves — it
 * never rejects. On success it resolves `{ ok: true }`; on any thrown error
 * (sync or async) it logs and resolves `{ ok: false, error }`.
 *
 * This is a pure, dependency-free helper so it can be unit tested without
 * Meteor.
 *
 * Usage:
 *   import { safeDeliver } from '/server/lib/webhookGuard';
 *   safeDeliver(() => Meteor.callAsync('outgoingWebhooks', ...));
 */

/**
 * Run `deliverFn` and resolve regardless of outcome (never rejects).
 *
 * @param {Function} deliverFn - function performing the webhook delivery; may
 *   be synchronous or return a Promise.
 * @returns {Promise<{ok: boolean, error?: Error}>}
 */
export async function safeDeliver(deliverFn) {
  try {
    if (typeof deliverFn !== 'function') {
      throw new TypeError('safeDeliver: deliverFn must be a function');
    }
    await deliverFn();
    return { ok: true };
  } catch (error) {
    // Swallow + log: a failing webhook must never abort the caller.
    try {
      // eslint-disable-next-line no-console
      console.error('[webhookGuard] outgoing webhook delivery failed:', error && error.message ? error.message : error);
    } catch (_logErr) {
      // ignore logging failures
    }
    return { ok: false, error };
  }
}
