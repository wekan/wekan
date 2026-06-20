/**
 * Pure helpers for displaying the status (current list / board) of a subtask.
 *
 * Issue #6091 "Visible status of sub-tasks": when viewing a card's subtasks,
 * show each subtask's current list name (and board, when the subtask lives on a
 * different board than the parent card).
 *
 * Kept dependency-free so it can be unit tested in isolation (mocha + chai).
 */

/**
 * Build the human readable status label for a subtask.
 *
 * @param {Object} args
 * @param {string} [args.listTitle] - Title of the list the subtask resides in.
 * @param {string} [args.boardTitle] - Title of the board the subtask resides in.
 * @param {boolean} [args.sameBoard=true] - Whether the subtask is on the same
 *   board as the parent card. When false, the board title is prefixed.
 * @returns {string} The display string:
 *   - `listTitle` when the subtask is on the same board,
 *   - `boardTitle / listTitle` when it is on a different board,
 *   - a graceful fallback (whichever part is available) when one is missing,
 *   - empty string when nothing is known.
 */
export function subtaskStatusLabel({ listTitle, boardTitle, sameBoard = true } = {}) {
  const list = (listTitle || '').trim();
  const board = (boardTitle || '').trim();

  if (sameBoard) {
    return list;
  }

  // Different board: prefix with the board title when available.
  if (board && list) {
    return `${board} / ${list}`;
  }
  return board || list;
}
