'use strict';

// LOGOUT_IDLE_MINUTES (Admin Panel / People / Login): sign a browser session
// out after this many minutes in which its user did nothing. Empty or 0 is off.
// LOGOUT_WITH_TIMER (models/lib/logoutTimer.js) is the other automatic logout:
// a deadline from the moment of signing in, however busy the user is.
//
// What counts as activity is the USER, not the connection: the browser reports
// a key press, click, touch or scroll at most once a minute
// (client/lib/idleActivity.js), and the server keeps the time per login token
// in the idleSessions collection (server/idleLogout.js). A tab left open
// reconnects and resumes its login by itself - after a laptop wakes up, say -
// and that is not activity, so a resumed login does not move the time either.
//
// Once a minute every login token whose last activity is older than the limit
// is removed, and Meteor signs out each connection that used it. Only a token
// with an idleSessions record is ever removed: the tokens the REST API hands
// out (POST /users/login) are not browser sessions and never get one.
//
// Pure: no Meteor, no database. Shared by the server and plain-Node tests.

const MAX_MINUTES = 10080; // a week
// How often a busy browser reports, and so how much a session can overrun the
// limit by: it is never signed out early, and at most this much late.
const TOUCH_INTERVAL_MS = 60 * 1000;

function idleLogoutConfig(get) {
  const raw = get('LOGOUT_IDLE_MINUTES');
  if (raw === undefined || raw === null || String(raw).trim() === '') return { enabled: false };
  const minutes = Number(String(raw).trim());
  if (!Number.isInteger(minutes) || minutes < 0) {
    return { enabled: false, reason: 'LOGOUT_IDLE_MINUTES must be a whole number of minutes' };
  }
  if (minutes === 0) return { enabled: false };
  return { enabled: true, minutes: Math.min(minutes, MAX_MINUTES) };
}

// Tokens last active before this have been idle too long at `now`.
function idleCutoff(now, config) {
  if (!config.enabled) return null;
  return new Date(now.getTime() - config.minutes * 60 * 1000);
}

module.exports = { idleLogoutConfig, idleCutoff, MAX_MINUTES, TOUCH_INTERVAL_MS };
