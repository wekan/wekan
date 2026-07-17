'use strict';

// Plain-Node unit test (no Meteor) for the #3826 drag-sort repair helpers.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/subtaskCardReorder.test.cjs
//
// #3826 "Cannot order cards manually in a list with a lot of cards that have
// parents" (Severity:Data-loss): every card created through the "add subtask"
// flow was inserted with a constant `sort: -1`, so a list populated by
// subtasks contained ONLY ties. Dropping a card between two ties is
// unsolvable for the drag-index math: it returned base === -1 with
// increment 0, the dropped card's sort was already -1, Card.move()'s no-op
// guard (models/lib/cardMoveModifier.js) silently discarded the write, and
// the card snapped back to its old place. A multi-selection drop was worse:
// increment 0 wrote the SAME sort to every selected card, permanently losing
// their relative order.
//
// The fix (client/components/lists/list.js sortable `stop` handler) detects
// the degenerate gap, repairs the sibling sorts with minimal bumps that make
// the visual order strictly increasing, and recomputes a drop index that
// falls strictly between the repaired neighbours.

const assert = require('assert');
const {
  isDegenerateSortGap,
  computeMonotonicSortRepair,
  computeRepairedDropIndex,
} = require('../models/lib/cardSortRepair');
const { computeCardMoveModifier } = require('../models/lib/cardMoveModifier');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: degenerate gaps are detected ---------------------------------

test('the #3826 tie (-1 / -1 from subtask inserts) is degenerate', () => {
  assert.strictEqual(isDegenerateSortGap(-1, -1), true);
});

test('any equal-sort gap is degenerate (ties at 0 too)', () => {
  assert.strictEqual(isDegenerateSortGap(0, 0), true);
});

test('an inverted gap (legacy data, prev > next) is degenerate', () => {
  assert.strictEqual(isDegenerateSortGap(5, 2), true);
});

test('a non-numeric sort is degenerate (repair instead of writing NaN)', () => {
  assert.strictEqual(isDegenerateSortGap(NaN, 3), true);
  assert.strictEqual(isDegenerateSortGap(1, 'not-a-number'), true);
});

// --- POSITIVE: the repair makes the visual order strictly increasing --------

test('a list full of sort:-1 subtask cards is repaired to strictly increasing sorts', () => {
  // The reported scenario: subtasks A..D all inserted with sort -1.
  const cards = [
    { _id: 'A', sort: -1 },
    { _id: 'B', sort: -1 },
    { _id: 'C', sort: -1 },
    { _id: 'D', sort: -1 },
  ];
  const updates = computeMonotonicSortRepair(cards);
  // First card already fits; the three followers are bumped to -1+1=0, 1, 2.
  assert.deepStrictEqual(updates, [
    { _id: 'B', sort: 0 },
    { _id: 'C', sort: 1 },
    { _id: 'D', sort: 2 },
  ]);
});

test('the repair is idempotent (a healthy list yields no writes)', () => {
  const healthy = [
    { _id: 'A', sort: -1 },
    { _id: 'B', sort: 0 },
    { _id: 'C', sort: 1 },
  ];
  assert.deepStrictEqual(computeMonotonicSortRepair(healthy), []);
});

test('cards already strictly increasing are left untouched (minimal writes)', () => {
  const mixed = [
    { _id: 'A', sort: 1 },
    { _id: 'B', sort: 1 }, // tie -> bumped to 2
    { _id: 'C', sort: 10 }, // already > 2 -> untouched
    { _id: 'D', sort: 10 }, // tie -> bumped to 11
  ];
  assert.deepStrictEqual(computeMonotonicSortRepair(mixed), [
    { _id: 'B', sort: 2 },
    { _id: 'D', sort: 11 },
  ]);
});

test('a non-finite sort is replaced with a real number', () => {
  const cards = [
    { _id: 'A', sort: 'garbage' },
    { _id: 'B', sort: 5 },
  ];
  const updates = computeMonotonicSortRepair(cards);
  assert.deepStrictEqual(updates, [{ _id: 'A', sort: 0 }]);
});

// --- POSITIVE: the reported drag now persists -------------------------------

