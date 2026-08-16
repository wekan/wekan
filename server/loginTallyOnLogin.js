import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { recordLoginFireAndForget } from '/server/lib/loginTally';

// Record where each successful login came from, and who logs in from each
// address (server/lib/loginTally.js). Its own trigger rather than a line added
// to avatarLocalizationOnLogin.js: they run at the same moment and share
// nothing, and a failure in either must not be able to affect the other.
//
// Fire-and-forget, like its neighbour: a login that succeeded must not fail
// because WeKan could not write down where it came from.
if (Meteor.isServer) {
  Accounts.onLogin((info) => {
    if (!info || !info.user) return;
    recordLoginFireAndForget(info.user, info.connection);
  });
}
