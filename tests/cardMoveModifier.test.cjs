'use strict';

// Plain-Node unit test (no Meteor) for the Card.move() modifier builder.
// Run: node tests/cardMoveModifier.test.cjs
//
// Regression guard for #6430 ("Card flicker ~1s on drag on large boards"):
// Card.move() used to write boardId/swimlaneId/listId unconditionally. On a
// same-board drag (the reported case: card dragged to another LIST) that still
// put boardId in the $set, so the Cards.after.update hook re-synced the card's
// checklists/checklistItems (multi updates), the cross-board consistency guard
// and denyCrossBoardMove DB lookup ran, and extra reactive dependents were
// invalidated — server work + churn that contributed to the flicker. The fix
// writes ONLY the fields that actually change; an empty result is a true no-op
// the caller skips entirely.

const assert = require('assert');
const { computeCardMoveModifier } = require('../models/lib/cardMoveModifier');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// A card currently on board B1, swimlane S1, list L1, sort 3.
const CARD = { boardId: 'B1', swimlaneId: 'S1', listId: 'L1', sort: 3 };

// --- POSITIVE: only changed fields are written ------------------------------
test('same-board drag to another list writes only listId (+ new sort)', () => {
  const mod = computeCardMoveModifier(CARD, {
    boardId: 'B1', // unchanged
    swimlaneId: 'S1', // unchanged
    listId: 'L2', // changed
    sort: 5, // changed
  });
  assert.deepStrictEqual(mod, { listId: 'L2', sort: 5 });
});

test('swimlane-only move writes only swimlaneId', () => {
  const mod = computeCardMoveModifier(CARD, {
    boardId: 'B1',
    swimlaneId: 'S2',
    listId: 'L1',
    sort: 3,
  });
  assert.deepStrictEqual(mod, { swimlaneId: 'S2' });
});

test('cross-board move writes boardId, swimlaneId and listId', () => {
  const mod = computeCardMoveModifier(CARD, {
    boardId: 'B2',
    swimlaneId: 'S9',
    listId: 'L9',
    sort: 0,
  });
  assert.deepStrictEqual(mod, {
    boardId: 'B2',
    swimlaneId: 'S9',
    listId: 'L9',
    sort: 0,
  });
});

test('sort === null means "keep current" and is never written', () => {
  const mod = computeCardMoveModifier(CARD, {
    boardId: 'B1',
    swimlaneId: 'S1',
    listId: 'L2',
    sort: null,
  });
  assert.deepStrictEqual(mod, { listId: 'L2' });
});

test('an unchanged sort is not written', () => {
  const mod = computeCardMoveModifier(CARD, { listId: 'L2', sort: 3 });
  assert.deepStrictEqual(mod, { listId: 'L2' });
});

test('sort 0 is a real value and IS written when it differs', () => {
  const mod = computeCardMoveModifier(CARD, { listId: 'L1', sort: 0 });
  assert.deepStrictEqual(mod, { sort: 0 });
});

// --- NEGATIVE: the #6430 needless-boardId-write must not come back ----------
test('NEGATIVE: a same-board move must NOT include boardId (triggered the checklist re-sync hook)', () => {
  const mod = computeCardMoveModifier(CARD, {
    boardId: 'B1',
    swimlaneId: 'S1',
    listId: 'L2',
    sort: 5,
  });
  // The old code wrote { boardId:'B1', swimlaneId:'S1', listId:'L2', sort:5 };
  // boardId in the $set is exactly what re-ran the boardId-gated after.update
  // hook (Checklists/ChecklistItems multi updates) on every drag.
  assert.ok(!('boardId' in mod), 'boardId must be absent for a same-board move');
  assert.ok(!('swimlaneId' in mod), 'unchanged swimlaneId must be absent');
});

test('NEGATIVE: a true no-op drop yields an EMPTY modifier (caller skips the write)', () => {
  const mod = computeCardMoveModifier(CARD, {
    boardId: 'B1',
    swimlaneId: 'S1',
    listId: 'L1',
    sort: 3,
  });
  assert.deepStrictEqual(mod, {});
  assert.strictEqual(Object.keys(mod).length, 0);
});

test('NEGATIVE: undefined target fields are ignored, not written as undefined', () => {
  const mod = computeCardMoveModifier(CARD, { listId: 'L2' });
  assert.deepStrictEqual(mod, { listId: 'L2' });
  assert.ok(!('boardId' in mod) && !('swimlaneId' in mod) && !('sort' in mod));
});

console.log(`\n${passed} passing`);
