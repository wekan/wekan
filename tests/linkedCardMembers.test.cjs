'use strict';

// Plain-Node unit test (no Meteor) for the linked-card member target helpers.
// Run: node tests/linkedCardMembers.test.cjs
//
// Regression guard for #5676 ("Bug: Can not add members to Linked Card"): a
// linked card's members are stored on the REAL card it points at (on another
// board), which is what getMembers()/assignMember() act on — but the member
// picker used to list the *viewing* board's members. memberTargetBoardId() must
// resolve a linked card to its real card's board (so the picker matches where
// membership is stored), and memberTargetCardId() must resolve to the real card
// id that member changes are written to. Normal cards and linked-board cards must
// keep their own board.

const assert = require('assert');
const {
  memberTargetCardId,
  memberTargetBoardId,
} = require('../models/lib/linkedCardMembers');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Real card on board A; a linked card on board B points at it.
const realCard = { _id: 'realA', boardId: 'boardA', type: 'card' };
const linkedCard = {
  _id: 'linkB',
  boardId: 'boardB',
  type: 'cardType-linkedCard',
  linkedId: 'realA',
};
const resolve = id => (id === 'realA' ? realCard : undefined);

// --- memberTargetCardId ------------------------------------------------------
test('linked card resolves to the real card id for member writes', () => {
  assert.strictEqual(memberTargetCardId(linkedCard), 'realA');
});

test('normal card targets its own id', () => {
  assert.strictEqual(memberTargetCardId(realCard), 'realA');
});

test('memberTargetCardId is null-safe', () => {
  assert.strictEqual(memberTargetCardId(null), null);
  assert.strictEqual(memberTargetCardId({ type: 'card' }), null);
});

// --- memberTargetBoardId: POSITIVE ------------------------------------------
test('#5676: linked card resolves to the REAL card\'s board (not the viewing board)', () => {
  const boardId = memberTargetBoardId(linkedCard, resolve);
  assert.strictEqual(boardId, 'boardA');
  // and crucially NOT the board the linked card is viewed on
  assert.notStrictEqual(boardId, 'boardB');
});

test('normal card uses its own board', () => {
  assert.strictEqual(memberTargetBoardId(realCard, resolve), 'boardA');
});

test('linked-board card uses the linked board id itself', () => {
  const linkedBoardCard = {
    _id: 'lbc',
    boardId: 'boardB',
    type: 'cardType-linkedBoard',
    linkedId: 'boardX',
  };
  assert.strictEqual(memberTargetBoardId(linkedBoardCard, resolve), 'boardX');
});

// --- memberTargetBoardId: NEGATIVE ------------------------------------------
test('linked card whose real card is not loaded yet resolves to null (caller falls back)', () => {
  const orphan = { type: 'cardType-linkedCard', linkedId: 'missing' };
  assert.strictEqual(memberTargetBoardId(orphan, resolve), null);
});

test('linked card with no resolver does not throw and returns null', () => {
  assert.strictEqual(memberTargetBoardId(linkedCard, undefined), null);
});

test('a linked card must NOT fall back to the viewing board when unresolved', () => {
  // Guards the bug: returning boardB here would re-introduce the wrong-board
  // picker. Unresolved must be null so the caller decides the fallback.
  const orphan = { boardId: 'boardB', type: 'cardType-linkedCard', linkedId: 'missing' };
  assert.strictEqual(memberTargetBoardId(orphan, resolve), null);
});

test('memberTargetBoardId is null-safe', () => {
  assert.strictEqual(memberTargetBoardId(null, resolve), null);
  assert.strictEqual(memberTargetBoardId({ type: 'card' }, resolve), null);
});

console.log(`\n${passed} tests passed`);
