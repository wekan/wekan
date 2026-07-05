'use strict';

// Pure helper that computes the $set modifier for Card.move(): only the fields
// that ACTUALLY change relative to the card's current position. Extracted from
// models/cards.js so it is unit-testable without Meteor.
//
// #6430 (card flicker ~1s on drag on large boards): Card.move() used to write
// boardId/swimlaneId/listId unconditionally, even when the card stayed on the
// same board/swimlane (the common "drag to another list" case). That meant every
// drag:
//   - re-ran the Cards.after.update hook that boardId-re-syncs the card's
//     checklists and checklistItems via multi updates (server load + reactive
//     re-publish of those collections),
//   - ran the cross-board consistency before-hook and the denyCrossBoardMove
//     deny-rule DB lookup, and
//   - invalidated more reactive dependents than necessary.
// Writing only the changed fields skips all of that for same-board moves, and an
// empty result means a true no-op (card dropped back in place) that the caller
// can skip entirely.

function computeCardMoveModifier(card, target = {}) {
  const { boardId, swimlaneId, listId, sort } = target;
  const fields = {};
  if (boardId !== undefined && boardId !== card.boardId) fields.boardId = boardId;
  if (swimlaneId !== undefined && swimlaneId !== card.swimlaneId) {
    fields.swimlaneId = swimlaneId;
  }
  if (listId !== undefined && listId !== card.listId) fields.listId = listId;
  // sort === null means "keep current" (Card.move's default), so it is never a change.
  if (sort !== undefined && sort !== null && sort !== card.sort) fields.sort = sort;
  return fields;
}

module.exports = { computeCardMoveModifier };
