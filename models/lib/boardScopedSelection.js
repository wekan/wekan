'use strict';

// Pure, Meteor-free helpers that scope the Filter / MultiSelection card
// selectors to a single board. Extracted so they are unit-testable in plain
// Node (mirrors models/lib/calendarFilter.js and models/lib/swimlaneFilter.js).
//
// #2306 ("filter to selection"): the filter sidebar's "To selection" button
// queried the client card cache with ONLY the Filter's selector — no boardId —
// so it swept up matching cards from every board present in Minimongo (cards
// from a board being navigated away from, linked-board subscriptions, the
// notifications drawer, popup card data, ...). A later bulk action (archive,
// move, label, ...) on the selection then silently mutated cards on other
// boards. These helpers AND a `boardId` clause into the relevant selectors so
// both the selection query and every bulk action stay contained to the board
// the user is looking at.

// Scope a Filter selector (the object produced by Filter._getMongoSelector())
// to one board. Without a boardId (e.g. on a non-board page) the selector is
// returned unchanged. The board clause is combined via `$and` so it can never
// collide with the Filter's own top-level `$or`.
function boardScopedFilterSelector(filterSelector, boardId) {
  const base =
    filterSelector && typeof filterSelector === 'object' ? filterSelector : {};
  if (!boardId) return base;
  return { $and: [base, { boardId }] };
}

// Selector for the cards of a multi-selection, scoped to one board. Bulk
// actions iterate the cards this selector matches, so even if a stale
// selection still holds ids from a previously visited board (the selection is
// not always reset on every navigation path), those foreign cards are never
// touched.
function boardScopedSelectionSelector(selectedCardIds, boardId) {
  const selector = {
    _id: { $in: Array.isArray(selectedCardIds) ? selectedCardIds : [] },
  };
  if (boardId) selector.boardId = boardId;
  return selector;
}

// Keep only the card ids that belong to `boardId`. `getCard` is a lookup
// (id -> card doc or undefined/null). Ids whose card cannot be found or has no
// boardId are kept (they cannot be positively identified as foreign, and a
// card missing from the cache cannot be acted on anyway); ids whose card
// verifiably lives on ANOTHER board are dropped. Without a boardId or lookup
// function the input is returned unchanged.
function cardIdsOnBoard(cardIds, boardId, getCard) {
  if (!Array.isArray(cardIds)) return cardIds;
  if (!boardId || typeof getCard !== 'function') return cardIds;
  return cardIds.filter(cardId => {
    const card = getCard(cardId);
    return !card || !card.boardId || card.boardId === boardId;
  });
}

module.exports = {
  boardScopedFilterSelector,
  boardScopedSelectionSelector,
  cardIdsOnBoard,
};
