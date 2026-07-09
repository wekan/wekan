'use strict';

// #4494 "Creating a board from a template breaks subtasks". Boards are created
// from a template by copying the template board. The copy inherited the
// template's subtasksDefaultBoardId / dateSettingsDefaultBoardId verbatim. When
// those pointed at the template board ITSELF (the common case — "subtasks live
// on this board"), subtasks created on the NEW board were dropped onto the
// TEMPLATE board, and the subtask card linked back across boards to the parent.
//
// remapCopiedBoardDefaults returns the $set patch that repoints any default
// board pointer referencing the source board to the copy instead. When a board
// pointer moves, its paired list pointer is cleared (null) because that list id
// belongs to the source board's lists; it self-heals to a list on the new
// board via Board.getDefaultSubtasksListId()/getDefaultDateSettingsListId().
// Meteor-free so it can be unit tested.
function remapCopiedBoardDefaults(board, oldId, newId) {
  const patch = {};
  if (board && board.subtasksDefaultBoardId === oldId) {
    patch.subtasksDefaultBoardId = newId;
    patch.subtasksDefaultListId = null;
  }
  if (board && board.dateSettingsDefaultBoardId === oldId) {
    patch.dateSettingsDefaultBoardId = newId;
    patch.dateSettingsDefaultListId = null;
  }
  return patch;
}

module.exports = { remapCopiedBoardDefaults };
