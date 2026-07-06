'use strict';

// Pure helper choosing the language of the board-invitation email. Extracted
// from server/models/users.js (inviteUserToBoard) so the rule is explicit and
// unit-testable without Meteor.
//
// #5664 ("Change the email board invitation language"): the invite email must be
// localised as follows —
//   - when the invitee is an ALREADY-EXISTING user, use THAT user's (the
//     recipient's) profile language, so the person receiving the invite reads it
//     in their own language;
//   - when the invitee is a NEW user (created by the invite), use the INVITER's
//     profile language, since the new account has no language preference of its
//     own yet.
// A missing/empty language falls back to 'en' (i.e. en.i18n.json), matching
// User.getLanguage()'s default.

function chooseInviteEmailLanguage({
  isNewUser,
  inviterLanguage,
  recipientLanguage,
} = {}) {
  const lang = isNewUser ? inviterLanguage : recipientLanguage;
  return lang || 'en';
}

module.exports = { chooseInviteEmailLanguage };
