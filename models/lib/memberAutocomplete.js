'use strict';

// Pure helper for the "@" member autocomplete (issue #5116 follow-up): typing
// "@ann" should suggest the board member "Anna" / username "anna.smith". The
// add-card-title strategy in client/components/lists/listBody.js used a
// case-SENSITIVE, prefix-only, username-only match
// (user.username.indexOf(term) === 0), so "@ann" did not match "Anna", "@Anna"
// did not match username "anna", and a full-name-only search never matched. It
// also threw if ReactiveCache.getUser() returned null. The card description /
// comment editor (client/components/main/editor.js) already matched
// case-insensitively on username OR full name, but shared no code and had the
// same null hazard.
//
// Extracted here (mirrors models/lib/labelAutocomplete.js and the other
// models/lib pure helpers) so both call sites match members the same way and it
// is unit-testable in plain Node without Meteor.

// Does `user` match the typed `term`? Case-insensitive substring match against
// the username and the profile full name. A null/undefined user, or a missing
// username/fullname, is treated safely (no throw). An empty term matches every
// user (the menu shows all members before anything is typed).
function memberMatchesTerm(user, term) {
  if (!user) return false;
  const needle = String(term == null ? '' : term).toLowerCase();
  const username = String(user.username == null ? '' : user.username).toLowerCase();
  const fullname = String(
    (user.profile && user.profile.fullname) == null ? '' : user.profile.fullname,
  ).toLowerCase();
  return username.indexOf(needle) > -1 || fullname.indexOf(needle) > -1;
}

// Filter a list of user documents by the typed term, preserving input order.
// Does not mutate the input; skips null/undefined entries.
function filterMembersByTerm(users, term) {
  if (!Array.isArray(users)) return [];
  return users.filter(user => memberMatchesTerm(user, term));
}

module.exports = {
  memberMatchesTerm,
  filterMembersByTerm,
};
