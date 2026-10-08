'use strict';

// Automatic logout: LOGOUT_WITH_TIMER, LOGOUT_IN, LOGOUT_ON_HOURS and
// LOGOUT_ON_MINUTES (maintainer decision of 2026-10-08). The platforms offered
// them since 2018, but the code that read them was removed with the job queue
// it ran on, so they did nothing.
//
// A login ends at its deadline, computed from when the login token was made:
//   - LOGOUT_IN alone: that many days after the login;
//   - LOGOUT_ON_HOURS (and LOGOUT_ON_MINUTES): at that time of day, server
//     local time - the first such time after the login when LOGOUT_IN is 0 or
//     unset, otherwise on the day LOGOUT_IN days after the login's day.
//     LOGOUT_IN=1, LOGOUT_ON_HOURS=3 signs everybody out at 03:00 the night
//     after they signed in.
//
// The server removes expired login tokens (server/logoutTimer.js), which
// Meteor answers by logging those connections out. One query does it, because
// the deadline never decreases as the login time increases: the expired tokens
// are exactly those made before expiredBefore(now).
//
// Pure: no Meteor, no database. Shared by the server and plain-Node tests.

const DAY = 24 * 60 * 60 * 1000;

function toInt(value, min, max) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const number = Number(String(value).trim());
  if (!Number.isInteger(number) || number < min || number > max) return NaN;
  return number;
}

// The settings in effect, from an env-shaped getter (authEnv, or process.env
// in a test). { enabled: false, reason } when off or unusable.
function logoutTimerConfig(get) {
  if (String(get('LOGOUT_WITH_TIMER') || '').trim() !== 'true') {
    return { enabled: false, reason: 'off' };
  }
  const days = toInt(get('LOGOUT_IN'), 0, 3650);
  const hour = toInt(get('LOGOUT_ON_HOURS'), 0, 23);
  const minute = toInt(get('LOGOUT_ON_MINUTES'), 0, 59);
  if (Number.isNaN(days)) return { enabled: false, reason: 'LOGOUT_IN must be a whole number of days, 0 to 3650' };
  if (Number.isNaN(hour)) return { enabled: false, reason: 'LOGOUT_ON_HOURS must be an hour, 0 to 23' };
  if (Number.isNaN(minute)) return { enabled: false, reason: 'LOGOUT_ON_MINUTES must be a minute, 0 to 59' };
  if (hour === null && minute !== null) {
    return { enabled: false, reason: 'LOGOUT_ON_MINUTES needs LOGOUT_ON_HOURS' };
  }
  if (hour === null) {
    if (!days) return { enabled: false, reason: 'LOGOUT_WITH_TIMER needs LOGOUT_IN or LOGOUT_ON_HOURS' };
    return { enabled: true, days, hour: null, minute: null };
  }
  return { enabled: true, days: days || 0, hour, minute: minute || 0 };
}

function atTimeOfDay(date, days, hour, minute) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// When a login made at `when` ends.
function logoutDeadline(when, config) {
  if (!config.enabled) return null;
  if (config.hour === null) return new Date(when.getTime() + config.days * DAY);
  let deadline = atTimeOfDay(when, config.days, config.hour, config.minute);
  if (deadline.getTime() <= when.getTime()) deadline = atTimeOfDay(when, config.days + 1, config.hour, config.minute);
  return deadline;
}

// Every login made before this has reached its deadline by `now`: the inverse
// of logoutDeadline, which tests/logoutTimer.test.cjs checks against it.
function expiredBefore(now, config) {
  if (!config.enabled) return null;
  if (config.hour === null) return new Date(now.getTime() - config.days * DAY);
  // The latest logout time that has come: today's, or yesterday's.
  let latest = atTimeOfDay(now, 0, config.hour, config.minute);
  if (latest.getTime() > now.getTime()) latest = atTimeOfDay(now, -1, config.hour, config.minute);
  if (config.days === 0) return latest;
  // With days >= 1 a login on day X ends on day X + days, whatever its time,
  // so the logins that ended are those before the day after (latest - days).
  return atTimeOfDay(latest, 1 - config.days, 0, 0);
}

module.exports = { logoutTimerConfig, logoutDeadline, expiredBefore };
