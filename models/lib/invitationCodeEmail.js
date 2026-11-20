'use strict';

// Pure helpers for the "invite by email" flow (Meteor method `sendInvitation`
// in server/models/settings.js). Extracted so the rules that guarantee "an
// invitation email always carries a code that will validate at sign-up" are
// unit-testable without Meteor.
//
// #4043 ("Sometimes user get board invitation by mail without invitation
// code"): recipients received an invitation email whose code the sign-up form
// then rejected with "The invitation code doesn't exist". Sign-up only accepts
// a code whose stored document matches { code, email, valid: true }
// (server/models/users.js onCreateUser), so the SENDING side must guarantee:
//   1. the stored email is lowercase — the sign-up form lowercases the typed
//      address and MongoDB string matching is case sensitive, so a mixed-case
//      invitation document can never match (normalizeInviteEmail);
//   2. a RE-INVITE never re-sends a stale code: when the stored invitation is
//      no longer valid (e.g. consumed and left with valid:false) or has no
//      usable code, a fresh code must overwrite the old one with `valid`
//      restored to true (buildReinviteModifier) — this is the fix proposed in
//      the #4043 thread ("send a new invitation code that overwrites the last
//      one");
//   3. an email is only sent for an invitation document that exists, has a
//      non-empty string code, and is still valid (isInvitationCodeSendable) —
//      otherwise fail loudly instead of mailing a dead code;
//   4. a failed SMTP send may only roll back (delete) an invitation code that
//      was created by this very invite; deleting a PRE-EXISTING document would
//      silently invalidate the code already delivered in an earlier email
//      (shouldRemoveInvitationOnEmailFailure).

// Lowercase + trim an invitee address so the stored invitation email always
// matches the (lowercased) address the user signs up with. Non-strings
// normalize to '' (callers skip empty results).
function normalizeInviteEmail(email) {
  if (typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

// InviteBleed (GHSA-rg85-qx5c-qx67): an invitation code is the 128-bit value
// server/models/settings.js generateInvitationCode makes -
// crypto.randomBytes(16).toString('base64url'), 22 characters. Until v9.96 a
// code was six digits from Math.random(), and such an invitation, made before
// the upgrade and not used yet, is still in the database as valid: with a
// keyspace of 900,000 it can be guessed. So a code shorter than 22 base64url
// characters is not a code: sign-up refuses it (server/models/users.js), and a
// re-invite replaces it with a strong one instead of mailing it again.
const STRONG_INVITATION_CODE = /^[A-Za-z0-9_-]{22,128}$/;
function isStrongInvitationCode(code) {
  return typeof code === 'string' && STRONG_INVITATION_CODE.test(code);
}

// True when `code` is a strong string code — the only shape the sign-up lookup
// { code: <string from the form>, valid: true } can ever match, and accept.
// Legacy or hand-inserted documents may carry a Number code, which MongoDB will
// never match against the form's string, or a six-digit one, which sign-up
// refuses (isStrongInvitationCode).
function hasUsableCode(invitation) {
  return Boolean(invitation && isStrongInvitationCode(invitation.code));
}

// An invitation email may only be sent for a document that exists, carries a
// usable code, and has not been invalidated (valid === false). A missing
// `valid` field (legacy documents predating the field's defaultValue) counts
// as valid.
function isInvitationCodeSendable(invitation) {
  return hasUsableCode(invitation) && invitation.valid !== false;
}

// Build the Mongo modifier for re-inviting an email that already has an
// invitation document. Always refreshes boardsToBeInvited; additionally
// overwrites the code (and restores valid:true) when the stored one could
// never validate at sign-up — stale (valid:false), missing, empty, or not a
// string. `generateCode` supplies the new code (coerced to String so it
// matches the form input type regardless of the generator).
function buildReinviteModifier(invitation, boards, generateCode) {
  const $set = { boardsToBeInvited: boards };
  if (!invitation || invitation.valid === false || !hasUsableCode(invitation)) {
    $set.code = String(generateCode());
    $set.valid = true;
  }
  return { $set };
}

// After an SMTP failure, only an invitation created by this very invite call
// may be deleted (nothing was ever delivered for it). A pre-existing document
// must survive, because its code was already delivered in an earlier email.
function shouldRemoveInvitationOnEmailFailure({ isNewInvitation } = {}) {
  return isNewInvitation === true;
}

module.exports = {
  isStrongInvitationCode,
  normalizeInviteEmail,
  hasUsableCode,
  isInvitationCodeSendable,
  buildReinviteModifier,
  shouldRemoveInvitationOnEmailFailure,
};
