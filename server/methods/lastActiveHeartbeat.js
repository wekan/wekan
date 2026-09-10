import { Meteor } from 'meteor/meteor';

// Presence for Admin Panel > People (GitHub #3678, #3734): the "refreshed while
// active" half of the last-active timestamp. server/lastActiveOnLogin.js sets
// it once per login; this lets an open client session (client/lastActiveHeartbeat.js)
// keep it current without a full presence/WebSocket system - a periodic
// timestamp write is all either issue actually asked for.
//
// Deliberately unthrottled server-side beyond "once per call": the client only
// calls this every few minutes (see the heartbeat interval), and a user can
// only update their OWN lastConnectionDate, never anyone else's.
Meteor.methods({
  async usersHeartbeat() {
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    await Meteor.users.updateAsync(userId, {
      $set: { lastConnectionDate: new Date() },
    });
    return true;
  },
});
