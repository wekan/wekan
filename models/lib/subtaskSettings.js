// Pure helpers for a board's "Subtasks" landing settings: which board and
// which list the Board Settings -> Subtasks pickers show as selected
// (client/components/sidebar/sidebar.js). Free of any Meteor / Mongo
// dependency so server/lib/tests/subtaskSettings.tests.js drives them directly.
//
// A board stores the landing target in three optional fields:
//   - subtasksDefaultBoardId
//   - subtasksDefaultListId
//   - subtasksDefaultSwimlaneId   (optional; may be undefined on older boards)
//
// A null, undefined, empty or "null" field is "not configured", and then no
// option is selected.

function isConfigured(value) {
  return value !== null && value !== undefined && value !== '' && value !== 'null';
}

/**
 * Whether the given listId is the board's configured subtasks landing list.
 * Used by the "Landing list for subtasks deposited here" dropdown to mark the
 * currently-selected option.
 *
 * @param {Object} board
 * @param {*} listId
 * @returns {boolean}
 */
export function isSelectedSubtaskList(board, listId) {
  const b = board || {};
  return isConfigured(b.subtasksDefaultListId) && b.subtasksDefaultListId === listId;
}

/**
 * Whether the given boardId is the board's configured subtasks deposit board.
 *
 * @param {Object} board
 * @param {*} boardId
 * @returns {boolean}
 */
export function isSelectedSubtaskBoard(board, boardId) {
  const b = board || {};
  return isConfigured(b.subtasksDefaultBoardId) && b.subtasksDefaultBoardId === boardId;
}
