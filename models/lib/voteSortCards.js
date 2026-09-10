'use strict';

// Pure helpers for the optional "sort by votes" display mode (#3050): when
// enabled for a list, cards are DISPLAYED ordered by vote score (positive
// votes minus negative votes) descending, highest-voted first, instead of the
// manual `sort` field. This is display order only - it never touches the
// underlying `sort` field, so turning the mode back off restores the exact
// manual drag order.
//
// Extracted so the comparator is unit-testable in plain Node without Meteor
// (mirrors models/lib/boardSortReorder.js and models/lib/cardSearch.js).

// A card's net vote score: positive votes minus negative votes. Mirrors
// Cards#voteCountPositive / Cards#voteCountNegative in models/cards.js, but
// works on a plain object (no Mongo/Meteor document required) so it can be
// unit-tested and reused on the client with whatever shape a minimongo card
// document has. A card with no `vote` field (never voted on) scores 0.
function voteScore(card) {
  const vote = card && card.vote;
  const positive =
    vote && Array.isArray(vote.positive) ? vote.positive.length : 0;
  const negative =
    vote && Array.isArray(vote.negative) ? vote.negative.length : 0;
  return positive - negative;
}

// Comparator for Array#sort: highest vote score first. Cards with an equal
// score (including two cards with no votes at all, which both score 0) keep
// their RELATIVE order from the input array - Array#sort is a stable sort, so
// as long as `cards` is already in manual `sort`-field order when this is
// applied, ties fall back to that manual order. A zero/no-vote card is never
// treated as "greater" than a positively-voted one, so it always sorts after
// every card that has net positive votes.
function compareCardsByVoteScoreDesc(cardA, cardB) {
  return voteScore(cardB) - voteScore(cardA);
}

// Returns a NEW array with `cards` ordered by vote score descending, ties
// broken by the original array order. Never mutates the input, and never
// touches each card's `sort` field - purely a display-order transform.
function sortCardsByVotes(cards) {
  if (!Array.isArray(cards)) return cards;
  return cards.slice().sort(compareCardsByVoteScoreDesc);
}

export { voteScore, compareCardsByVoteScoreDesc, sortCardsByVotes };
