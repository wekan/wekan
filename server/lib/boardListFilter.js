// #5582: internal helper boards must not leak into user-facing board lists or
// the REST API. Two kinds of boards are internal-only:
//   1. Boards whose title is wrapped in carets, e.g. `^Subtasks^` — these are
//      created by internal helpers (subtasks linking, etc.), not real user
//      boards.
//   2. Boards whose `type` is not `'board'` (e.g. `'template'`, `'list'`,
//      `'template-container'`, `'cardTemplate'`) — these are not standalone
//      user boards either.
//
// This is a pure module (no Meteor / DB dependencies) so it can be unit tested
// in the plain mocha runner and shared between the client board list and the
// server REST endpoints.

// True when the title is wrapped in carets, e.g. `^Subtasks^`.
export function isCaretWrappedTitle(title) {
  return typeof title === 'string' && /^\^.*\^$/.test(title.trim());
}

// A board is visible to users only when it is a real `'board'` and its title is
// not caret-wrapped.
export function isUserVisibleBoard(board) {
  if (!board || typeof board !== 'object') {
    return false;
  }
  if (board.type !== 'board') {
    return false;
  }
  if (isCaretWrappedTitle(board.title)) {
    return false;
  }
  return true;
}

// Filter an array of boards down to the user-visible ones.
export function filterUserBoards(boards) {
  if (!Array.isArray(boards)) {
    return [];
  }
  return boards.filter(isUserVisibleBoard);
}
