'use strict';

// Pure permission predicate for deleting a board automation Rule (together with
// its Trigger and Action), shared by the server `rules.deleteRule` Meteor method
// and its unit test. Kept free of Meteor imports so it runs under plain Node
// (mirrors models/lib/boardSortReorder.js and models/lib/reconcileBoardTeamMembers.js).
//
// Why this exists: deleting a rule used to run three separate client-side
// Collection.remove() calls (Rules + Triggers + Actions), each gated by a
// per-collection allow() rule that resolves the board from *that document's own*
// boardId (Boards.findOneAsync(doc.boardId)). When a Trigger/Action document had
// no resolvable boardId (legacy rules created before boardId was denormalised, or
// docs not published to the client), the board came back null and the allow rule
// denied the mutation with 403 "Access denied" — failing the whole delete even
// for a legitimate board admin. Deletion now goes through a server method that
// authorizes ONCE with this predicate and removes all three docs server-side.
//
// A rule may be deleted by an ACTIVE board admin, or by a WeKan site admin.
// Read-only / comment-only / worker / plain members and non-members may not.
// This mirrors the board-admin gate used to CREATE a rule
// (server/rulesButton.js `rules.createRule`, which calls board.hasAdmin).

function isActiveBoardAdmin(board, userId) {
  if (!board || !userId || !Array.isArray(board.members)) {
    return false;
  }
  return board.members.some(
    member =>
      member.userId === userId &&
      member.isActive === true &&
      member.isAdmin === true,
  );
}

function canDeleteBoardRule(board, userId, options) {
  const opts = options || {};
  if (opts.isSiteAdmin === true) {
    return true;
  }
  return isActiveBoardAdmin(board, userId);
}

module.exports = {
  isActiveBoardAdmin,
  canDeleteBoardRule,
};
