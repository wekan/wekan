// ============================================================================
// Canary tokens — the runtime half
// (design: docs/Security/Remediation/WeKan.md §12; pure half:
//  models/lib/canaryTokens.js)
// ----------------------------------------------------------------------------
// `tripCanary()` is callable from ANY point in WeKan where somebody could try to
// override permissions - an allow/deny rule, a REST handler, a publication, a
// method. It resolves who is calling and from where, rate-limits, records one
// security event, and RETURNS FALSE.
//
// Returning false is the interface. Every one of these call sites already had to
// produce a refusal, so the canary is written as a drop-in for it:
//
//     if (somethingForbidden) return false;                    // before
//     if (somethingForbidden) return tripCanary('card.vote-field', { ... });
//
// and a deny rule, which refuses by returning TRUE, uses `tripCanaryDeny()`.
// Nothing about the response, its timing, its wording or its status changes, so
// the person probing cannot tell a canaried path from an ordinary refusal - if
// they could, they would simply avoid the canaried ones.
//
// NOTHING here may throw into the caller. A tripwire that breaks the request it
// is watching would be a denial of service triggered by trying to report one.
// Every step is wrapped, and the return value is decided before any of the
// reporting work is attempted.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import securityLog from '/server/lib/securityLog';

const {
  CanaryRateLimiter,
  canaryFor,
  canaryPairKey,
  canaryDetail,
} = require('/models/lib/canaryTokens');
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { locationFromHeaders } = require('/models/lib/geoHeaders');

// One limiter for the process. Bounded by construction (models/lib/canaryTokens.js):
// a capped map, a counting window, and a ceiling on events per pair.
const limiter = new CanaryRateLimiter();

// Idle pairs are swept so a long-lived server does not hold a row per address
// seen since boot. Ten minutes of silence and the pair is forgotten; its trips
// were all recorded already.
const SWEEP_EVERY_MS = 10 * 60 * 1000;
const IDLE_MS = 10 * 60 * 1000;
if (Meteor.isServer) {
  Meteor.startup(() => {
    Meteor.setInterval(() => {
      try {
        limiter.sweep(Date.now(), IDLE_MS);
      } catch (e) {
        /* a sweeper that throws must not take the timer down */
      }
    }, SWEEP_EVERY_MS);
  });
}

// The username is looked up once per userId and cached briefly: a canary on a
// hot path must not add a database read per attempt, which would hand the
// attacker a cheap way to make WeKan work harder the faster they probe.
const NAME_TTL_MS = 60 * 1000;
const NAME_CACHE_MAX = 1000;
const nameCache = new Map();

function cachedUsername(userId) {
  const hit = nameCache.get(userId);
  if (hit && Date.now() - hit.at < NAME_TTL_MS) return hit.username;
  return undefined;
}

function rememberUsername(userId, username) {
  if (nameCache.size >= NAME_CACHE_MAX) {
    const oldest = nameCache.keys().next();
    if (!oldest.done) nameCache.delete(oldest.value);
  }
  nameCache.set(userId, { username, at: Date.now() });
}

/**
 * Who is doing this, and from where.
 *
 * Sources, in order: what the caller passed (a REST handler knows its own
 * `req`), then the current DDP invocation. The address is resolved with the
 * SAME spoofing-safe rule as the login throttle - X-Forwarded-For is honoured
 * only as far as HTTP_FORWARDED_COUNT says to trust it - so an attacker cannot
 * write someone else's address into the security log by sending a header.
 */
