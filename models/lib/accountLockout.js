'use strict';

// Is this account locked, and why — for Admin Panel → People.
//
// GHSA-rf3w-rj48-jxcc moved the lockout counter from ONE flat field per user to
// one per (user, source address), so an attacker locks out the address they are
// attacking from instead of the account's owner. Three readers were still
// looking at the flat field afterwards - the People table's lock icon, its
// unlock click handler, and the lockedUsers methods behind them - and would have
// shown every account as unlocked for ever.
//
// This is the one place that knows the shape, so those three agree.
//
// `lockedUntil` IS A DISPLAY FIELD. It is the newest unlock time across the
// account's addresses, written beside the per-address state purely so an admin
// screen can ask "which accounts are locked right now" - a question Mongo cannot
// answer over dynamically-named subdocuments without an aggregation. Nothing in
// the lockout DECISION may read it: the decision is per address, and a field
// that says "this account is locked" is the vulnerability that was just fixed.
// tests/lockoutPerSourceAddress.test.cjs pins that it is never consulted there.

const LOCKOUT = 'accounts-lockout';

function lockoutServices(user) {
  try {
    return user.services[LOCKOUT] || {};
  } catch (e) {
    return {};
  }
}

// Every address currently locked out of this account, newest first.
function lockedAddresses(user, now = Number(new Date())) {
  const byAddress = lockoutServices(user).byAddress;
  if (!byAddress || typeof byAddress !== 'object') return [];
  return Object.keys(byAddress)
    .map(key => Object.assign({ key }, byAddress[key]))
    .filter(entry => typeof entry.unlockTime === 'number' && entry.unlockTime > now)
    .sort((a, b) => b.unlockTime - a.unlockTime);
}

function isUserLocked(user, now = Number(new Date())) {
  if (!user) return false;
  return lockedAddresses(user, now).length > 0;
}

// What the Admin Panel shows: locked or not, since when, until when, how many
// addresses and how many failures - so "why" is answerable without a second
// screen. `addresses` is a count rather than a list: which addresses attacked an
// account is in Admin Panel → Problems, where it is a tally rather than a field
// on every user document.
function lockSummary(user, now = Number(new Date())) {
  const locked = lockedAddresses(user, now);
  if (!locked.length) return { locked: false, addresses: 0 };
  return {
    locked: true,
    addresses: locked.length,
    // The one that has furthest to run: it is when the account is fully free.
    unlockTime: locked[0].unlockTime,
    secondsRemaining: Math.max(1, Math.ceil((locked[0].unlockTime - now) / 1000)),
    failedAttempts: locked.reduce((n, e) => n + (e.failedAttempts || 0), 0),
    lastFailedAttempt: locked.reduce((t, e) => Math.max(t, e.lastFailedAttempt || 0), 0),
  };
}

// The display field, kept in step with the per-address state.
const LOCKED_UNTIL_FIELD = `services.${LOCKOUT}.lockedUntil`;

module.exports = {
  LOCKOUT,
  LOCKED_UNTIL_FIELD,
  lockedAddresses,
  isUserLocked,
  lockSummary,
};
