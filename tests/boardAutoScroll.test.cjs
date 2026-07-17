'use strict';

// Plain-Node unit test (no Meteor) for the board auto-scroll decision
// helpers used while dragging a card near a board edge.
// Run: ELECTRON_RUN_AS_NODE=1 <node> tests/boardAutoScroll.test.cjs
//
// Regression guard for #443 ("Cannot automatically slide when moving item
// from list to list"): dragging a card towards a list outside the viewport
// did not scroll the board. The card sortable's `sort` callback
// (client/components/lists/list.js) scrolls `.board-canvas`, but since the
// swimlane layout the horizontal scroller is the `.js-lists` lane
// (`.swimlane { overflow: auto }`): .board-canvas never overflows
// horizontally, so its scrollLeftMax (scrollWidth - clientWidth) is 0 and
// the old right-scroll guard `scrollLeft < scrollLeftMax` compared 0 < 0 —
// the auto-scroll was a dead branch. The helpers under test compute which
// lane to scroll (hit-testing the pointer against lane rects) and the next
// clamped scroll position.

const assert = require('assert');
const {
  EDGE_SIZE,
  SCROLL_STEP,
  computeEdgeScroll,
  findLaneUnderPointer,
} = require('../imports/lib/boardAutoScroll.js');

let passed = 0;
const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

// A lane like a real board: 1000px visible, 2600px of lists inside.
const lane = (scrollLeft) => ({
  lowEdge: 0,
  highEdge: 1000,
  scrollPos: scrollLeft,
  scrollSize: 2600,
  clientSize: 1000,
});

// --- computeEdgeScroll: positive cases --------------------------------------

test('pointer near the right edge scrolls the lane right by one step', () => {
  const next = computeEdgeScroll({ pointer: 990, ...lane(100) });
  assert.strictEqual(next, 100 + SCROLL_STEP);
});

test('pointer near the left edge scrolls the lane left by one step', () => {
  const next = computeEdgeScroll({ pointer: 5, ...lane(100) });
  assert.strictEqual(next, 100 - SCROLL_STEP);
});

test('pointer dragged slightly PAST the lane edge still scrolls', () => {
  // The sortable helper can hover a few px outside the lane box; a negative
  // edge distance must count as being in that edge zone.
  assert.strictEqual(computeEdgeScroll({ pointer: -4, ...lane(100) }), 85);
  assert.strictEqual(computeEdgeScroll({ pointer: 1003, ...lane(100) }), 115);
});

test('scroll position is clamped to the real range at both ends', () => {
  // 10px left of the stop: a full 15px step must clamp to 0, not go negative.
  assert.strictEqual(computeEdgeScroll({ pointer: 2, ...lane(10) }), 0);
  // 1595 + 15 would overshoot maxScroll (2600 - 1000 = 1600): clamp to 1600.
  assert.strictEqual(computeEdgeScroll({ pointer: 999, ...lane(1595) }), 1600);
});

test('tiny lane where the edge zones overlap: the nearer edge wins', () => {
  const tiny = {
    lowEdge: 0,
    highEdge: 60, // both zones cover the whole lane (EDGE_SIZE = 40)
    scrollPos: 100,
    scrollSize: 500,
    clientSize: 60,
  };
  assert.ok(EDGE_SIZE * 2 > 60);
  // 10px from the left edge, 50px from the right edge -> scroll left.
  assert.strictEqual(computeEdgeScroll({ pointer: 10, ...tiny }), 85);
  // 10px from the right edge -> scroll right.
  assert.strictEqual(computeEdgeScroll({ pointer: 50, ...tiny }), 115);
});

test('vertical axis works the same way (board-canvas scrollTop)', () => {
  // .board-canvas DOES overflow vertically; same helper, vertical inputs.
  const next = computeEdgeScroll({
    pointer: 795, // clientY near the bottom edge
    lowEdge: 0,
    highEdge: 800,
    scrollPos: 50,
    scrollSize: 3000,
    clientSize: 800,
  });
  assert.strictEqual(next, 50 + SCROLL_STEP);
});

// --- computeEdgeScroll: negative cases ---------------------------------------

test('pointer in the middle of the lane does not scroll', () => {
  assert.strictEqual(computeEdgeScroll({ pointer: 500, ...lane(100) }), null);
});

test('just outside the edge zone does not scroll, just inside does', () => {
  // Right edge zone starts at highEdge - EDGE_SIZE = 960.
  assert.strictEqual(computeEdgeScroll({ pointer: 960, ...lane(100) }), null);
  assert.strictEqual(computeEdgeScroll({ pointer: 961, ...lane(100) }), 115);
});

test('already at the far end: no further right scroll', () => {
  assert.strictEqual(computeEdgeScroll({ pointer: 990, ...lane(1600) }), null);
});

test('already at 0: no further left scroll', () => {
  assert.strictEqual(computeEdgeScroll({ pointer: 5, ...lane(0) }), null);
});

test('#443 root cause: an element with no horizontal overflow never scrolls', () => {
  // This is exactly .board-canvas in the current layout: scrollWidth ===
  // clientWidth, so the old code (and this helper, correctly) can never
  // horizontal-scroll it. The fix is to feed the LANE geometry instead.
  const boardCanvas = {
    lowEdge: 0,
    highEdge: 1000,
    scrollPos: 0,
    scrollSize: 1000, // no horizontal overflow
    clientSize: 1000,
  };
  assert.strictEqual(
    computeEdgeScroll({ pointer: 995, ...boardCanvas }),
    null,
  );
  // Same pointer against the lane that actually overflows: scrolls.
  assert.strictEqual(computeEdgeScroll({ pointer: 995, ...lane(0) }), 15);
});

// --- findLaneUnderPointer -----------------------------------------------------

// Two swimlane lanes stacked vertically (Swimlanes view).
const laneRects = [
  { left: 0, right: 1000, top: 60, bottom: 360 },
  { left: 0, right: 1000, top: 420, bottom: 720 },
];

test('picks the lane whose rect contains the pointer', () => {
  assert.strictEqual(findLaneUnderPointer(laneRects, 990, 100), 0);
  assert.strictEqual(findLaneUnderPointer(laneRects, 990, 500), 1);
});

test('pointer between swimlanes (over a header) matches no lane', () => {
  assert.strictEqual(findLaneUnderPointer(laneRects, 500, 390), -1);
});

test('pointer outside every lane horizontally matches no lane', () => {
  assert.strictEqual(findLaneUnderPointer(laneRects, 1200, 100), -1);
});

test('degenerate inputs are safe', () => {
  assert.strictEqual(findLaneUnderPointer(null, 10, 10), -1);
  assert.strictEqual(findLaneUnderPointer([], 10, 10), -1);
  assert.strictEqual(findLaneUnderPointer([null], 10, 10), -1);
});

// --- Runner -------------------------------------------------------------------

for (const [name, fn] of tests) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error('  FAIL -', name);
    console.error(err);
    process.exitCode = 1;
  }
}
console.log(`${passed}/${tests.length} tests passed`);
if (passed !== tests.length) process.exitCode = 1;
