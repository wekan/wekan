'use strict';

// Pure helper for the "Link to this card" popup (#5394): the Cards pull-down
// list should be sorted alphabetically by card title (case-insensitive) so a
// card can be found on boards with many cards. Extracted so the comparison is
// unit-testable in plain Node without Meteor (mirrors models/lib/cardSearch.js
// and models/lib/boardSortReorder.js).
//
// Only the link-card popup's Cards dropdown uses this; ordering of cards in
// board views / exports is intentionally left untouched.

// Locale-aware, case-insensitive title comparison. Missing/empty titles are
// treated as an empty string so undefined titles never throw and sort first.
function compareCardTitle(a, b) {
  const at = String((a && a.title) || '');
  const bt = String((b && b.title) || '');
  return at.localeCompare(bt, undefined, { sensitivity: 'base', numeric: true });
}

// Return a new array of the given cards sorted alphabetically by title
// (case-insensitive). Does not mutate the input. Equal titles keep their input
// order (Array.prototype.sort is stable in modern V8/Node).
function sortCardsByTitle(cards) {
  if (!Array.isArray(cards)) return cards;
  return cards.slice().sort(compareCardTitle);
}

module.exports = {
  compareCardTitle,
  sortCardsByTitle,
};
