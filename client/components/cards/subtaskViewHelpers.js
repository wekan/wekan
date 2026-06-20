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
