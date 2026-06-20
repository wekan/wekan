// Pure helpers for resolving a board's "Subtasks" landing settings:
// where a newly-created subtask card should be deposited.
//
// These helpers are intentionally free of any Meteor / Mongo dependency so
// they can be unit-tested in isolation (see server/lib/tests/subtaskSettings.tests.js).
//
// A board stores the landing target in three optional fields:
//   - subtasksDefaultBoardId
//   - subtasksDefaultListId
//   - subtasksDefaultSwimlaneId   (optional; may be undefined on older boards)
//
// When a field is null/undefined it is considered "not configured" and the
// caller-supplied fallback value is used instead.

function isConfigured(value) {
  return value !== null && value !== undefined && value !== '' && value !== 'null';
}

/**
 * Resolve where a new subtask card should land.
 *
 * @param {Object} board    The parent board document (or a plain object with the
 *                          subtasksDefault* fields).
 * @param {Object} fallback Default {boardId, listId, swimlaneId} to use when the
 *                          board has no configured value for a given field.
 * @returns {{boardId: *, listId: *, swimlaneId: *}}
 */
export function resolveSubtaskLanding(board, fallback = {}) {
  const b = board || {};
  const fb = fallback || {};
  return {
    boardId: isConfigured(b.subtasksDefaultBoardId)
      ? b.subtasksDefaultBoardId
      : fb.boardId,
    listId: isConfigured(b.subtasksDefaultListId)
      ? b.subtasksDefaultListId
      : fb.listId,
    swimlaneId: isConfigured(b.subtasksDefaultSwimlaneId)
      ? b.subtasksDefaultSwimlaneId
      : fb.swimlaneId,
  };
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
