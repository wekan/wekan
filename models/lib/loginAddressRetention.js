'use strict';

// How long WeKan keeps where people signed in from (docs/Compliance/README.md
// WP-2: GDPR Art. 5(1)(c) and (e), POPIA s. 14(1), PIPEDA 4.5.3, APP 11.2).
//
// A successful login is tallied on the account (users.loginAddresses.entries:
// which addresses it uses) and on the address (the loginAddresses collection:
// who uses it), and a login with a too-short password in shortPasswordLogins.
// Those were capped in COUNT but never expired: an address used once five years
// ago stayed beside the account for good. Now an entry whose latest use (`at`)
// is older than LOGIN_ADDRESS_RETENTION_DAYS is removed, once a day
// (server/lib/loginAddressRetention.js). An address still in use keeps a recent
// `at` and stays; 0 keeps everything, as before.
//
// Pure: no Meteor. tests/loginAddressRetention.test.cjs.

const DEFAULT_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

function retentionDays(env = {}) {
  const raw = parseInt(env.LOGIN_ADDRESS_RETENTION_DAYS, 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_DAYS;
}

function cutoffFor(days, now = Date.now()) {
  return days > 0 ? new Date(now - days * DAY_MS) : null;
}

const olderThan = (at, cutoff) => {
  const t = at instanceof Date ? at.getTime() : Date.parse(at);
  return Number.isFinite(t) && t < cutoff.getTime();
};

// The keys of a tally ({ entries: { key: { at, ... } } }) last used before the
// cutoff. An entry with no date is kept: it cannot be judged.
function staleKeys(tally, cutoff) {
  if (!cutoff || !tally || typeof tally.entries !== 'object' || !tally.entries) return [];
  return Object.entries(tally.entries)
    .filter(([, entry]) => entry && entry.at && olderThan(entry.at, cutoff))
    .map(([key]) => key);
}

// The $unset of an account's stale address entries, or null when none.
function userUnset(user, cutoff) {
  const keys = staleKeys(user && user.loginAddresses, cutoff);
  if (!keys.length) return null;
  return Object.fromEntries(keys.map(key => [`loginAddresses.entries.${key}`, '']));
}

// An address row: removed whole when it was last used before the cutoff,
// else only the accounts behind it that last used it before then.
function addressDecision(row, cutoff) {
  if (!cutoff || !row) return { remove: false, unset: null };
  if (row.at && olderThan(row.at, cutoff)) return { remove: true, unset: null };
  const keys = staleKeys(row.users, cutoff);
  return { remove: false, unset: keys.length ? Object.fromEntries(keys.map(k => [`users.entries.${k}`, ''])) : null };
}

module.exports = { DEFAULT_DAYS, retentionDays, cutoffFor, staleKeys, userUnset, addressDecision };
