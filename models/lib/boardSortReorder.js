'use strict';

// Pure helpers for reordering boards on the All Boards page by drag-and-drop.
// Extracted so the decision logic is unit-testable in plain Node without Meteor
// (mirrors models/lib/cardSearch.js).
//
// #6439 (Custom (drag order) sort — drag shows 'not-allowed' cursor, drop does
// not reorder): the old jQuery-ui sortable that reordered boards in the "custom"
// mode was removed when the All Boards page moved to HTML5 drag-and-drop for
// workspace/space management, and no HTML5 reorder handler replaced it. Boards
// carry draggable="true", but with no drop target that accepts them the browser
// shows the forbidden cursor and nothing persists to profile.boardSortIndex.
//
// The wiring lives in client/components/boards/boardsList.js; the pieces below
// are the two decisions worth testing in isolation:
//   1. whether drag-reordering should be active for the current sort mode, and
//   2. the new per-user boardSortIndex mapping produced by a drop.

// Drag-reordering only makes sense in the manual "custom" order. In the sorted
// modes ('title-asc' / 'title-desc') the order is derived from the title, so a
// manual drop must be ignored (and the board grid must not offer a drop target).
function isDragReorderEnabled(sortBy) {
  return sortBy === 'custom';
}

// Given the currently displayed board ids (in display order), move `draggedId`
// so it sits immediately before `targetId` (the board it was dropped on). Returns
// the new ordered array, or null when the drop is a no-op or the ids are unknown.
function computeReorderedIds(orderedIds, draggedId, targetId) {
  if (!Array.isArray(orderedIds)) return null;
  if (!draggedId || !targetId || draggedId === targetId) return null;
  const from = orderedIds.indexOf(draggedId);
  const to = orderedIds.indexOf(targetId);
  if (from === -1 || to === -1) return null;
  const result = orderedIds.slice();
  result.splice(from, 1);
  // Insert before the target's current position (after the dragged id has been
  // removed), so the dragged board takes the target's slot and pushes it down.
  const insertAt = result.indexOf(targetId);
  result.splice(insertAt, 0, draggedId);
  return result;
}

// Turn an ordered list of board ids into a { boardId: index } mapping suitable
// for profile.boardSortIndex. Sequential integers keep the order stable and
// avoid fractional drift on repeated reorders.
function computeSortIndexMapping(orderedIds) {
  const mapping = {};
  (orderedIds || []).forEach((id, i) => {
    mapping[id] = i;
  });
  return mapping;
}

// Convenience: compute the persisted boardSortIndex mapping for a drop, or null
// when the drop changes nothing (so callers can skip the write).
function computeReorderedSortIndex(orderedIds, draggedId, targetId) {
  const reordered = computeReorderedIds(orderedIds, draggedId, targetId);
  if (!reordered) return null;
  return computeSortIndexMapping(reordered);
}

module.exports = {
  isDragReorderEnabled,
  computeReorderedIds,
  computeSortIndexMapping,
  computeReorderedSortIndex,
};
