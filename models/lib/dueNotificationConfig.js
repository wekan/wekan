'use strict';

// Pure parsers for the due-date reminder configuration (NOTIFY_DUE_* env vars),
// extracted from models/cards.js so they are unit-testable without Meteor.
// Related to #3192 (due-date reminder mail).

// Parse NOTIFY_DUE_DAYS_BEFORE_AND_AFTER: a comma-separated list of day offsets
// (positive = days before due, 0 = due today, negative = days past due). Each is
// validated to the -14..14 window; invalid/out-of-range entries are dropped.
// Returns an array of integers (possibly empty).
function parseNotifyDueDays(envValue) {
  if (!envValue || typeof envValue !== 'string') return [];
  return envValue
    .split(',')
    .map(value => {
      const iValue = parseInt(value, 10);
      if (Number.isNaN(iValue) || iValue < -14 || iValue > 14) return false;
      return iValue;
    })
    .filter(v => v !== false);
}

// Parse NOTIFY_DUE_AT_HOUR_OF_DAY: the hour of day (0..23) at which to send the
// reminders. Returns the parsed hour, or `defaultHour` when the value is missing,
// non-numeric, or out of range.
//
// #3192: the previous `parseInt(env, 10) || defaultHour` silently turned a valid
// hour of 0 (midnight) into the default (8), because 0 is falsy — so midnight
// reminders were impossible. It also accepted out-of-range hours (e.g. 25, -1).
// Number.isNaN + a 0..23 range check fixes both while keeping the "parse error ->
// default" behaviour.
function parseNotifyDueHour(envValue, defaultHour = 8) {
  const hour = parseInt(envValue, 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) return defaultHour;
  return hour;
}

module.exports = { parseNotifyDueDays, parseNotifyDueHour };
