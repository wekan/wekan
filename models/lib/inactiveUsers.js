'use strict';

// Disable accounts nobody has used for a while (USERS_DISABLE_INACTIVE_AFTER_DAYS).
// Pure decisions only, so they are testable without a server or a database -
// see tests/inactiveUsers.test.cjs. The nightly job is server/disableInactiveUsers.js.
//
// "Last used" is the newest of:
//   lastConnectionDate    every login, refreshed by the open-session heartbeat
//                         (server/lastActiveOnLogin.js, client/lastActiveHeartbeat.js)
//   inactivityClockStart  when the clock (re)started: stamped by the job for an
//                         account it has never seen used, and on every re-enable
//                         (server/models/users.js), so an admin who re-enables a
//                         user does not see them disabled again the next night.
//
// createdAt is deliberately NOT a fallback. lastConnectionDate has only been
// recorded since the presence feature; every account older than that has none,
// and measuring those from createdAt would disable almost the whole instance on
// the first run. Instead the first run starts their clock, and they are judged
// N days later like everybody else.

const DAY_MS = 24 * 60 * 60 * 1000;

// Why an account is disabled, so that one mechanism does not undo another:
// LDAP background sync re-enables users it finds in the directory, but not
// one disabled for inactivity (packages/wekan-ldap/server/presenceSync.js).
const REASON_INACTIVE = 'inactive';
const REASON_LDAP = 'ldap';

// Accepts a number or a string of digits; anything else, 0 or negative is off.
function normalizeInactiveDays(value) {
  if (value === undefined || value === null) return 0;
  const text = String(value).trim().replace(/^(['"])(.*)\1$/, '$2').trim();
  if (!/^\d+$/.test(text)) return 0;
  const days = Number(text);
  return Number.isSafeInteger(days) && days > 0 ? days : 0;
}

function toTime(value) {
  if (!value) return NaN;
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime();
}

function lastUsedTime(user) {
  const times = [toTime(user.lastConnectionDate), toTime(user.inactivityClockStart)]
    .filter(t => !Number.isNaN(t));
  return times.length ? Math.max(...times) : NaN;
}

/**
 * What the nightly job should do with one account:
 *   'disable'      unused for at least `days` days
 *   'start-clock'  never seen used: start counting from `now`
 *   null           leave it alone
 */
function inactivityAction(user, days, now = new Date()) {
  if (!user || !days) return null;
  if (user.loginDisabled === true) return null;
  // Never lock the instance out: administrators are not disabled automatically.
  if (user.isAdmin === true) return null;
  // Anonymised accounts are already disabled; this is belt and braces. Import
  // placeholders (server/lib/importPlaceholderUsers.js) are created disabled.
  if (user.anonymized === true) return null;
  const last = lastUsedTime(user);
  if (Number.isNaN(last)) return 'start-clock';
  const nowTime = toTime(now);
  if (Number.isNaN(nowTime)) return null;
  return nowTime - last >= days * DAY_MS ? 'disable' : null;
}

// Selector for the candidates, so the job reads only accounts that could
// possibly be disabled. inactivityAction() still decides per account.
function inactiveCandidateSelector(days, now = new Date()) {
  const cutoff = new Date(toTime(now) - days * DAY_MS);
  return {
    loginDisabled: { $ne: true },
    isAdmin: { $ne: true },
    $and: [
      { $or: [{ lastConnectionDate: { $exists: false } }, { lastConnectionDate: null }, { lastConnectionDate: { $lte: cutoff } }] },
      { $or: [{ inactivityClockStart: { $exists: false } }, { inactivityClockStart: null }, { inactivityClockStart: { $lte: cutoff } }] },
    ],
  };
}

module.exports = {
  DAY_MS,
  REASON_INACTIVE,
  REASON_LDAP,
  normalizeInactiveDays,
  lastUsedTime,
  inactivityAction,
  inactiveCandidateSelector,
};
