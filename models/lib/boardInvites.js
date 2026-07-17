'use strict';

// Pure decision helpers for board invitation accept / decline (quit) flows.
// Extracted so the logic is unit-testable in plain Node without Meteor
// (mirrors models/lib/boardSortReorder.js).
//
// #4730 ("Bugs in adding and removing users"):
//
// Case 2 of the issue — "User A declines the invitation but still sees board 1
// in the personal overview" — was caused by the decline handler on the All
// Boards page (client/components/boards/boardsList.js), which calls
// `quitBoard` (deactivates the member entry) and then `acceptInvite` to clear
// the invitation. The old server-side `acceptInvite` unconditionally set
// `members.$.isActive = true`, immediately RE-ACTIVATING the membership that
// `quitBoard` had just deactivated — so the declined board stayed in the
// user's personal overview as an active membership.
//
// The same unconditional re-activation also let any user with a deactivated
// member entry (i.e. someone an admin had removed from the board) re-add
// themselves simply by calling `Meteor.call('acceptInvite', boardId)` — the
// "adding and removing user A again doesn't fix it" half of Case 1.
//
// Fix: activating a membership through acceptInvite is only legitimate while
// the user actually holds an invitation (profile.invitedBoards contains the
// board id). Declining is made robust by having quitBoard clear the pending
// invitation itself, so the follow-up acceptInvite call finds no invitation
// and becomes a no-op. quitBoard also succeeds (instead of throwing
// error-board-notAMember) for a user who holds a stale invitation without a
// member entry — e.g. after an admin removed them — so a stuck invited board
// can always be removed from the personal overview.

// Whether the given user profile holds a pending invitation to boardId.
function isInvitedToBoard(profile, boardId) {
  if (!boardId) return false;
  const invitedBoards = (profile && profile.invitedBoards) || [];
  return Array.isArray(invitedBoards) && invitedBoards.includes(boardId);
}

// Decide what `quitBoard` (leave board / decline invitation) must do.
// - A member quits: deactivate the member entry, and clear any pending
//   invitation so a later acceptInvite cannot resurrect the membership.
// - A non-member with a pending (stale) invitation: just clear the invitation
//   and report success, so the board disappears from the personal overview.
// - Neither member nor invited: nothing to quit — error.
function planQuitBoard({ isMember, isInvited }) {
  if (!isMember && !isInvited) {
    return {
      ok: false,
      removeMember: false,
      pullInvite: false,
      error: 'error-board-notAMember',
    };
  }
  return {
    ok: true,
    removeMember: !!isMember,
    pullInvite: !!isInvited,
  };
}

// Decide what `acceptInvite` must do. Only a user actually holding an
// invitation may (re)activate their member entry; for anyone else the call is
// a no-op (#4730: this is what used to re-activate declined/removed members).
function planAcceptInvite({ isInvited }) {
  if (!isInvited) {
    return { ok: false, pullInvite: false, activateMember: false };
  }
  return { ok: true, pullInvite: true, activateMember: true };
}

module.exports = {
  isInvitedToBoard,
  planQuitBoard,
  planAcceptInvite,
};
