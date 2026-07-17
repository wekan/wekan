// Pure helpers for subtask navigation guards.
//
// #4762: "Subtask board is not accessible until reload".
// When a subtask lives on another board, that board may not yet be loaded in
// the ReactiveCache when the popup handler runs. Dereferencing the missing
// board (e.g. board._id) throws and the navigation silently fails until a
// reload populates the cache. Use this guard before navigating, mirroring the
// existing `if (board)` check in the js-go-to-subtask-board handler.
export function canNavigateToSubtaskBoard(board) {
  return Boolean(board && board._id);
}

// #3743: "Subtask 'View it' button opens the parent card instead of the
// subtask". The navigation target must be derived from the SUBTASK card
// itself (its own board, slug and id) and never from the parent/current
// card. Centralise that here so the handler cannot accidentally reference
// the parent card again, and so the behaviour is unit-testable.
//
// Returns the FlowRouter 'card' route params taken from the subtask, or
// undefined for a malformed subtask (no usable card id / board id).
//
// #1853: "Subtask board id missing: cannot read property _id of undefined".
// The subtask often lives on ANOTHER board (the deposit/target board) whose
// document is not in minimongo while the parent card's board is open. In that
// case subtask.board() yields nothing; instead of crashing (the original
// TypeError) or silently doing nothing (the post-#4762 behaviour), fall back
// to the subtask's own boardId and the default 'board' slug — the 'card'
// route action only uses :boardId/:cardId (config/router.js) and its
// subscriptions load the board, so navigation succeeds without a reload.
// 'board' is the model's own default slug (models/boards.js).
export function subtaskNavTarget(subtask) {
  if (!subtask) {
    return undefined;
  }
  // Prefer the real card id (resolves linked subtask cards to their source);
  // fall back to the plain _id when getRealId is unavailable (e.g. in tests).
  const cardId =
    (typeof subtask.getRealId === 'function' ? subtask.getRealId() : undefined) ||
    subtask._id;
  if (!cardId) {
    // Malformed subtask document: nothing sane to navigate to.
    return undefined;
  }
  const board = typeof subtask.board === 'function' ? subtask.board() : undefined;
  if (canNavigateToSubtaskBoard(board)) {
    return {
      boardId: board._id,
      slug: board.slug,
      cardId,
      swimlaneId: subtask.swimlaneId,
      listId: subtask.listId,
    };
  }
  if (subtask.boardId) {
    // Board doc missing locally (#1853 / #4762): navigate by id and let the
    // route load the board. The slug segment is cosmetic for the card route.
    return {
      boardId: subtask.boardId,
      slug: 'board',
      cardId,
      swimlaneId: subtask.swimlaneId,
      listId: subtask.listId,
    };
  }
  // No board reference at all: broken subtask, don't navigate (and don't
  // throw — the caller shows a warning instead).
  return undefined;
}

// Same idea for the "Go to board" popup entry (js-go-to-subtask-board):
// prefer the loaded board's id/slug, fall back to the subtask's boardId so a
// not-yet-subscribed deposit board is still reachable (#1853).
export function subtaskBoardNavTarget(subtask) {
  if (!subtask) {
    return undefined;
  }
  const board = typeof subtask.board === 'function' ? subtask.board() : undefined;
  if (canNavigateToSubtaskBoard(board)) {
    return { id: board._id, slug: board.slug };
  }
  if (subtask.boardId) {
    return { id: subtask.boardId, slug: 'board' };
  }
  return undefined;
}
