'use strict';

// Plain-Node unit test (no Meteor) for the linked-card cover resolver.
// Run: node tests/linkedCardCover.test.cjs
//
// Regression guard for #5666 ("Minicard connection without images"): a linked
// card's cover image lives on the real card it points at, but the cover helpers
// read `this.coverId` directly — and a linked card has no coverId of its own, so
// the cover never showed on the linking board. resolveCoverId() must hop a linked
// card to its real card's coverId, while leaving normal cards unchanged.

const assert = require('assert');
const {
  coverSourceCard,
  resolveCoverId,
} = require('../models/lib/linkedCardCover');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Real card on board A with a cover; a linked card on board B points at it.
const realCard = { _id: 'realA', type: 'card', coverId: 'att-A' };
const linkedCard = { _id: 'linkB', type: 'cardType-linkedCard', linkedId: 'realA' };
const getCard = id => (id === 'realA' ? realCard : undefined);

// --- POSITIVE ---------------------------------------------------------------
test('#5666: a linked card resolves to the REAL card\'s cover id', () => {
  assert.strictEqual(resolveCoverId(linkedCard, getCard), 'att-A');
  assert.strictEqual(coverSourceCard(linkedCard, getCard), realCard);
});

test('a plain card resolves to its own cover id', () => {
  assert.strictEqual(resolveCoverId(realCard, getCard), 'att-A');
});

test('a linked card ignores any stray coverId on the placeholder, using the real card', () => {
  // Even if the linked-card placeholder somehow carried a coverId, the real
  // card's cover is authoritative (guards the #5666 root cause directly).
  const stray = { _id: 'linkB', type: 'cardType-linkedCard', linkedId: 'realA', coverId: 'stray' };
  assert.strictEqual(resolveCoverId(stray, getCard), 'att-A');
});

// --- NEGATIVE ---------------------------------------------------------------
test('a plain card with no cover returns null', () => {
  assert.strictEqual(resolveCoverId({ _id: 'x', type: 'card' }, getCard), null);
});

test('a linked card whose real card has no cover returns null', () => {
  const realNoCover = { _id: 'realA', type: 'card' };
  const linked = { _id: 'l', type: 'cardType-linkedCard', linkedId: 'realA' };
  assert.strictEqual(resolveCoverId(linked, () => realNoCover), null);
});

test('a linked card whose real card is not loaded yet returns null (no throw)', () => {
  const orphan = { _id: 'l', type: 'cardType-linkedCard', linkedId: 'missing' };
  assert.strictEqual(resolveCoverId(orphan, getCard), null);
});

test('a linked card with no resolver returns null (no throw)', () => {
  assert.strictEqual(resolveCoverId(linkedCard, undefined), null);
  assert.strictEqual(coverSourceCard(linkedCard, undefined), null);
});

test('null / typeless cards are handled without throwing', () => {
  assert.strictEqual(resolveCoverId(null, getCard), null);
  assert.strictEqual(resolveCoverId(undefined, getCard), null);
  assert.strictEqual(coverSourceCard(null, getCard), null);
});

console.log(`\n${passed} tests passed`);
