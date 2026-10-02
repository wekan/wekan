'use strict';
// A soft per-ACCOUNT brake on password guessing (maintainer decision
// 2026-10-02).
//
// The lockouts that exist count failures per (account, address) and per
// address, so a guesser spread over many addresses is never slowed. A hard
// per-account lockout would stop that, and it would also let any stranger lock
// the owner out (JamBleed). So instead:
//
//   - after `freeFailures` failed logins on one account within `windowMs`,
//     from anywhere, the account accepts ONE attempt per delay - 1 s, doubling
//     with every further failure, at most `maxDelayMs`. An attempt that arrives
//     early is refused without the password being looked at, so the refusal
//     says nothing about whether it was right; parallel connections cannot
//     multiply the rate, because the slot is the account's, not the
//     connection's;
//   - an address this account has SIGNED IN from (kept in memory, at most
//     `knownPerAccount` of them) is exempt, so the owner keeps signing in at
//     full speed while somebody else is guessing.
//
// Pure and time-injected: every method takes `now`, so the state machine is
// tested in plain Node (tests/accountLoginDelay.test.cjs).

const DEFAULTS = {
  freeFailures: 5,
  windowMs: 15 * 60 * 1000,
  baseDelayMs: 1000,
  maxDelayMs: 30 * 1000,
  knownPerAccount: 5,
  knownForMs: 30 * 24 * 60 * 60 * 1000,
  maxAccounts: 50000,
};

class AccountLoginDelay {
  constructor(options = {}) {
    Object.assign(this, DEFAULTS, options);
    this._failures = new Map(); // account -> { windowStart, count, nextAt }
    this._known = new Map(); // account -> Map(address -> last success)
  }

  _isKnown(account, address, now) {
    const known = this._known.get(account);
    const at = known && address ? known.get(address) : undefined;
    return at !== undefined && now - at < this.knownForMs;
  }

  _delayFor(count) {
    const over = count - this.freeFailures;
    if (over < 0) return 0;
    return Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** over);
  }

  // May this attempt go ahead? { allowed, retryAfterMs }. An allowed attempt
  // on a braked account takes the account's next slot.
  decide(account, address, now) {
    if (!account || this._isKnown(account, address, now)) return { allowed: true, retryAfterMs: 0 };
    const entry = this._failures.get(account);
    if (!entry || now - entry.windowStart > this.windowMs || entry.count < this.freeFailures) {
      return { allowed: true, retryAfterMs: 0 };
    }
    if (now < entry.nextAt) return { allowed: false, retryAfterMs: entry.nextAt - now };
    entry.nextAt = now + this._delayFor(entry.count);
    return { allowed: true, retryAfterMs: 0 };
  }

  recordFailure(account, address, now) {
    if (!account || this._isKnown(account, address, now)) return;
    let entry = this._failures.get(account);
    if (!entry || now - entry.windowStart > this.windowMs) {
      entry = { windowStart: now, count: 0, nextAt: 0 };
    }
    entry.count += 1;
    this._failures.set(account, entry);
    this._bound(this._failures);
  }

  // A correct password: the address becomes known for this account. The
  // account's failure count stays - a guesser who finally got it right should
  // not reset the brake for the next one.
  recordSuccess(account, address, now) {
    if (!account || !address) return;
    let known = this._known.get(account);
    if (!known) { known = new Map(); this._known.set(account, known); }
    known.delete(address);
    known.set(address, now);
    while (known.size > this.knownPerAccount) known.delete(known.keys().next().value);
    this._bound(this._known);
  }

  // Oldest accounts go first, so a flood of names cannot grow memory.
  _bound(map) {
    while (map.size > this.maxAccounts) map.delete(map.keys().next().value);
  }

  prune(now) {
    for (const [account, entry] of this._failures) {
      if (now - entry.windowStart > this.windowMs && now >= entry.nextAt) this._failures.delete(account);
    }
  }
}

// One brake for the process, shared by REST and DDP sign-in.
const accountLoginDelay = new AccountLoginDelay();

function recordAccountDelay(accountId, address, retryAfterMs, source) {
  try {
    require('/server/lib/securityLog').record({
      key: 'brute.login', action: 'blocked', source,
      // The account is the TARGET of the guessing, never the actor (JamBleed).
      targetUserId: accountId, ip: address || undefined,
      detail: `Login on a braked account refused; next attempt in ${Math.ceil(retryAfterMs / 1000)} s.`,
    });
  } catch (e) { /* logging must never break the guard */ }
}

module.exports = { AccountLoginDelay, accountLoginDelay, recordAccountDelay, DEFAULTS };
