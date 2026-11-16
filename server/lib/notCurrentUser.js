'use strict';

// #6919: a publication that sends users with only a few `profile.*` fields must
// never send the CURRENT user. DDP merges only top-level fields, so such a
// publication competes with the accounts publication of the user's whole
// profile; Meteor re-runs named subscriptions before the accounts one on every
// login - a reconnect included - and the narrow one then wins. The client's
// profile shrank to those few fields until the page was reloaded, and every
// preference in it went back to its default: a checklist folded on a minicard
// unfolded half a second later, and #6691 had found the same for the board
// view. The current user's own document is published in full already (and its
// other top-level fields by `user-admin`), so leaving it out loses nothing.
// tests/noNarrowProfileForCurrentUser6919.test.cjs finds every such
// publication and requires this.
function notCurrentUser(selector, userId) {
  if (!userId) return selector;
  return { $and: [selector || {}, { _id: { $ne: userId } }] };
}

module.exports = { notCurrentUser };
