'use strict';

// #6768: pending activity notifications that can never be delivered leave the
// Admin Panel's recovery list by themselves, and old ones expire.
//
// The recovery scan retried every pending notification each round, and one
// whose delivery fails for good - its activity deleted or changed since, a
// recipient who lost access, a plan with nothing or too much to send - failed
// the same way every round, forever: the list only grew. Such an error is
// TERMINAL here: after a grace period (an activity being written right now is
// never touched) its notification is cancelled through the same cancellation
// an administrator uses, which compacts it to a cancelled receipt. Any
// pending notification older than ACTIVITY_NOTIFICATION_MAX_AGE_DAYS (7) is
// cancelled as expired too - a week-old "card moved" mail is noise.
// Pure: tests/activityNotificationExpiry.test.cjs.

const TERMINAL_ERRORS = new Set([
  'activity-notification-activity-unconfirmed',
  'activity-notification-recipient-denied',
  'activity-notification-preference-changed',
  'activity-notification-context-unavailable',
  'activity-notification-plan-too-large',
  'activity-notification-intent-invalid',
]);
const GRACE_MS = 10 * 60 * 1000;
const DEFAULT_MAX_AGE_DAYS = 7;

function isTerminalRecoveryError(error) {
  return !!(error && TERMINAL_ERRORS.has(error.message));
}

function maxAgeDays(env = process.env) {
  const n = Number(env.ACTIVITY_NOTIFICATION_MAX_AGE_DAYS);
  return Number.isFinite(n) && n >= 1 && n <= 3650 ? n : DEFAULT_MAX_AGE_DAYS;
}

/** When the activity of a pending intent happened, or null. */
function intentCreatedAt(row) {
  const at = row && row.activity && row.activity.createdAt;
  const t = at ? new Date(at).getTime() : NaN;
  return Number.isFinite(t) ? t : null;
}

/** Whether a pending intent is past the grace period (old enough to give up on). */
function pastGrace(row, now = Date.now()) {
  const at = intentCreatedAt(row);
  return at !== null && now - at >= GRACE_MS;
}

/** Whether a pending intent has expired. */
function expired(row, now = Date.now(), days = maxAgeDays()) {
  const at = intentCreatedAt(row);
  return at !== null && now - at >= days * 24 * 60 * 60 * 1000;
}

/** The selector of pending intents whose activity is older than `days`. */
function olderThanSelector(days, now = Date.now()) {
  return { state: 'pending', 'activity.createdAt': { $lt: new Date(now - days * 24 * 60 * 60 * 1000) } };
}

module.exports = { TERMINAL_ERRORS, GRACE_MS, DEFAULT_MAX_AGE_DAYS, isTerminalRecoveryError, maxAgeDays, pastGrace, expired, olderThanSelector };