function resolveActor(given = {}) {
  const actor = { userId: null, username: '', ip: '', location: null };

  try {
    if (given.userId) actor.userId = String(given.userId);
    if (given.username) actor.username = String(given.username);
    if (given.ip) actor.ip = String(given.ip);
    if (given.location) actor.location = given.location;

    if (given.req) {
      const req = given.req;
      if (!actor.userId && req.userId) actor.userId = String(req.userId);
      if (!actor.location) actor.location = locationFromHeaders(req.headers);
      if (!actor.ip) {
        actor.ip = resolveClientKey({
          headers: req.headers,
          socketAddress:
            (req.socket && req.socket.remoteAddress) ||
            (req.connection && req.connection.remoteAddress),
          forwardedCount: process.env.HTTP_FORWARDED_COUNT,
        });
      }
    }

    if (!actor.userId || !actor.ip) {
      // A DDP method or allow/deny rule: Meteor exposes the invocation, whose
      // `connection` carries the address it already resolved (honouring the
      // same HTTP_FORWARDED_COUNT).
      const invocation =
        typeof DDP !== 'undefined' && DDP._CurrentMethodInvocation
          ? DDP._CurrentMethodInvocation.get()
          : null;
      if (invocation) {
        if (!actor.userId && invocation.userId) actor.userId = String(invocation.userId);
        const connection = invocation.connection;
        if (!actor.ip && connection && connection.clientAddress) {
          actor.ip = String(connection.clientAddress);
        }
      }
    }
  } catch (e) {
    /* an actor we could not resolve is still an actor: record what we have */
  }

  if (!actor.ip) actor.ip = 'unknown';
  return actor;
}

/** Fill in the username for a userId, from cache or one lookup. Never throws. */
async function fillUsername(actor) {
  if (actor.username || !actor.userId) return actor;
  try {
    const cached = cachedUsername(actor.userId);
    if (cached !== undefined) {
      actor.username = cached;
      return actor;
    }
    const user = await Meteor.users.findOneAsync(actor.userId, {
      fields: { username: 1 },
    });
    actor.username = (user && user.username) || '';
    rememberUsername(actor.userId, actor.username);
  } catch (e) {
    /* the account may be gone; the userId is still attribution enough */
  }
  return actor;
}

/**
 * Trip a canary. ALWAYS returns false, immediately - the reporting happens
 * afterwards and off the caller's path.
 *
 * @param {string} canaryId an id from the catalog in models/lib/canaryTokens.js
 * @param {object} [context]
 * @param {string} [context.userId]   the actor, when the caller knows it
 * @param {string} [context.username] ...and their name, if already at hand
 * @param {string} [context.ip]       ...and their address
 * @param {object} [context.req]      or the HTTP request to take both from
 * @param {string} [context.detail]   one short clause of extra context. NEVER a
 *                                    payload: it is attacker-controlled text and
 *                                    the log is not a place to store it.
 * @return {false} always
 */
export function tripCanary(canaryId, context = {}) {
  try {
    report(canaryId, context);
  } catch (e) {
    if (process.env.DEBUG === 'true') {
      console.warn('canary reporting failed:', e && e.message);
    }
  }
  return false;
}

/**
 * The same tripwire for a DENY rule, which refuses by returning TRUE.
 * @return {true} always
 */
export function tripCanaryDeny(canaryId, context = {}) {
  tripCanary(canaryId, context);
  return true;
}

/**
 * Report, without blocking or affecting the caller. Split out so `tripCanary`
 * is nothing but "wrap, and return false".
 */
function report(canaryId, context) {
  const canary = canaryFor(canaryId);
  const actor = resolveActor(context);
  const pair = canaryPairKey(canary.id, actor);

  // Decide BEFORE doing any work: a suppressed trip costs one map lookup, which
  // is what makes a canary safe to put on a path an attacker can hammer.
  const decision = limiter.consider(pair, Date.now());
  if (!decision.write) return;

  // The username lookup and the insert are both async and neither is awaited:
  // the caller has already been given its `false`.
  const finish = async () => {
    await fillUsername(actor);
    securityLog.record({
      key: canary.key,
      action: 'detected',
      source: `canary:${canary.id}`,
      userId: actor.userId || undefined,
      username: actor.username || undefined,
      ip: actor.ip,
      location: actor.location || undefined,
      count: decision.count,
      detail: canaryDetail(canary, decision.count, context.detail),
    });
  };

  const p = finish();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

/** For tests and the admin self-check: how many pairs are being tracked. */
export function canaryTrackedPairs() {
  return limiter.size();
}

export default { tripCanary, tripCanaryDeny, canaryTrackedPairs };
