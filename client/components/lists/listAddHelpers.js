// Pure helpers for the "add list" affordance.
//
// Issue #6142: In "Lists" board-view mode there was no UI affordance to add a
// new list — only the "Swimlanes" mode rendered the trailing add-list composer.
// These helpers keep the (testable) decision logic out of the Blaze templates.

// Board-view modes in which an "add list" composer should be offered.
// Both the swimlanes view and the lists view let the user create a list; the
// other views (calendar, gantt, table) do not render the list composer.
export const ADD_LIST_VIEW_MODES = ['board-view-swimlanes', 'board-view-lists'];

// Returns true when the given board-view mode should show the add-list
// composer. Used so Lists mode gets the same affordance as Swimlanes mode.
export function canAddListInView(viewMode) {
  return ADD_LIST_VIEW_MODES.indexOf(viewMode) !== -1;
}

// Decide which swimlane a newly created list should belong to when the user
// adds a list from a view that is not bound to a specific swimlane (e.g. the
// Lists view). Prefer an explicitly provided swimlane id, otherwise fall back
// to the board's default swimlane id.
//
// `board` only needs to expose a `getDefaultSwimline()` method (the WeKan
// Board model does); it may also be a plain object for testing.
export function defaultSwimlaneIdForBoard(board, explicitSwimlaneId) {
  if (explicitSwimlaneId) {
    return explicitSwimlaneId;
  }
  if (board && typeof board.getDefaultSwimline === 'function') {
    const swimlane = board.getDefaultSwimline();
    if (swimlane && swimlane._id) {
      return swimlane._id;
    }
  }
  return null;
}
