'use strict';

// Plain-Node unit test (no Meteor) for the "Link to this card" target guard.
// Run: node tests/linkedCardTarget.test.cjs
//
// Regression guard for #5808 ("Linking two cards to each other across boards
// renders both cards inaccessible"): the link-target picker only excluded
// template cards, so an existing LINKED card could be chosen as a target,
// building a chain of linkedId pointers. Card helpers resolve linkedId only one
// hop, so such a card renders as an empty/broken pointer — inaccessible. Only a
// real card, not already linking back to this board, may be a link target.

const assert = require('assert');
const {
  isLinkPointerCard,
  isLinkableCardTarget,
} = require('../models/lib/linkedCardTarget');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const OWN = ['A1', 'A2']; // real ids of the linking board's own cards

// --- isLinkPointerCard ------------------------------------------------------
test('isLinkPointerCard: linked card and linked board are pointers', () => {
  assert.strictEqual(isLinkPointerCard({ type: 'cardType-linkedCard' }), true);
  assert.strictEqual(isLinkPointerCard({ type: 'cardType-linkedBoard' }), true);
});

test('isLinkPointerCard: a normal card is not a pointer', () => {
  assert.strictEqual(isLinkPointerCard({ type: 'cardType-card' }), false);
  assert.strictEqual(isLinkPointerCard(undefined), false);
});

// --- POSITIVE: a real, unrelated card on another board is linkable ----------
test('POSITIVE: a normal card on another board is a valid link target', () => {
  const target = { _id: 'B1', type: 'cardType-card', boardId: 'boardB' };
  assert.strictEqual(isLinkableCardTarget(target, OWN), true);
});

test('POSITIVE: accepts a Set of own ids too', () => {
  const target = { _id: 'B1', type: 'cardType-card' };
  assert.strictEqual(isLinkableCardTarget(target, new Set(OWN)), true);
});

// --- NEGATIVE: the #5808 configurations must be refused ---------------------
test('NEGATIVE: cannot link to an existing linked card (no chains of links)', () => {
  const linkedCard = { _id: 'L1', type: 'cardType-linkedCard', linkedId: 'X9' };
  assert.strictEqual(isLinkableCardTarget(linkedCard, OWN), false);
});

test('NEGATIVE: cannot link to a linked board', () => {
  const linkedBoard = { _id: 'LB1', type: 'cardType-linkedBoard', linkedId: 'brd' };
  assert.strictEqual(isLinkableCardTarget(linkedBoard, OWN), false);
});

test('NEGATIVE: cannot link to one of our own cards (self / same board)', () => {
  const own = { _id: 'A1', type: 'cardType-card' };
  assert.strictEqual(isLinkableCardTarget(own, OWN), false);
});

test('NEGATIVE: cannot link to a card that links back to one of our cards (mutual)', () => {
  // Target is a real-ish card whose linkedId points at our card A2 → mutual loop.
  const backLink = { _id: 'B7', type: 'cardType-card', linkedId: 'A2' };
  assert.strictEqual(isLinkableCardTarget(backLink, OWN), false);
});

test('NEGATIVE: cannot link to a template card, or to nothing', () => {
  assert.strictEqual(isLinkableCardTarget({ _id: 'T1', type: 'template-card' }, OWN), false);
  assert.strictEqual(isLinkableCardTarget(undefined, OWN), false);
  assert.strictEqual(isLinkableCardTarget({ type: 'cardType-card' }, OWN), false); // no _id
});

console.log(`\n${passed} passing`);
