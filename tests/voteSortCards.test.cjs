'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for the "sort by votes" display mode
// (#3050): an optional per-list toggle that floats highest-voted cards to the
// top of a list WITHOUT touching the underlying manual `sort` field, so
// turning it off restores the exact manual drag order. Mirrors
// tests/boardSortReorder.test.cjs / tests/sortCardsByTitle.test.cjs in style.
//
// Run: node tests/voteSortCards.test.cjs

const assert = require('assert');
const {
  voteScore,
  compareCardsByVoteScoreDesc,
  sortCardsByVotes,
} = await import('../models/lib/voteSortCards.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- voteScore ---------------------------------------------------------
test('voteScore is positive votes minus negative votes', () => {
  const card = { vote: { positive: ['a', 'b', 'c'], negative: ['d'] } };
  assert.strictEqual(voteScore(card), 2);
});

test('voteScore is 0 for a card with no vote field at all', () => {
  assert.strictEqual(voteScore({}), 0);
  assert.strictEqual(voteScore({ title: 'x' }), 0);
});

test('voteScore is 0 for a card with an empty vote (no positive/negative arrays)', () => {
  assert.strictEqual(voteScore({ vote: {} }), 0);
});

test('voteScore can be negative when negative votes outnumber positive', () => {
  const card = { vote: { positive: ['a'], negative: ['b', 'c', 'd'] } };
  assert.strictEqual(voteScore(card), -2);
});

// --- compareCardsByVoteScoreDesc ----------------------------------------
test('comparator orders the higher-scored card first', () => {
  const high = { vote: { positive: ['a', 'b'], negative: [] } };
  const low = { vote: { positive: ['a'], negative: [] } };
  assert.ok(compareCardsByVoteScoreDesc(high, low) < 0);
  assert.ok(compareCardsByVoteScoreDesc(low, high) > 0);
});

test('comparator treats equal scores as a tie (0)', () => {
  const a = { vote: { positive: ['x'], negative: [] } };
  const b = { vote: { positive: ['y'], negative: [] } };
  assert.strictEqual(compareCardsByVoteScoreDesc(a, b), 0);
});

// --- sortCardsByVotes ----------------------------------------------------
test('cards are ordered by vote score, highest first', () => {
  const cards = [
    { _id: 'c1', vote: { positive: ['a'], negative: [] } }, // score 1
    { _id: 'c2', vote: { positive: ['a', 'b', 'c'], negative: [] } }, // score 3
    { _id: 'c3', vote: { positive: [], negative: ['a'] } }, // score -1
  ];
  const sorted = sortCardsByVotes(cards).map(c => c._id);
  assert.deepStrictEqual(sorted, ['c2', 'c1', 'c3']);
});

test('a card with zero/no votes sorts LAST, after any positively-voted card', () => {
  const cards = [
    { _id: 'no-vote' }, // score 0, never voted on
    { _id: 'voted', vote: { positive: ['a'], negative: [] } }, // score 1
  ];
  const sorted = sortCardsByVotes(cards).map(c => c._id);
  assert.deepStrictEqual(sorted, ['voted', 'no-vote']);
});

test('ties (equal vote score, including all-zero) are broken by original manual sort order', () => {
  // Input is assumed pre-sorted by the manual `sort` field, as cardsWithLimit
  // passes it in (see client/components/lists/listBody.js). Two cards tied
  // at 0 votes, and two more tied at a positive score, must both keep their
  // relative input order - proving the underlying manual order is preserved
  // when vote-sort is turned back off.
  const cards = [
    { _id: 'manual-1' }, // 0
    { _id: 'manual-2', vote: { positive: ['a'], negative: [] } }, // 1
    { _id: 'manual-3' }, // 0
    { _id: 'manual-4', vote: { positive: ['a'], negative: [] } }, // 1
  ];
  const sorted = sortCardsByVotes(cards).map(c => c._id);
  assert.deepStrictEqual(sorted, ['manual-2', 'manual-4', 'manual-1', 'manual-3']);
});

test('sortCardsByVotes does not mutate the input array or its card documents', () => {
  const cards = [
    { _id: 'c1', vote: { positive: [], negative: [] } },
    { _id: 'c2', vote: { positive: ['a', 'b'], negative: [] } },
  ];
  const original = cards.slice();
  const originalVote0 = cards[0].vote;
  sortCardsByVotes(cards);
  assert.deepStrictEqual(cards, original); // input array order untouched
  assert.strictEqual(cards[0].vote, originalVote0); // card docs untouched
});

test('sortCardsByVotes returns non-array input unchanged (defensive)', () => {
  assert.strictEqual(sortCardsByVotes(null), null);
  assert.strictEqual(sortCardsByVotes(undefined), undefined);
});

console.log(`\n${passed} passed`);
})();
