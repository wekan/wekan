'use strict';

// #4249 "sometimes filter by card title doesn't work". Renaming a linked card
// (or linked board) card updated only the LINKED target's title via
// getRealId()/linkedId, leaving the linking card's OWN `title` field stale.
// Filter-by-title queries each card document's own `title` field, so a linked
// card silently dropped out of title filters after its title was changed.
//
// computeTitleUpdateTargets() lists every document whose title must be written
// on a rename: always the linking card's own document (so it stays filterable
// and has a correct fallback title), plus the linked target (the original card
// or the linked board) so the existing mirror behavior is preserved.
// Meteor-free so it can be unit tested.
//
// card: { _id, linkedId, type } with type:
//   'cardType-linkedCard'  -> linked card
//   'cardType-linkedBoard' -> linked board
//   anything else          -> a normal card
function computeTitleUpdateTargets(card) {
  const targets = [];
  if (!card || !card._id) return targets;

  if (card.type === 'cardType-linkedCard') {
    // The linking card's own document — this is what filter-by-title reads.
    targets.push({ collection: 'cards', id: card._id });
    // The original card it mirrors (previous behavior).
    if (card.linkedId) targets.push({ collection: 'cards', id: card.linkedId });
  } else if (card.type === 'cardType-linkedBoard') {
    targets.push({ collection: 'cards', id: card._id });
    if (card.linkedId) targets.push({ collection: 'boards', id: card.linkedId });
  } else {
    targets.push({ collection: 'cards', id: card._id });
  }
  return targets;
}

module.exports = { computeTitleUpdateTargets };
