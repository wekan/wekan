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
// { allowed: false, error, reason } - never throws, so the Meteor method can
// turn a denial straight into a Meteor.Error.
function decideAnonymize({ currentUserId, currentUser, targetUserId, targetUser, adminsCount }) {
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
      'services.resume.loginTokens': '',
    },
    $unset: {
      'services.password': '',
      'profile.token': '',
    },
  };
}

module.exports = { decideAnonymize, buildAnonymizeUpdate };
