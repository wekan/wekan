'use strict';

// Pure helper for resolving a (possibly linked) card's cover attachment id.
// Extracted so the resolution is unit-testable without Meteor.
//
// #5666 ("Minicard connection without images"): a linked card
// (type 'cardType-linkedCard') is a placeholder on the linking board — its real
// content, including the cover image, lives on the card it points at (`linkedId`)
// on the other board. Every other minicard field resolves through the real card
// (getTitle/getReceived/getDue/... all do `getCard(this.linkedId)`), but the
// cover helpers read `this.coverId` directly. A linked card has no coverId of its
// own, so the cover never showed on the linking board's minicard even though the
// real card's attachment is published there. Resolve the cover id through the
// real card, mirroring the other linked-card getters.

const TYPE_LINKED_CARD = 'cardType-linkedCard';

// The card whose cover applies to `card`: the real card behind a link, otherwise
// the card itself. `getCard(id)` returns the card doc for an id (used to hop a
// linked card to its real card). Returns null when it can't be resolved.
function coverSourceCard(card, getCard) {
  if (!card) return null;
  if (card.type === TYPE_LINKED_CARD && card.linkedId) {
    return typeof getCard === 'function' ? getCard(card.linkedId) || null : null;
  }
  return card;
}

// The cover attachment id to display for `card`, resolved through the real card
// for linked cards. Returns null when there is none (or the real card isn't
// loaded yet), so the caller renders no cover instead of throwing.
function resolveCoverId(card, getCard) {
  const source = coverSourceCard(card, getCard);
  return source && source.coverId ? source.coverId : null;
}

module.exports = { coverSourceCard, resolveCoverId };
