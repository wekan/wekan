'use strict';

// The selector matching cards that belong to a board: the board itself, plus its
// subtasks-default board when one is configured.
//
// Why this helper exists (10.22 "boards load lists/columns but never cards"):
// the card queries used `{ boardId: { $in: [board._id, board.subtasksDefaultBoardId] } }`,
// and `subtasksDefaultBoardId` defaults to `null`. On FerretDB v1 (SQLite) a `$in`
// list that contains a non-string element (the `null`) does NOT push down at all,
// so the WHERE clause is dropped and the whole `cards` collection is full-scanned
// and sjson-decoded in Go on EVERY poll-and-diff cycle. Lists/swimlanes use a plain
// `boardId` equality, which is index-backed and fast — hence columns appear but
// cards never do. Build the id list WITHOUT null, and use a plain equality when
// only the board itself is in scope, so the card query stays index-backed like the
// lists selector.
function boardScopeIds(board) {
  const ids = [];
  if (board && typeof board._id === 'string' && board._id.length > 0) {
    ids.push(board._id);
  }
  if (board && typeof board.subtasksDefaultBoardId === 'string' && board.subtasksDefaultBoardId.length > 0) {
    ids.push(board.subtasksDefaultBoardId);
  }
  return ids;
}

// Returns a Mongo selector fragment `{ boardId: <id> }` (equality, index-backed)
// or `{ boardId: { $in: [id1, id2] } }` — never an $in that contains null. Spread
// it into a card selector: `{ ...boardCardScope(board), archived: false }`.
function boardCardScope(board) {
  const ids = boardScopeIds(board);
  if (ids.length <= 1) {
    return { boardId: ids[0] };
  }
  return { boardId: { $in: ids } };
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
// Merging at the top level (rather than wrapping both in a `$and`) is what keeps
// `boardId`/`archived` pushing down to FerretDB v1 (SQLite)'s index: FerretDB does
// NOT push down a top-level `$and`, so the wrapped form full-scans the whole
// `cards` table on every poll. But a top-level merge can only be used when the
// two do not both speak for the same key — otherwise one would silently replace
// the other, and for the assigned-only clause that direction decides whether a
// restriction is enforced or dropped. So: merge when the keys are disjoint, and
// fall back to `$and` when they are not, where BOTH still hold.
function mergeCardScope(clientSelector, scope) {
  const client = clientSelector || {};
  const server = scope || {};
  const collides = Object.keys(server).some(key =>
    Object.prototype.hasOwnProperty.call(client, key),
  );
  return collides ? { $and: [client, server] } : { ...client, ...server };
}

module.exports = {
  boardScopeIds,
  boardCardScope,
  isAssignedOnlyMember,
  assignedOnlyCardScope,
  mergeCardScope,
};
