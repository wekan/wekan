'use strict';

// ImportPlacementBleed: an import INTO a board (the scoped importer, reached by
// POST /api/import/zip and the importScoped method) was authorized on its
// boardId alone. The listId, swimlaneId and cardId beside it - where the
// imported cards land - were taken as they were, so a writer of board A could
// create cards on A whose list and swimlane were board B's, and could ask
// whether a card id existed on a board they cannot see. The REST card create
// refuses the same thing (restPlacementError, #6572).
//
// Pure: the caller looks each id up WITH the board's id in the query and hands
// over what it found, so the decision is testable without a database.
//   target: { boardId, listId?, swimlaneId?, cardId? } as the request gave it
//   found:  { list, swimlane, card } - each the document found on THAT board,
//           or null/undefined when there is none there
// Returns null when every id given belongs to the board, else which one does
// not: 'listId', 'swimlaneId' or 'cardId'.

const PLACEMENT_KEYS = ['listId', 'swimlaneId', 'cardId'];
const FOUND_KEY = { listId: 'list', swimlaneId: 'swimlane', cardId: 'card' };

function given(value) {
  return value !== undefined && value !== null && value !== '';
}

function importPlacementError(target, found) {
  const t = target || {};
  const f = found || {};
  for (const key of PLACEMENT_KEYS) {
    if (!given(t[key])) continue;
    const doc = f[FOUND_KEY[key]];
    if (typeof t[key] !== 'string' || !doc || doc._id !== t[key] || doc.boardId !== t.boardId) return key;
  }
  return null;
}

module.exports = { PLACEMENT_KEYS, importPlacementError };
