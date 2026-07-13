import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { localizeUserAvatarIfExternal } from '/server/lib/localizeAvatar';

// Provider-agnostic login trigger: as soon as any user logs in, copy their avatar into
// WeKan's own files/avatars if it currently lives outside WeKan (an OIDC `picture` URL,
// an LDAP jpegPhoto data: URI, a gravatar, a pasted URL, …). Complements the board-open
// trigger by localizing the avatar immediately at login, before any board is opened.
// Best-effort and idempotent (a user whose avatar is already local is a no-op), and
// fire-and-forget so it never blocks or fails the login.
if (Meteor.isServer) {
  Accounts.onLogin((info) => {
    const user = info && info.user;
    if (!user) return;
    localizeUserAvatarIfExternal(user).catch((e) => {
      if (process.env.DEBUG === 'true') {
        console.warn('avatar localize on login failed for', user._id, '-', e && e.message);
      }
    });
  });
}
