// Presence for Admin Panel > People (GitHub #3678, #3734): keep the current
// user's `lastConnectionDate` current while their session stays open, so an
// admin can see who is active and roughly how recently - not just at login.
// server/lastActiveOnLogin.js already stamps it once per login; this is the
// periodic refresh. Deliberately just a timestamp on an interval - not a
// WebSocket/real-time presence system, which is more than either issue asked
// for (models/lib/lastActive.js explains the threshold the badge uses).
import { Meteor } from 'meteor/meteor';

// A few minutes, comfortably inside models/lib/lastActive.js's five-minute
// "online now" window, so the badge does not flicker off between beats.
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

function beat() {
  if (!Meteor.userId()) return;
  Meteor.call('usersHeartbeat', (error) => {
    if (error && Meteor.isDevelopment) {
      // Best-effort: a missed heartbeat only makes "last active" a little
      // staler, it must never disrupt the session.
      console.error('usersHeartbeat failed:', error);
    }
  });
}

Meteor.startup(() => {
  beat();
  Meteor.setInterval(beat, HEARTBEAT_INTERVAL_MS);
});
