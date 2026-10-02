'use strict';

// A destination pointer is not read permission. Foreign deposit content is
// published beneath its own reactive, authorized board cursor instead.
function boardScopeIds(board) {
  if (!board || typeof board._id !== 'string' || board._id.length === 0) return [];
  return [board._id];
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

// May this user copy (or move) content out of this board? A copy shows the
// content in a board the user controls, so an assigned-only member may copy
// only a card assigned to them - never a whole list or swimlane, which holds
// cards they cannot see. Pass the card for a card copy, nothing for a container.
function mayCopyFromBoard(board, userId, card) {
  if (!isAssignedOnlyMember(board, userId)) return true;
  return !!card && Array.isArray(card.assignees) && card.assignees.includes(userId);
}

module.exports = {
  mayCopyFromBoard,
  boardScopeIds,
  boardCardScope,
  isAssignedOnlyMember,
  assignedOnlyCardScope,
  mergeCardScope,
};
