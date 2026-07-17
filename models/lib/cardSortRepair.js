'use strict';

// Pure helpers for repairing duplicate/inverted card `sort` values when a card
// is drag-dropped between two neighbours. Extracted so the decision logic is
// unit-testable in plain Node without Meteor (mirrors models/lib/boardSortReorder.js).
//
// #3826 (cannot reorder cards in a list full of subtask cards): every card
// created through the "add subtask" flow used to be inserted with a constant
// `sort: -1`, so a list populated by subtasks contains ONLY ties. Dropping a
// card between two cards whose sorts are equal is unsolvable for the
// drag-index math (client/lib/utils.js calculateIndexData): no number lies
// strictly between -1 and -1, so it returned base === -1 with increment 0.
// The dropped card's sort was already -1, Card.move()'s no-op guard
// (models/lib/cardMoveModifier.js) discarded the write, and the card snapped
// back to its old place. Worse, a multi-selection drop wrote the SAME sort to
// every selected card (increment 0), permanently destroying their relative
// order — the data-loss noted in triage.
//
// The wiring lives in client/components/lists/list.js (sortable `stop`
// handler); the pieces below are the decisions worth testing in isolation:
//   1. whether the drop landed in a "degenerate" gap that needs repair,
//   2. the minimal set of sort rewrites that makes the visible order strictly
//      increasing, and
//   3. the drop index (base + increment) computed from the repaired
//      neighbours, guaranteed to fall strictly between them and to give every
//      card of a multi-selection a distinct sort.

// A drop between two neighbours is degenerate when both neighbours exist and
// their sorts do not strictly increase (ties from constant-sort inserts,
// legacy inverted data, or non-numeric garbage). Drops at the very top or
// bottom of a list (a single neighbour) always have room and never need
// repair.
function isDegenerateSortGap(prevSort, nextSort) {
  if (prevSort === undefined || prevSort === null) return false;
  if (nextSort === undefined || nextSort === null) return false;
  // Also catches NaN / non-numeric sorts: NaN comparisons are false.
  return !(Number(nextSort) - Number(prevSort) > 0);
}

// Given the sibling cards of the drop target in their current VISUAL order
// (excluding the dragged card), return the minimal `{ _id, sort }` rewrites
// that make the sequence strictly increasing. Cards already in strictly
// increasing positions are left untouched (no needless writes / reactive
// churn); each offender is bumped to `previous + 1`.
function computeMonotonicSortRepair(orderedCards) {
  const updates = [];
  let last = null;
  (orderedCards || []).forEach(card => {
    if (!card || !card._id) return;
    let sort = Number(card.sort);
    if (!Number.isFinite(sort) || (last !== null && sort <= last)) {
      sort = last === null ? 0 : last + 1;
      updates.push({ _id: card._id, sort });
    }
    last = sort;
  });
  return updates;
}

// Repair the sibling sorts and compute the drop index between `prevCard` and
// `nextCard` (both `{ _id, sort }`, both members of `orderedCards`). Returns
//   {
//     updates,   // sort rewrites to persist for the sibling cards
//     base,      // sort for the (first) dropped card
//     increment, // spacing for the 2nd..nth card of a multi-selection drop
//   }
// After the repair the neighbours strictly increase, so `base` lies strictly
// between them and `increment` is strictly positive: every card of a
// multi-selection keeps a distinct sort (no order data-loss), and the write is
// never equal to a neighbour's sort (so it can not be dropped as a no-op).
function computeRepairedDropIndex(orderedCards, prevCard, nextCard, nCards = 1) {
  const updates = computeMonotonicSortRepair(orderedCards);
  const repaired = {};
  updates.forEach(u => {
    repaired[u._id] = u.sort;
  });
  const sortOf = card =>
    card && card._id && Object.prototype.hasOwnProperty.call(repaired, card._id)
      ? repaired[card._id]
      : Number(card && card.sort);
  const prevSort = sortOf(prevCard);
  const nextSort = sortOf(nextCard);
  const n = Number(nCards) >= 1 ? Number(nCards) : 1;
  const increment = (nextSort - prevSort) / (n + 1);
  const base = prevSort + increment;
  return { updates, base, increment };
}

module.exports = {
  isDegenerateSortGap,
  computeMonotonicSortRepair,
  computeRepairedDropIndex,
};
