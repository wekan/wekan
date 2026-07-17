'use strict';

// Pure helpers for deriving a username for a NEW user invited to a board by
// email address (Meteor method `inviteUserToBoard` in server/models/users.js).
// Extracted so the username-collision rules are unit-testable without Meteor.
//
// #619 ("Not possible to invite multiple users with similar email
// addresses"): inviting cats@foo.com creates a user named "cats" (the email
// local part). Inviting cats@facebook.com afterwards passed the bare local
// part to Accounts.createUser again, which threw Meteor's raw
// `Error 403: Username already exists.` — surfaced in the Add-Member popup as
// an "inaccurate error: 403". The invitee's username is an implementation
// detail here (the human typed an EMAIL, not a username), so instead of
// failing, the caller should pick the first free variant of the local part:
// "cats", "cats1", "cats2", … up to a bounded number of attempts.

// Lowercased local part of an email address ("Cats@Foo.com" -> "cats").
// Mirrors the normalization inviteUserToBoard applies (whole address is
// lowercased before splitting). Returns '' for non-strings and for strings
// without a usable local part (no '@', or '@' first), so callers can treat
// falsy as "not an email".
function usernameFromEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }
  const normalized = email.trim().toLowerCase();
  const posAt = normalized.indexOf('@');
  if (posAt <= 0) {
    return '';
  }
  return normalized.substring(0, posAt);
}

// Derive a username for a new invitee that does not collide with an existing
// account: the email local part itself when free, otherwise the first free
// "<localPart><n>" (n = 1, 2, …). `isUsernameTaken(candidate)` is supplied by
// the caller (sync or async, e.g. a ReactiveCache.getUser lookup) so this
// stays a pure, Meteor-free module.
//
// Returns null when the email has no usable local part or when every
// candidate within `maxAttempts` is taken — callers must treat null as
// "could not create the user" and raise a proper, translatable error instead
// of letting Accounts.createUser throw a raw 403.
async function deriveUniqueInviteeUsername(
  email,
  isUsernameTaken,
  { maxAttempts = 100 } = {},
) {
  if (typeof isUsernameTaken !== 'function') {
    throw new TypeError('isUsernameTaken must be a function');
  }
  const base = usernameFromEmail(email);
  if (!base) {
    return null;
  }
  if (!(await isUsernameTaken(base))) {
    return base;
  }
  for (let suffix = 1; suffix < maxAttempts; suffix += 1) {
    const candidate = `${base}${suffix}`;
    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }
  return null;
}

module.exports = {
  usernameFromEmail,
  deriveUniqueInviteeUsername,
};
