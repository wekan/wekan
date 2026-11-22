'use strict';

// Deleting or anonymising your OWN account, decided on the server
// (docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
//
// Admin Panel / People / Login / "Self delete user account"
// (AccountSettings 'accounts-allowUserDelete', off by default) used to hide
// the Delete and Anonymize buttons of the user's own profile and nothing else:
// Meteor.call('removeUser', myId) and Meteor.call('anonymizeUser', myId) still
// worked. And removeUser's self branch returned before the last-administrator
// check, so the only site administrator could delete themselves and leave the
// instance with nobody to run it.
//
// Every self-removal path asks this one rule: the removeUser and anonymizeUser
// methods (server/models/users.js, through models/lib/userAnonymization.js
// for anonymizeUser) and DELETE /api/users/:userId when an administrator names
// their own id. tests/selfAccountRemoval.test.cjs fails on a path that does not.
//
// Pure CommonJS, no Meteor.

const REASONS = Object.freeze({
  disabled: 'Deleting your own account is not allowed',
  lastAdminDelete: 'Cannot delete the last administrator',
  lastAdminAnonymize: 'Cannot anonymize the last administrator',
});

// null when this user may remove their own account, otherwise
// { error, reason, attempt }. `attempt` is true when no screen offers the
// call: the buttons are not drawn while the setting is off, so only a crafted
// call - or a page open from before the change - reaches that refusal. The
// last-administrator refusal is ordinary use (the buttons are there).
//   selfDeleteAllowed - AccountSettings 'accounts-allowUserDelete' booleanValue
//   isAdmin           - the user is a site administrator
//   adminsCount       - how many site administrators there are, the user included
//   action            - 'delete' (the default) or 'anonymize'
function selfRemovalRefusal({ selfDeleteAllowed, isAdmin, adminsCount, action = 'delete' } = {}) {
  if (selfDeleteAllowed !== true) {
    return { error: 'not-authorized', reason: REASONS.disabled, attempt: true };
  }
  if (isAdmin === true && !(Number(adminsCount) > 1)) {
    return {
      error: 'not-authorized',
      reason: action === 'anonymize' ? REASONS.lastAdminAnonymize : REASONS.lastAdminDelete,
      attempt: false,
    };
  }
  return null;
}

module.exports = { selfRemovalRefusal, REASONS };
