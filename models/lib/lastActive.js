// Presence for Admin Panel > People (GitHub #3678, #3734): when did a user last
// use WeKan, and is that recent enough to call them "online now". Pure
// arithmetic on purpose, so it is testable without a server or a database - see
// tests/lastActive.test.cjs.
//
// The timestamp itself is written by two things, both best-effort and never
// allowed to fail a real request: `Accounts.onLogin` in
// `server/lastActiveOnLogin.js` (every successful login), and the
// `users.heartbeat` Meteor method called periodically by an open client
// session (client/lastActiveHeartbeat.js). Together that is "last seen at
// login, refreshed while active" - not a full presence/WebSocket system, which
// is more than either issue actually asked for.

// Default recency window for the "online now" badge: five minutes. Long enough
// that the heartbeat interval (see client/lastActiveHeartbeat.js) does not
// flicker the badge between heartbeats, short enough to mean "here right now".
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Is `lastActiveAt` recent enough (within `thresholdMs` of `now`) to show the
 * user as currently online. `lastActiveAt` may be a Date, a value Date can
 * parse, or missing/invalid - all of those mean "not online".
 */
function isRecentlyActive(lastActiveAt, now = new Date(), thresholdMs = ONLINE_THRESHOLD_MS) {
  if (!lastActiveAt) return false;
  const at = lastActiveAt instanceof Date ? lastActiveAt : new Date(lastActiveAt);
  const nowDate = now instanceof Date ? now : new Date(now);
  const atTime = at.getTime();
  const nowTime = nowDate.getTime();
  if (Number.isNaN(atTime) || Number.isNaN(nowTime)) return false;
  return nowTime - atTime <= thresholdMs && nowTime - atTime >= 0;
}

module.exports = { ONLINE_THRESHOLD_MS, isRecentlyActive };
