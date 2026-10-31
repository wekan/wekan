'use strict';

// Admin Panel / Problems / Password length: who signs in with a password
// shorter than PASSWORD_MIN_LENGTH (models/lib/passwordPolicy.js), from where,
// and whether it has been fixed.
//
// ONE ROW PER ACCOUNT, never one per sign-in - the same rule as every Problems
// report (models/lib/eventLogSummary.js): an account that signs in every day
// is one row whose count grows, with the first and the latest sign-in and the
// latest IPv4 and IPv6 address it came from.
//
// HOW WEKAN KNOWS. Meteor sends a password hashed, so only the browser that
// typed it knows its length; it tells the server "this one was short" after a
// sign-in that worked, never the length or the password. "Fixed" is the
// account's password changing afterwards. The server cannot see how long a
// password changed through a form is either, so a fixed row whose account
// signs in with a short password again is reopened: Fixed means changed AND
// not seen short since. An administrator's Set password is checked directly.
//
// Pure: no Meteor, no database. Loaded by the server, the client and tests.

const FILTERS = ['short', 'fixed', 'all'];
const DEFAULT_FILTER = 'short';

// The Mongo selector for one filter of the table.
function filterSelector(filter) {
  if (filter === 'fixed') return { fixedAt: { $type: 'date' } };
  if (filter === 'all') return {};
  return { fixedAt: null };
}

function cleanFilter(filter) {
  return FILTERS.includes(filter) ? filter : DEFAULT_FILTER;
}

// The update for one more short sign-in by this account, from this address.
// `family` is 'ipv4' or 'ipv6' (models/lib/loginTally.js addressOf); only that
// family's address and location change, so a row keeps the latest of each.
function shortLoginUpdate({ username, now, address, family, location }) {
  const set = { username: username || '', at: now };
  if (address && (family === 'ipv4' || family === 'ipv6')) {
    set[family] = address;
    if (location) set[`${family}Location`] = location;
  }
  return {
    $set: set,
    $inc: { count: 1 },
    $setOnInsert: { firstAt: now },
    // Seen short again: not fixed any more.
    $unset: { fixedAt: '' },
  };
}

module.exports = { FILTERS, DEFAULT_FILTER, filterSelector, cleanFilter, shortLoginUpdate };
