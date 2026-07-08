'use strict';

// Plain-Node unit test (no Meteor) for the All Boards drag-reorder helpers.
// Run: node tests/boardSortReorder.test.cjs
//
// Regression guard for #6439 ("Custom (drag order) sort — drag shows
// 'not-allowed' cursor, drop doesn't reorder"): the jQuery-ui sortable that
// reordered boards in the manual "custom" mode was removed when the All Boards
// page switched to HTML5 drag-and-drop, and nothing replaced it — so dropping a
// board changed nothing and never wrote profile.boardSortIndex. The pure helpers
// must (a) report that reordering is ENABLED only in 'custom' mode, and (b) turn
// a drop into a new, actually-changed boardSortIndex mapping.

const assert = require('assert');
const {
  isDragReorderEnabled,
  computeReorderedIds,
  computeSortIndexMapping,
  computeReorderedSortIndex,
} = require('../models/lib/boardSortReorder');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- isDragReorderEnabled ----------------------------------------------------
test('reordering is enabled in the custom (manual drag order) mode', () => {
  assert.strictEqual(isDragReorderEnabled('custom'), true);
});

test('reordering is disabled in the sorted (title) modes', () => {
  assert.strictEqual(isDragReorderEnabled('title-asc'), false);
  assert.strictEqual(isDragReorderEnabled('title-desc'), false);
});

test('reordering is disabled for unknown / missing sort modes', () => {
  assert.strictEqual(isDragReorderEnabled(undefined), false);
  assert.strictEqual(isDragReorderEnabled(null), false);
  assert.strictEqual(isDragReorderEnabled('whatever'), false);
});

// --- computeReorderedIds: POSITIVE ------------------------------------------
test('#6439: dropping a board onto another moves it before that board', () => {
  // Drag D onto B -> D takes B's slot, B (and the rest) shift down.
  const order = ['A', 'B', 'C', 'D'];
  assert.deepStrictEqual(
    computeReorderedIds(order, 'D', 'B'),
    ['A', 'D', 'B', 'C'],
  );
});

test('dragging a board upward onto the first board moves it to the front', () => {
  assert.deepStrictEqual(
    computeReorderedIds(['A', 'B', 'C'], 'C', 'A'),
    ['C', 'A', 'B'],
  );
});

test('the reordered list keeps exactly the same ids (nothing lost/duplicated)', () => {
  const order = ['A', 'B', 'C', 'D'];
  const out = computeReorderedIds(order, 'A', 'D');
  assert.deepStrictEqual(out.slice().sort(), order.slice().sort());
});

// --- computeSortIndexMapping / computeReorderedSortIndex ---------------------
test('computeSortIndexMapping numbers ids sequentially from 0', () => {
  assert.deepStrictEqual(computeSortIndexMapping(['X', 'Y', 'Z']), {
    X: 0,
    Y: 1,
    Z: 2,
  });
});

test('#6439: a drop produces a persistable boardSortIndex mapping', () => {
  const mapping = computeReorderedSortIndex(['A', 'B', 'C', 'D'], 'D', 'B');
  assert.deepStrictEqual(mapping, { A: 0, D: 1, B: 2, C: 3 });
});

// --- REGRESSION GUARD (fails against the old, no-reorder behavior) ----------
test('#6439 regression: a custom-mode drop actually CHANGES the order', () => {
  // The bug was that dragging a board did nothing: order stayed the same and no
  // boardSortIndex was written. The mapping produced by a real drop must differ
  // from the identity mapping of the original order.
  const order = ['A', 'B', 'C', 'D'];
  const before = computeSortIndexMapping(order); // { A:0, B:1, C:2, D:3 }
  const after = computeReorderedSortIndex(order, 'D', 'B');
  assert.ok(after, 'a genuine reorder must yield a mapping, not null');
  assert.notDeepStrictEqual(after, before, 'the order must change on drop');
  assert.strictEqual(after.D, 1, 'dragged board D must move to B\'s old slot');
});

// --- NEGATIVE: no-ops and bad input -----------------------------------------
test('dropping a board onto itself is a no-op (null)', () => {
  assert.strictEqual(computeReorderedIds(['A', 'B'], 'A', 'A'), null);
  assert.strictEqual(computeReorderedSortIndex(['A', 'B'], 'A', 'A'), null);
});

test('unknown dragged/target ids yield no reorder', () => {
  assert.strictEqual(computeReorderedIds(['A', 'B'], 'Z', 'A'), null);
  assert.strictEqual(computeReorderedIds(['A', 'B'], 'A', 'Z'), null);
});

test('missing ids or non-array input yield no reorder', () => {
  assert.strictEqual(computeReorderedIds(['A', 'B'], '', 'A'), null);
  assert.strictEqual(computeReorderedIds(['A', 'B'], 'A', ''), null);
  assert.strictEqual(computeReorderedIds(null, 'A', 'B'), null);
});

// --- #6442 REGRESSION GUARD: the handler must feed REAL board ids -----------
test('#6442: ordered ids read from the wrong DOM class (all "js-board") never reorder', () => {
  // #6439 restored the drag preview but the drop still did nothing, because the
  // drop handler built the current order from `el.classList[0]`. On
  // `li.js-board(class="{{_id}} …")` Jade emits the literal `js-board` class
  // FIRST, so classList[0] is "js-board" for every board — the dragged/target
  // ids are never present, so this helper (correctly) returns null and nothing
  // persists. The fix reads the _id from each board's Blaze data context.
  const wrongOrder = ['js-board', 'js-board', 'js-board'];
  assert.strictEqual(
    computeReorderedSortIndex(wrongOrder, 'boardA', 'boardB'),
    null,
    'wrong-class extraction must not produce a mapping',
  );
  // With the REAL ids the same drop reorders as expected.
  assert.deepStrictEqual(
    computeReorderedSortIndex(['boardA', 'boardB', 'boardC'], 'boardC', 'boardA'),
    { boardC: 0, boardA: 1, boardB: 2 },
    'with real board ids the drop moves boardC before boardA',
  );
});

console.log(`\n${passed} tests passed`);
