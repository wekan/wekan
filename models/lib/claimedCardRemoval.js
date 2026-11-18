'use strict';

// RaceBleed (GHSA-3vjg-3p4q-8fwh): a card's children are destroyed only for a
// card whose own removal really happened.
//
// Deleting a card used to destroy its checklists, checklist items, comments,
// attachments and subcards FIRST and remove the card itself LAST, keyed on the
// board (and list) the caller was authorised for. Nothing held the card still
// in between, so a move to another board that landed in that window left the
// card alive on a board the deleter could not even read, stripped of all its
// children - irreversibly, with both requests answering 200. Every hooked
// removal had the same shape: matb33:collection-hooks fetches the documents,
// runs Cards.before.remove (where the cascade was) and only then removes by the
// ORIGINAL selector, which a moved card no longer matches.
//
// The card document is the claim. Removing it is atomic and keyed on where the
// caller was authorised, so exactly one of "the move" and "the delete" wins:
// once it is gone a concurrent move matches nothing, and when the move won the
// removal matches nothing and nothing else is touched.
//
// Pure: callers pass the collection operations in, so the race is testable as
// arithmetic (tests/claimedCardRemoval.test.cjs).

// Remove `card` where `selector` still says it is, and only then its children.
// `removeCard(selector)` returns how many documents it removed; `cascade(card)`
// destroys the children. Returns whether the card was removed.
async function removeClaimedCard({ card, selector, removeCard, cascade }) {
  if (!card || typeof card._id !== 'string' || !card._id) return false;
  const removed = await removeCard({ ...(selector || {}), _id: card._id });
  if (!removed) return false;
  await cascade(card);
  return true;
}

// For Cards.after.remove: collection-hooks calls it for every document it
// fetched before the removal, matched or not, so the cascade runs only when the
// card is really gone. `exists(id)` reports whether a card with that id is still
// stored. Returns whether the cascade ran.
async function cascadeIfRemoved({ doc, exists, cascade }) {
  if (!doc || typeof doc._id !== 'string' || !doc._id) return false;
  if (await exists(doc._id)) return false;
  await cascade(doc);
  return true;
}

module.exports = { removeClaimedCard, cascadeIfRemoved };
