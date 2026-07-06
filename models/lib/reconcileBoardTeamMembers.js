'use strict';

// Pure helper that reconciles a board's `members` array for the setBoardTeams
// method. Extracted from server/models/boards.js so it is unit-testable without
// Meteor.
//
// #5730 (board disappeared after adding another user): setBoardTeams used to
// blindly overwrite board.members with the array sent by the client. When that
// client's board document was stale — e.g. a member had just been added via
// inviteUserToBoard on the server and the change had not yet propagated — the
// overwrite silently dropped members, and in the worst case the board's own
// admin, which made the whole board vanish from that user's board list (the
// board-list publication requires an ACTIVE membership). And because a wholesale
// `$set: { members }` never passes through foreachRemovedMember(), no
// removeBoardMember activity was logged, so "the logs look normal".
//
// This reconciles against the AUTHORITATIVE server-side members instead of
// trusting the client snapshot:
//   - never drops an active admin (this is what made the board disappear),
//   - keeps every existing member the client still lists (using the existing
//     server entry, so a stale client cannot silently change permissions),
//   - adds the members the client introduces (team-derived users),
//   - reports the non-admin members the client explicitly omitted as removed, so
//     the caller can log + clean up each intentional team-leave removal instead
//     of dropping them silently.
//
// Returns { members, removedMemberIds }.
function reconcileBoardTeamMembers(authoritativeMembers = [], clientMembers = []) {
  const authoritative = Array.isArray(authoritativeMembers)
    ? authoritativeMembers
    : [];
  const client = Array.isArray(clientMembers) ? clientMembers : [];

  const clientById = new Map(client.map(m => [m.userId, m]));
  const authoritativeById = new Map(authoritative.map(m => [m.userId, m]));

  const members = [];
  const removedMemberIds = [];

  for (const existing of authoritative) {
    const isActiveAdmin = !!existing.isActive && !!existing.isAdmin;
    if (clientById.has(existing.userId) || isActiveAdmin) {
      // Keep the authoritative entry. Even if the client still lists this member
      // we deliberately reuse the server entry so a stale client cannot silently
      // change a member's permissions through this team-management path.
      members.push(existing);
    } else {
      removedMemberIds.push(existing.userId);
    }
  }

  for (const member of client) {
    if (!authoritativeById.has(member.userId)) {
      members.push({
        userId: member.userId,
        isAdmin: !!member.isAdmin,
        isActive: member.isActive !== false,
        isNoComments: !!member.isNoComments,
        isCommentOnly: !!member.isCommentOnly,
        isWorker: !!member.isWorker,
        isNormalAssignedOnly: !!member.isNormalAssignedOnly,
        isCommentAssignedOnly: !!member.isCommentAssignedOnly,
        isReadOnly: !!member.isReadOnly,
        isReadAssignedOnly: !!member.isReadAssignedOnly,
      });
    }
  }

  return { members, removedMemberIds };
}

module.exports = { reconcileBoardTeamMembers };
