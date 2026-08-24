'use strict';

// Pure selector builder for the per-board Table view. The active Filter owns a
// top-level $or, so always combine it with the board boundary through $and.
function tableViewCardsSelector(boardId, filterSelector) {
  const base = { boardId, archived: false };
  if (!filterSelector || Object.keys(filterSelector).length === 0) return base;
  return { $and: [filterSelector, base] };
}

export { tableViewCardsSelector };
