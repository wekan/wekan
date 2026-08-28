'use strict';

// The selector matching cards that belong to a board: the board itself, plus its
// subtasks-default board when one is configured.
//
// Keep the ordinary MongoDB selector shape. FerretDB is responsible for pushing
// the null-containing `$in` into its backend without requiring clients to rewrite it.
function boardScopeIds(board) {
  if (!board || typeof board._id !== 'string' || board._id.length === 0) return [];
  return [board._id, board.subtasksDefaultBoardId ?? null];
}

// Spread this into a card selector: `{ ...boardCardScope(board), archived: false }`.
function boardCardScope(board) {
  return { boardId: { $in: boardScopeIds(board) } };
}

// Is this user an ASSIGNED-ONLY member of this board? Three board-member flags
// mean it — isReadAssignedOnly, isNormalAssignedOnly, isCommentAssignedOnly — and
// all three carry the same rule: the member may only see the cards they are
// assigned to.
//
// A user who is not an active member of the board is NOT restricted here. That is
// deliberate and matches the `board` publication: someone reaching a public board
// without membership has no member document to carry a flag, and the restriction
// is a narrowing of what a MEMBER sees, not the board's visibility rule.
function isAssignedOnlyMember(board, userId) {
  if (!userId || !board || !Array.isArray(board.members)) return false;
  const member = board.members.find(
    m => m && m.userId === userId && m.isActive === true,
  );
  if (!member) return false;
  return !!(
    member.isNormalAssignedOnly ||
    member.isCommentAssignedOnly ||
    member.isReadAssignedOnly
  );
}

// The card-selector clause that narrows a board's cards to the ones an
// assigned-only member may see, or null when the member is not restricted.
function assignedOnlyCardScope(board, userId) {
  if (!isAssignedOnlyMember(board, userId)) return null;
  return { assignees: { $in: [userId] } };
}

// Merge a server-side scope into a card selector the CLIENT supplied.
//
// Keep both selectors as ordinary MongoDB conjuncts. This also prevents a client
// key from replacing a server-enforced scope key.
function mergeCardScope(clientSelector, scope) {
  const client = clientSelector || {};
  const server = scope || {};
  return { $and: [client, server] };
}

module.exports = {
  boardScopeIds,
  boardCardScope,
  isAssignedOnlyMember,
  assignedOnlyCardScope,
  mergeCardScope,
};
