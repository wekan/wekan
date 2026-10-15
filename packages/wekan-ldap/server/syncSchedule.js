'use strict';

// LDAP_BACKGROUND_SYNC_INTERVAL, read into a SyncedCron schedule.
//
// The docs call it the interval "in milliseconds", and the snap/Docker
// examples also show later.js text ("every 1 hours"). Both were handed to
// later's parser.text(), and settings_get() JSON-parses the environment
// string, so a millisecond value arrived as a Number: later called
// toLowerCase() on it, the throw escaped a timer as an uncaughtException,
// and WeKan stopped - a snap restart loop for anybody who followed the docs.
// Text that later could not read did not throw, but gave a schedule that
// never fired, so background sync silently stopped.
//
// ldapSyncSchedule() accepts both and never throws:
//
//   a number, or a string of digits   milliseconds, as documented
//   other text                        later.js text, e.g. "every 1 hours"
//   either one in quotes ('…', "…")  the same, quotes removed (#2354)
//   unset / empty                     the default, recur().on(0).minute()
//                                     (later: at minute 0, so hourly)
//   anything unreadable               the default, with a warning saying why
//
// `parser` is later's parser (SyncedCron passes it); `warn` logs. Pure apart
// from those two: tests/ldapSyncSchedule.test.cjs.

const MINUTE = 60 * 1000;

function defaultSchedule(parser) {
  return parser.recur().on(0).minute();
}

function fromMilliseconds(parser, ms) {
  // later counts in whole seconds; the shortest useful sync is one second,
  // and a whole number of minutes is written as minutes.
  if (ms % MINUTE === 0) return parser.recur().every(ms / MINUTE).minute();
  return parser.recur().every(Math.max(1, Math.round(ms / 1000))).second();
}

// #2354: `LDAP_BACKGROUND_SYNC_INTERVAL='every 1 mins'` in a compose file or
// an env file keeps its quotes, and later cannot read a quoted text.
function unquote(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const match = /^(['"])(.*)\1$/.exec(trimmed);
  return match ? match[2].trim() : trimmed;
}

function ldapSyncSchedule(parser, rawValue, warn = () => {}) {
  const value = unquote(rawValue);
  if (value === undefined || value === null || value === '' || value === false) {
    return defaultSchedule(parser);
  }
  if (typeof value === 'number' || (typeof value === 'string' && /^\s*\d+\s*$/.test(value))) {
    const ms = Number(value);
    if (Number.isFinite(ms) && ms > 0) return fromMilliseconds(parser, ms);
    warn(`LDAP_BACKGROUND_SYNC_INTERVAL ${JSON.stringify(value)} is not a positive number of milliseconds; using the default schedule`);
    return defaultSchedule(parser);
  }
  if (typeof value !== 'string') {
    warn(`LDAP_BACKGROUND_SYNC_INTERVAL must be milliseconds or text such as "every 1 hours", not ${typeof value}; using the default schedule`);
    return defaultSchedule(parser);
  }
  let parsed;
  try {
    parsed = parser.text(value);
  } catch (error) {
    parsed = null;
  }
  // later.parse.text() reports the position of the first word it could not
  // read in `error` (-1 when it read everything).
  if (!parsed || !Array.isArray(parsed.schedules) || !parsed.schedules.length
      || (typeof parsed.error === 'number' && parsed.error !== -1)) {
    warn(`LDAP_BACKGROUND_SYNC_INTERVAL ${JSON.stringify(value)} is not later.js text such as "every 1 hours" or milliseconds; using the default schedule`);
    return defaultSchedule(parser);
  }
  return parsed;
}

module.exports = { ldapSyncSchedule };
