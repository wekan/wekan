'use strict';

// Plain-Node unit test (no Meteor) for models/lib/boardScopedSelection.js.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/boardScopedSelection.test.cjs
//
// Regression guard for #2306 ("filter to selection"): the filter sidebar's
// "To selection" button queried the client card cache with only the Filter's
// selector — no boardId — so it selected matching cards from EVERY board
// present in Minimongo (e.g. a previously visited board), and a later bulk
// action (archive, move, ...) then mutated cards on other boards. The helpers
// under test scope the filter query, the multi-selection selector, and the
// ids entering the selection to the board currently being viewed.

const assert = require('assert');
const {
  boardScopedFilterSelector,
  boardScopedSelectionSelector,
  cardIdsOnBoard,
} = require('../models/lib/boardScopedSelection');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Minimal Mongo/Minimongo-like matcher for the operators these selectors emit
// ($and, $or, $in, scalar equality, array containment) so we can assert the
// built selector actually selects/rejects representative card documents.
function fieldMatches(cond, value) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    if ('$in' in cond) {
      const list = cond.$in;
      if (Array.isArray(value)) return value.some(v => list.includes(v));
      return list.includes(value);
    }
  }
  if (Array.isArray(value) && !Array.isArray(cond)) return value.includes(cond);
  return value === cond;
}

function docMatches(selector, doc) {
  return Object.entries(selector).every(([key, cond]) => {
    if (key === '$and') return cond.every(sub => docMatches(sub, doc));
    if (key === '$or') return cond.some(sub => docMatches(sub, doc));
    return fieldMatches(cond, doc[key]);
  });
}

// The shape Filter._getMongoSelector() produces for an active members filter:
// an (empty) exceptions clause OR the members criterion — exactly the filter
// used in the #2306 reproduction ("Filter cards by user").
function membersFilterSelector(userId) {
  return {
    $or: [{ _id: { $in: [] } }, { members: { $in: [userId] } }],
  };
}

// The #2306 reproduction data set: the same user is on one card of board1 and
// one card of board2, and both cards sit in the client cache.
const cardBoard1 = { _id: 'card1', boardId: 'board1', members: ['userA'] };
const cardBoard2 = { _id: 'card2', boardId: 'board2', members: ['userA'] };
const cardBoard1NoMatch = { _id: 'card3', boardId: 'board1', members: [] };

console.log('boardScopedFilterSelector');

test('positive: keeps matching cards of the current board', () => {
  const selector = boardScopedFilterSelector(
    membersFilterSelector('userA'),
    'board1',
  );
  assert.strictEqual(docMatches(selector, cardBoard1), true);
});

test('negative: rejects matching cards of OTHER boards (#2306 repro)', () => {
  const selector = boardScopedFilterSelector(
    membersFilterSelector('userA'),
    'board1',
  );
  assert.strictEqual(docMatches(selector, cardBoard2), false);
});

test('negative: still rejects same-board cards not matching the filter', () => {
  const selector = boardScopedFilterSelector(
    membersFilterSelector('userA'),
    'board1',
  );
  assert.strictEqual(docMatches(selector, cardBoard1NoMatch), false);
});

test('without a boardId the filter selector is returned unchanged', () => {
  const filter = membersFilterSelector('userA');
  assert.strictEqual(boardScopedFilterSelector(filter, null), filter);
  assert.strictEqual(boardScopedFilterSelector(filter, undefined), filter);
});

test('board clause is ANDed, never merged into the filter $or', () => {
  const selector = boardScopedFilterSelector(
    membersFilterSelector('userA'),
    'board1',
  );
  assert.ok(Array.isArray(selector.$and));
  assert.deepStrictEqual(selector.$and[1], { boardId: 'board1' });
  // The original $or must survive intact inside the $and.
  assert.ok(Array.isArray(selector.$and[0].$or));
});

