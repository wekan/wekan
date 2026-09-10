import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// Presence for Admin Panel > People (GitHub #3678, #3734): stamp `lastConnectionDate`
// on every successful login. That field already existed in the user schema
// (models/users.js) but was only ever written from a commented-out,
// env-gated block in server/publications/users.js - so in practice WeKan never
// recorded it. This is the "last seen at login" half; client/lastActiveHeartbeat.js
// is the "and refreshed while the session stays open" half.
//
// Its own trigger rather than a line added to loginTallyOnLogin.js or
// avatarLocalizationOnLogin.js: all three run at the same moment and share
// nothing, and a failure in one must not be able to affect the others.
//
// Fire-and-forget, like its neighbours: a login that succeeded must not fail
// because WeKan could not write down when it happened.
if (Meteor.isServer) {
  Accounts.onLogin((info) => {
    if (!info || !info.user || !info.user._id) return;
    Meteor.users.updateAsync(info.user._id, {
      $set: { lastConnectionDate: new Date() },
    }).catch((error) => {
      if (process.env.DEBUG === 'true') {
        console.error('Failed to update lastConnectionDate on login:', error);
      }
    });
  });
}
