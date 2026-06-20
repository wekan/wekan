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
// undefined when the subtask's board is not loaded yet (see #4762 guard).
export function subtaskNavTarget(subtask) {
  if (!subtask) {
    return undefined;
  }
  const board = typeof subtask.board === 'function' ? subtask.board() : undefined;
  if (!canNavigateToSubtaskBoard(board)) {
    return undefined;
  }
  // Prefer the real card id (resolves linked subtask cards to their source);
  // fall back to the plain _id when getRealId is unavailable (e.g. in tests).
  const cardId =
    typeof subtask.getRealId === 'function' ? subtask.getRealId() : subtask._id;
  return {
    boardId: board._id,
    slug: board.slug,
    cardId,
    swimlaneId: subtask.swimlaneId,
    listId: subtask.listId,
  };
}