test('falsy/non-object filter selector falls back to {} plus board scope', () => {
  const selector = boardScopedFilterSelector(null, 'board1');
  assert.deepStrictEqual(selector, { $and: [{}, { boardId: 'board1' }] });
  assert.strictEqual(docMatches(selector, cardBoard1), true);
  assert.strictEqual(docMatches(selector, cardBoard2), false);
});

console.log('boardScopedSelectionSelector');

test('positive: matches a selected card on the current board', () => {
  const selector = boardScopedSelectionSelector(['card1', 'card2'], 'board1');
  assert.strictEqual(docMatches(selector, cardBoard1), true);
});

test('negative: rejects a selected card living on another board', () => {
  // Stale selection scenario: card2 (board2) is still in the selected ids
  // after navigating to board1 — bulk actions must not touch it.
  const selector = boardScopedSelectionSelector(['card1', 'card2'], 'board1');
  assert.strictEqual(docMatches(selector, cardBoard2), false);
});

test('negative: rejects an unselected card even on the current board', () => {
  const selector = boardScopedSelectionSelector(['card1'], 'board1');
  assert.strictEqual(docMatches(selector, cardBoard1NoMatch), false);
});

test('without a boardId only the id list constrains the match', () => {
  const selector = boardScopedSelectionSelector(['card2'], null);
  assert.strictEqual(docMatches(selector, cardBoard2), true);
  assert.strictEqual('boardId' in selector, false);
});

test('non-array ids produce an empty (match-nothing) $in', () => {
  const selector = boardScopedSelectionSelector(undefined, 'board1');
  assert.deepStrictEqual(selector._id, { $in: [] });
  assert.strictEqual(docMatches(selector, cardBoard1), false);
});

console.log('cardIdsOnBoard');

const cache = {
  card1: cardBoard1,
  card2: cardBoard2,
  card3: cardBoard1NoMatch,
  card4: { _id: 'card4' }, // no boardId on the doc
};
const getCard = id => cache[id];

test('positive: keeps ids of cards on the current board', () => {
  assert.deepStrictEqual(
    cardIdsOnBoard(['card1', 'card3'], 'board1', getCard),
    ['card1', 'card3'],
  );
});

test('negative: drops ids of cards verifiably on another board', () => {
  assert.deepStrictEqual(
    cardIdsOnBoard(['card1', 'card2'], 'board1', getCard),
    ['card1'],
  );
});

test('keeps ids whose card is unknown or has no boardId', () => {
  assert.deepStrictEqual(
    cardIdsOnBoard(['missing', 'card4'], 'board1', getCard),
    ['missing', 'card4'],
  );
});

test('without a boardId or lookup the ids pass through unchanged', () => {
  const ids = ['card1', 'card2'];
  assert.strictEqual(cardIdsOnBoard(ids, null, getCard), ids);
  assert.strictEqual(cardIdsOnBoard(ids, 'board1', undefined), ids);
});

test('non-array input passes through unchanged', () => {
  assert.strictEqual(cardIdsOnBoard(undefined, 'board1', getCard), undefined);
});

console.log('end-to-end: filter-to-selection then bulk action stays on board');

test('#2306: selection built from the scoped filter query holds only current-board cards', () => {
  const allCachedCards = [cardBoard1, cardBoard2, cardBoard1NoMatch];
  // Step 1: the "To selection" query (Filter.mongoSelector() with no
  // additional selector) — now board-scoped.
  const query = boardScopedFilterSelector(
    membersFilterSelector('userA'),
    'board1',
  );
  const selectedIds = allCachedCards
    .filter(c => docMatches(query, c))
    .map(c => c._id);
  assert.deepStrictEqual(selectedIds, ['card1']);
  // Step 2: the bulk-action selector (MultiSelection.getMongoSelector()) —
  // even if a foreign id had crept in, it would not match.
  const actionSelector = boardScopedSelectionSelector(
    selectedIds.concat('card2'),
    'board1',
  );
  const mutated = allCachedCards.filter(c => docMatches(actionSelector, c));
  assert.deepStrictEqual(mutated.map(c => c._id), ['card1']);
});

console.log(`\n${passed} tests passed`);
