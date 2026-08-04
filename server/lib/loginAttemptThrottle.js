'use strict';

// GHSA-2g94-9x3m-hv37 (Unthrottled Password Brute-Force) — REST side.
//
// The DDP login path is throttled by the accounts-lockout validateLoginAttempt
// hooks (re-enabled in this same fix). The REST endpoint POST /users/login in
// server/apiAuthRoutes.js checks the password directly with
// `Accounts._checkPasswordAsync` and never runs those hooks, so on its own it
// had NO brute-force protection at all. This is a small, self-contained,
// in-memory per-key failed-attempt throttle for exactly that path.
//
// It is deliberately pure and time-injected (every method takes `now`) so the
// state machine is unit-testable in plain Node without timers, Meteor or a DB.
// Keyed by client address: successes reset the key, and only FAILURES are
// counted, so ordinary API logins are never impeded.

const DEFAULTS = {
  // Consecutive failures within `windowMs` before the key is locked out.
  maxFailures: 10,
  // Sliding window for counting failures.
  windowMs: 60 * 1000,
  // How long a key stays locked once `maxFailures` is reached.
  lockoutMs: 60 * 1000,
};

class LoginAttemptThrottle {
  constructor(options = {}) {
    this.maxFailures = options.maxFailures || DEFAULTS.maxFailures;
    this.windowMs = options.windowMs || DEFAULTS.windowMs;
    this.lockoutMs = options.lockoutMs || DEFAULTS.lockoutMs;
    this._byKey = new Map();
  }

  // Is this key currently locked out? Returns { blocked, retryAfterMs }.
  check(key, now) {
    const entry = this._byKey.get(key);
    if (!entry) return { blocked: false, retryAfterMs: 0 };
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return { blocked: true, retryAfterMs: entry.lockedUntil - now };
    }
    return { blocked: false, retryAfterMs: 0 };
  }

  // Record one failed attempt for `key`. Returns the resulting lock state.
  recordFailure(key, now) {
    let entry = this._byKey.get(key);

    const windowExpired = entry && now - entry.windowStart > this.windowMs;
    const lockExpired = entry && entry.lockedUntil && now >= entry.lockedUntil;
    if (!entry || windowExpired || lockExpired) {
      entry = { windowStart: now, count: 0, lockedUntil: 0 };
    }

    entry.count += 1;
    if (entry.count >= this.maxFailures) {
      entry.lockedUntil = now + this.lockoutMs;
    }
    this._byKey.set(key, entry);
    return this.check(key, now);
  }

  // A successful login clears the key entirely.
  recordSuccess(key) {
    this._byKey.delete(key);
  }

  // Opportunistic cleanup so the Map cannot grow without bound. Drops keys whose
  // window has elapsed and whose lockout (if any) has expired.
  prune(now) {
    for (const [key, entry] of this._byKey) {
      const lockDone = !entry.lockedUntil || now >= entry.lockedUntil;
      const windowDone = now - entry.windowStart > this.windowMs;
      if (lockDone && windowDone) this._byKey.delete(key);
    }
  }

  // Test/introspection helper.
  size() {
    return this._byKey.size;
  }
}

// Resolve the throttle key for a request. X-Forwarded-For is honoured ONLY when
// the operator declares how many proxy hops to trust (HTTP_FORWARDED_COUNT, the
// same knob Meteor's DDP layer uses); otherwise the socket address is used, so a
// client cannot spoof the header to dodge the throttle. Pure and testable.
function resolveClientKey({ headers, socketAddress, forwardedCount } = {}) {
  const hops = parseInt(forwardedCount, 10);
  if (hops > 0 && headers && headers['x-forwarded-for']) {
    const parts = String(headers['x-forwarded-for'])
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    // The real client is `hops` addresses from the right of the chain.
    const idx = parts.length - hops;
    if (idx >= 0 && parts[idx]) return parts[idx];
  }
  return socketAddress || 'unknown';
}

module.exports = { LoginAttemptThrottle, DEFAULTS, resolveClientKey };
