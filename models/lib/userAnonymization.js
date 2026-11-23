// #2731: pure decision/update-shape logic for anonymizeUser, split out of
// server/models/users.js so it can be unit-tested without Meteor - same
// pattern as models/lib/userDeletionCleanup.js for removeUser.
//
// anonymizeUser is the GDPR-friendlier alternative to removeUser: it scrubs
// the directly-identifying profile fields of a Users document IN PLACE and
// disables login, but - unlike removeUser - it never prunes or touches any
// board/card/comment/activity reference to the userId. Those keep pointing at
// the same id, which now simply resolves to the anonymized name.

// Decides whether `currentUserId` may anonymize `targetUser`, mirroring the
// self/admin split removeUser already uses. Returns { allowed: true } or
// { allowed: false, error, reason, attempt } - never throws, so the Meteor
// method can turn a denial straight into a Meteor.Error. Anonymizing one's own
// account follows Admin Panel / People / Login / "Self delete user account"
// (`selfDeleteAllowed`) and never leaves the instance without a site
// administrator (models/lib/selfAccountRemoval.js).
function decideAnonymize({ currentUserId, currentUser, targetUserId, targetUser, adminsCount, selfDeleteAllowed }) {
  if (!currentUserId) {
    return { allowed: false, error: 'not-authorized', reason: 'User must be logged in' };
  }
  if (!currentUser) {
    return { allowed: false, error: 'not-authorized', reason: 'Current user not found' };
  }
  if (!targetUser) {
    return { allowed: false, error: 'user-not-found', reason: 'Target user not found' };
  }

  const isSelf = currentUserId === targetUserId;
  if (!isSelf && !currentUser.isAdmin) {
    return {
      allowed: false,
      error: 'not-authorized',
      reason: 'Only administrators can anonymize other users',
    };
  }

  if (isSelf) {
    const refusal = require('./selfAccountRemoval').selfRemovalRefusal({
      selfDeleteAllowed, isAdmin: currentUser.isAdmin === true, adminsCount, action: 'anonymize',
    });
    if (refusal) return { allowed: false, ...refusal };
  }

  if (!isSelf && adminsCount === 1 && targetUser.isAdmin) {
    return {
      allowed: false,
      error: 'not-authorized',
      reason: 'Cannot anonymize the last administrator',
    };
  }

  return { allowed: true, isSelf };
}

// Builds the Mongo $set/$unset modifier that scrubs a Users document. Takes
// the placeholder as an argument (callers supply their own random id, e.g.
// Random.id()) so this stays pure and deterministic for tests.
function buildAnonymizeUpdate(placeholder) {
  if (!placeholder || typeof placeholder !== 'string') {
    throw new Error('buildAnonymizeUpdate requires a non-empty placeholder string');
  }
  return {
    $set: {
      username: placeholder,
      'profile.fullname': placeholder,
      'profile.initials': '',
      'profile.avatarUrl': '',
      emails: [{ address: `${placeholder}@anonymized.invalid`, verified: false }],
      loginDisabled: true,
      anonymized: true,
      anonymizedAt: new Date(),
      // Every sign-in service goes - password, OIDC, GitHub, CAS, SAML, LDAP,
      // two-factor - not only the password: replacing `services` whole is
      // what signs the account out everywhere and leaves no identity of an
      // outside provider behind (WP-4).
      services: { resume: { loginTokens: [] } },
    },
    $unset: {
      'profile.token': '',
      // Personal data the account held beside its name (WP-4,
      // docs/Compliance/README.md): where it signed in from, its passkeys and
      // SQRL identity, push and ntfy subscriptions, its e-mail-to-card address
      // and the notification e-mails waiting for it.
      loginAddresses: '',
      passkeys: '',
      sqrl: '',
      webPushSubscriptions: '',
      ntfy: '',
      'profile.emailToCard': '',
      'profile.emailBuffer': '',
    },
  };
}

module.exports = { decideAnonymize, buildAnonymizeUpdate };
