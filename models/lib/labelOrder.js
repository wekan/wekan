'use strict';

// #2040: the board's labels have an order - the order a board admin arranges
// them in (Move up / Move down when editing a label) - and a list can be
// sorted by it: a card comes where its first label in that order comes, cards
// without a label last, and cards with the same rank keep their manual order.
// A display order only, like "Sort by votes": no card's `sort` changes, so
// turning it off gives back the order the cards were dragged into.
// Pure: tests/labelOrder.test.cjs.

/** The labels with one moved a step 'up' or 'down'; unchanged when it can not move. */
function moveLabel(labels, labelId, direction) {
  const list = Array.isArray(labels) ? labels.slice() : [];
  const from = list.findIndex(l => l && l._id === labelId);
  const to = from + (direction === 'up' ? -1 : 1);
  if (from < 0 || to < 0 || to >= list.length || !['up', 'down'].includes(direction)) return list;
  const [label] = list.splice(from, 1);
  list.splice(to, 0, label);
  return list;
}

/** Where a card goes: the smallest position of its labels, or after them all. */
function labelRank(card, labels) {
  const order = new Map((labels || []).map((l, i) => [l._id, i]));
  let rank = Infinity;
  for (const id of (card && card.labelIds) || []) if (order.has(id)) rank = Math.min(rank, order.get(id));
  return rank;
}

/** The cards in label order, stable: equal ranks keep the order they came in. */
function sortCardsByLabelOrder(cards, labels) {
  return (Array.isArray(cards) ? cards : [])
    .map((card, index) => ({ card, index, rank: labelRank(card, labels) }))
    .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
    .map(x => x.card);
}

module.exports = { moveLabel, labelRank, sortCardsByLabelOrder };
