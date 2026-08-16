/* eslint-disable no-underscore-dangle */

// Which lockout counter an attempt belongs to.
//
// GHSA-rf3w-rj48-jxcc: the known-user lockout kept ONE counter per user -
// `services.accounts-lockout.failedAttempts` - with no notion of where the
// attempts came from. Anyone who knew a username could spend three wrong
// passwords and lock that account out from EVERY address, repeatably, for as
// long as they cared to keep doing it. Usernames are public in normal WeKan use
// (board and card members are listed), so picking a target was trivial, and an
// administrator was as easy to lock out as anyone else.
//
// The counter is per (user, source address) now. An attacker locks out the
// address they are attacking from, which is the address that should be locked,
// and the person whose account it is keeps logging in from theirs.
//
// unknownUser.js has always keyed by clientAddress; this brings knownUser.js
// into line with it.

const crypto = require('crypto');

// The address an attempt came from.
//
// Behind a reverse proxy every attempt arrives from the proxy, so the socket
// address would put the whole internet in one bucket - which is the bug again,
// with extra steps. HTTP_FORWARDED_COUNT says how many proxies WeKan sits
// behind, and the real client is that many addresses from the RIGHT of
// X-Forwarded-For; anything further left is attacker-supplied and must not be
// trusted. Same rule, and the same env var, as
// server/lib/loginAttemptThrottle.js uses for the REST login throttle -
// tests/lockoutPerSourceAddress.test.cjs pins the two together.
function clientAddressOf(connection, forwardedCount) {
  if (!connection) return 'unknown';
  const hops = parseInt(forwardedCount, 10);
  const headers = connection.httpHeaders;
  if (hops > 0 && headers && headers['x-forwarded-for']) {
    const parts = String(headers['x-forwarded-for'])
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const idx = parts.length - hops;
    if (idx >= 0 && parts[idx]) return parts[idx];
  }
  return connection.clientAddress || 'unknown';
}

// The Mongo field name that address's counter lives under.
//
// Hashed for two reasons. A field name may not contain a dot and may not begin
// with a dollar, and an IPv4 address is all dots - so the raw address cannot be
// a key at all. And a locked-out account would otherwise carry a list of the
// addresses that attacked it, which is a record of who was where that WeKan has
// no reason to keep.
function scopeKeyFor(address) {
  return crypto.createHash('sha256')
    .update(String(address == null ? 'unknown' : address))
    .digest('hex')
    .slice(0, 32);
}

const SCOPE_ROOT = 'services.accounts-lockout.byAddress';
const scopeFieldFor = address => `${SCOPE_ROOT}.${scopeKeyFor(address)}`;

// What this address has done so far. Missing state reads as "nothing yet", and
// so does state of the wrong shape - an old document, a hand-edit - because a
// lockout that throws on a malformed field would lock everybody out of a
// database that has one.
function scopeStateOf(user, address) {
  const key = scopeKeyFor(address);
  let state;
  try {
    state = user.services['accounts-lockout'].byAddress[key];
  } catch (e) {
    state = null;
  }
  const num = v => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
  return {
    failedAttempts: num(state && state.failedAttempts),
    firstFailedAttempt: num(state && state.firstFailedAttempt),
    lastFailedAttempt: num(state && state.lastFailedAttempt),
    unlockTime: num(state && state.unlockTime),
    // When this address may try again after its last failure - the increasing
    // delay (lockoutDecision.js). Absent on state written before delays existed,
    // which reads as 0: no wait, rather than a wait nobody can explain.
    nextAttemptAt: num(state && state.nextAttemptAt),
  };
}

module.exports = {
  clientAddressOf,
  scopeKeyFor,
  scopeFieldFor,
  scopeStateOf,
  SCOPE_ROOT,
};
