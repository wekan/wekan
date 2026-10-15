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
//   a number, or a string of digits   milliseconds, as documented, kept
//                                     exactly when later can, else the
//                                     nearest interval it can (#6771)
//   other text                        later.js text, e.g. "every 1 hours"
//   either one in quotes ('…', "…")  the same, quotes removed (#2354)
//   unset / empty                     the default, recur().on(0).minute()
//                                     (later: at minute 0, so hourly)
//   anything unreadable               the default, with a warning saying why
//
// `parser` is later's parser (SyncedCron passes it); `warn` logs. Pure apart
// from those two: tests/ldapSyncSchedule.test.cjs.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function defaultSchedule(parser) {
  return parser.recur().on(0).minute();
}

// #6771: later is a calendar, not a timer. every(n).minute() means "the
// minutes 0, n, 2n ... of each hour", so it is an interval only when n
// divides 60: every(120).minute() was minute 0 only - two hours became one,
// a day became one hour - and every(90).second() fired every minute. These
// are the intervals later keeps exactly; anything else is rounded to the
// nearest of them, with a warning saying so. Each is pinned to the start of
// its unit (.on(0).second() ...), so it names instants, not whole minutes or
// hours that the current moment would already be inside.
const DIVIDES_60 = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30];
const DIVIDES_24 = [1, 2, 3, 4, 6, 8, 12];
const EXACT = [
  ...DIVIDES_60.map(n => ({ ms: n * SECOND, build: p => p.recur().every(n).second() })),
  ...DIVIDES_60.map(n => ({ ms: n * MINUTE, build: p => p.recur().every(n).minute().on(0).second() })),
  ...DIVIDES_24.map(n => ({ ms: n * HOUR, build: p => p.recur().every(n).hour().on(0).minute().on(0).second() })),
  { ms: DAY, build: p => p.recur().on(0).hour().on(0).minute().on(0).second() },
];

function describe(ms) {
  for (const [unit, size] of [['day', DAY], ['hour', HOUR], ['minute', MINUTE]]) {
    if (ms % size === 0) return `${ms / size} ${unit}${ms === size ? '' : 's'}`;
  }
  return `${ms / SECOND} second${ms === SECOND ? '' : 's'}`;
}

function fromMilliseconds(parser, ms, warn) {
  if (ms < MINUTE) {
    warn(`LDAP_BACKGROUND_SYNC_INTERVAL ${ms} is milliseconds, so the whole directory is synced every ${describe(Math.max(SECOND, Math.round(ms / SECOND) * SECOND))}; for an hour write 3600000`);
  }
  // Several days: every n-th day of the year, at midnight. The count starts
  // again on 1 January, so the last interval of a year can be shorter.
  if (ms > DAY + DAY / 2) {
    const days = Math.round(ms / DAY);
    if (ms !== days * DAY) warn(`LDAP_BACKGROUND_SYNC_INTERVAL ${ms} is not a whole number of days; syncing every ${days} days`);
    return parser.recur().every(days).dayOfYear().on(0).hour().on(0).minute().on(0).second();
  }
  const exact = EXACT.find(c => c.ms === ms);
  if (exact) return exact.build(parser);
  // Nearest by ratio, so 7 minutes goes to 6 rather than to 6 seconds.
  const nearest = EXACT.reduce((best, c) =>
    (Math.abs(Math.log(ms / c.ms)) < Math.abs(Math.log(ms / best.ms)) ? c : best));
  warn(`LDAP_BACKGROUND_SYNC_INTERVAL ${ms} ms (${describe(ms)}) is not an interval the scheduler can keep; syncing every ${describe(nearest.ms)}`);
  return nearest.build(parser);
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
    if (Number.isFinite(ms) && ms > 0) return fromMilliseconds(parser, ms, warn);
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
