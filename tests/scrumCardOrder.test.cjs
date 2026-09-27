'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compareScrumCards } = require('../models/lib/scrumCardOrder');

test('equal explicit and fallback ranks have the same order regardless of fetch order', () => {
  const cards = [
    { _id: 'z', sort: 0 },
    { _id: 'a', sort: 100, scrum: { backlogRank: 0 } },
    { _id: 'm', sort: 0, scrum: { backlogRank: null } },
  ];
  const before = JSON.stringify(cards);
  for (const input of [cards.slice(), cards.slice().reverse(), [cards[1], cards[0], cards[2]]]) {
    assert.deepEqual(input.sort(compareScrumCards).map(card => card._id), ['a', 'm', 'z']);
  }
  assert.equal(JSON.stringify(cards), before);
  assert.equal(compareScrumCards(cards[0], cards[0]), 0);
});

test('ID tie-breaker does not override ranks, zero or negative list positions', () => {
  const cards = [
    { _id: 'a', sort: -100, scrum: { backlogRank: 3 } },
    { _id: 'b', sort: 10, scrum: { backlogRank: 0 } },
    { _id: 'z', sort: -1 },
    { _id: 'c' },
  ];
  assert.deepEqual(cards.sort(compareScrumCards).map(card => card._id), ['z', 'b', 'c', 'a']);
});
