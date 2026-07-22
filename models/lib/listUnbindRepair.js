'use strict';

// Repair helper for the #6484 corruption ("nudging a list in swimlanes view hid
// it from other swimlanes"). That bug bound a BOARD-WIDE list (swimlaneId null,
// which renders under EVERY swimlane) to a single swimlane by setting its
// swimlaneId — so the list vanished from the other swimlanes. The code bug is
// fixed (see client/components/swimlanes/swimlanes.js), but boards already
// corrupted keep the wrongly-set swimlaneId; clearing it to null restores the
// list to board-wide so it renders across all swimlanes again.
//
// WeKan renders lists board-wide (Swimlanes.draggableLists filters by boardId
// only), so this repair is run DELIBERATELY per board by an admin when a list
// "disappeared" from swimlanes: it un-binds every swimlane-scoped list on that
// board (sets swimlaneId back to null). Extracted so the selection is
// unit-testable without Meteor.

// Return the _ids of lists that are swimlane-BOUND (carry a non-empty string
// swimlaneId) and so should be cleared to null to become board-wide again.
// Lists already board-wide (null / '' / missing swimlaneId) and invalid entries
// are ignored, so calling the repair twice is a no-op (idempotent).
function listsToUnbind(lists) {
  if (!Array.isArray(lists)) return [];
  const ids = [];
  for (const list of lists) {
    if (!list || typeof list.swimlaneId !== 'string' || list.swimlaneId.length === 0) {
      continue;
    }
    if (typeof list._id === 'string' && list._id.length > 0) {
      ids.push(list._id);
    }
  }
  return ids;
}

module.exports = { listsToUnbind };