test('#3826: dropping D between A and B in an all-ties list yields a persistable move', () => {
  // Visual order in the list (all subtasks, all sort -1): A, B, C, D.
  // The user drags D between A and B. Siblings (excluding dragged D): A, B, C.
  const siblings = [
    { _id: 'A', sort: -1 },
    { _id: 'B', sort: -1 },
    { _id: 'C', sort: -1 },
  ];
  const drop = computeRepairedDropIndex(siblings, siblings[0], siblings[1], 1);
  // Repaired neighbours: A stays -1, B becomes 0.
  assert.deepStrictEqual(drop.updates, [
    { _id: 'B', sort: 0 },
    { _id: 'C', sort: 1 },
  ]);
  // The drop index falls STRICTLY between the repaired neighbours...
  assert.ok(drop.base > -1 && drop.base < 0, `base ${drop.base} must be in (-1, 0)`);
  // ...so Card.move()'s no-op guard no longer discards the write. This is the
  // exact chain that made the card "go back to his place" before the fix.
  const draggedCard = { boardId: 'B1', swimlaneId: 'S1', listId: 'L1', sort: -1 };
  const mod = computeCardMoveModifier(draggedCard, {
    boardId: 'B1',
    swimlaneId: 'S1',
    listId: 'L1',
    sort: drop.base,
  });
  assert.deepStrictEqual(mod, { sort: drop.base });
});

test('multi-selection drop into a repaired gap keeps every card distinct (no order data-loss)', () => {
  const siblings = [
    { _id: 'A', sort: -1 },
    { _id: 'B', sort: -1 },
  ];
  const nCards = 3;
  const drop = computeRepairedDropIndex(siblings, siblings[0], siblings[1], nCards);
  assert.ok(drop.increment > 0, 'increment must be strictly positive');
  const sorts = [];
  for (let i = 0; i < nCards; i += 1) {
    sorts.push(drop.base + i * drop.increment);
  }
  // All strictly between the repaired neighbours (-1 and 0), all distinct.
  sorts.forEach(s => assert.ok(s > -1 && s < 0, `sort ${s} must be in (-1, 0)`));
  assert.strictEqual(new Set(sorts).size, nCards, 'every selected card keeps a distinct sort');
});

// --- NEGATIVE: the old broken behaviour must not come back ------------------

test('NEGATIVE: the repaired drop must NEVER return the neighbour-tie index (base === tie, increment 0)', () => {
  // Before the fix the computed index for a (-1, -1) gap was
  // { base: -1, increment: 0 }: base equalled the dragged card's own sort, so
  // computeCardMoveModifier returned {} and the move was silently dropped.
  const siblings = [
    { _id: 'A', sort: -1 },
    { _id: 'B', sort: -1 },
  ];
  const drop = computeRepairedDropIndex(siblings, siblings[0], siblings[1], 1);
  assert.notStrictEqual(drop.base, -1, 'base must differ from the old tied sort');
  assert.notStrictEqual(drop.increment, 0, 'increment 0 was the multi-drop data-loss');
  const draggedCard = { boardId: 'B1', swimlaneId: 'S1', listId: 'L1', sort: -1 };
  const mod = computeCardMoveModifier(draggedCard, {
    boardId: 'B1',
    swimlaneId: 'S1',
    listId: 'L1',
    sort: drop.base,
  });
  assert.ok(Object.keys(mod).length > 0, 'the move must not be discarded as a no-op');
});

test('NEGATIVE: a healthy gap is NOT degenerate (the repair path must stay off)', () => {
  // The normal drag path (Utils.calculateIndex) must keep handling these.
  assert.strictEqual(isDegenerateSortGap(-1, 0), false);
  assert.strictEqual(isDegenerateSortGap(1, 2), false);
  assert.strictEqual(isDegenerateSortGap(0.25, 0.5), false);
});

test('NEGATIVE: drops at the very top/bottom (one missing neighbour) are not degenerate', () => {
  // With a single neighbour there is always room (base -2 above a -1 tie,
  // base 0 below it), so no repair — and no needless sibling writes.
  assert.strictEqual(isDegenerateSortGap(null, -1), false);
  assert.strictEqual(isDegenerateSortGap(-1, null), false);
  assert.strictEqual(isDegenerateSortGap(undefined, undefined), false);
});

test('NEGATIVE: the repair must not rewrite cards without an _id (defensive)', () => {
  const updates = computeMonotonicSortRepair([
    null,
    { sort: -1 },
    { _id: 'B', sort: -1 },
  ]);
  assert.deepStrictEqual(updates, []);
});

console.log(`\n${passed} passing`);
