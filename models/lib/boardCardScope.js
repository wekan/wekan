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

module.exports = { boardScopeIds, boardCardScope };
