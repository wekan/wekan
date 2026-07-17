'use strict';

// Pure helpers for auto-scrolling the board while a card is dragged near an
// edge. Extracted so the decision logic is unit-testable in plain Node
// without Meteor (same pattern as client/lib/cardDragGeometry.js and
// imports/lib/advancedFilter.js). See tests/boardAutoScroll.test.cjs.
//
// #443 "Cannot automatically slide when moving item from list to list":
// dragging a card towards a list that is outside the viewport does not
// scroll the board, so the user has to drop the card on an intermediate
// list and scroll manually.
//
// The card sortable's `sort` callback (client/components/lists/list.js) does
// contain horizontal auto-scroll code, but it mutates
// `$('.board-canvas')[0].scrollLeft`. Since the swimlane layout, the element
// that actually overflows horizontally is the lane that holds the lists —
// `.swimlane.js-lists` (`.swimlane { display: flex; overflow: auto }` in
// client/components/swimlanes/swimlanes.css) — in BOTH board views
// (swimlanes.jade renders `.swimlane.js-lists.js-swimlane` per swimlane and
// `.swimlane.list-group.js-lists` in Lists mode). `.board-canvas` only
// scrolls vertically (boardBody.css: `overflow-y: auto`), so its
// scrollWidth === clientWidth: the old guard
// `boardCanvas.scrollLeft < (scrollWidth - clientWidth)` compares 0 < 0 and
// the right-scroll branch never fires, while the left-scroll branch
// decrements a scrollLeft that is already 0. jQuery UI's own `scroll` option
// cannot help either: sortable takes `this.placeholder.scrollParent()` ONCE
// at drag start, which resolves to the list body (the vertical card
// scroller), never the lane.
//
// These helpers compute WHAT to scroll (the lane under the pointer, found by
// hit-testing lane rectangles) and BY HOW MUCH (an edge-proximity step,
// clamped to the real scroll range). The caller applies the returned value:
//
//   const lanes = document.querySelectorAll('.js-lists');
//   const i = findLaneUnderPointer([...lanes].map(l =>
//     l.getBoundingClientRect()), event.clientX, event.clientY);
//   if (i !== -1) {
//     const lane = lanes[i];
//     const rect = lane.getBoundingClientRect();
//     const next = computeEdgeScroll({
//       pointer: event.clientX,
//       lowEdge: rect.left,
//       highEdge: rect.right,
//       scrollPos: lane.scrollLeft,
//       scrollSize: lane.scrollWidth,
//       clientSize: lane.clientWidth,
//     });
//     if (next !== null) lane.scrollLeft = next;
//   }

// How close (px) to an edge the pointer must be before scrolling starts.
// The old code used 10px from the viewport edge, which was nearly impossible
// to hit while holding a card; 40px matches common kanban implementations.
const EDGE_SIZE = 40;

// How far (px) to scroll per sort/mousemove event (same speed as the old
// board-canvas code and the sortable `scrollSpeed: 10..15` range).
const SCROLL_STEP = 15;

// Compute the next scroll position along ONE axis, or null when nothing
// should change. Axis-agnostic: pass clientX/left/right/scrollLeft/
// scrollWidth/clientWidth for horizontal, clientY/top/bottom/scrollTop/
// scrollHeight/clientHeight for vertical.
//
//   pointer     current pointer coordinate (viewport space, e.g. clientX)
//   lowEdge     scroller's near edge (rect.left / rect.top)
//   highEdge    scroller's far edge (rect.right / rect.bottom)
//   scrollPos   scroller's current scrollLeft / scrollTop
//   scrollSize  scroller's scrollWidth / scrollHeight
//   clientSize  scroller's clientWidth / clientHeight
//
// Returns the clamped new scroll position, or null when the pointer is not
// in an edge zone, the element cannot scroll further in that direction, or
// it does not overflow at all (this is exactly why the old code was a no-op:
// for .board-canvas, scrollSize - clientSize is 0 horizontally).
function computeEdgeScroll({
  pointer,
  lowEdge,
  highEdge,
  scrollPos,
  scrollSize,
  clientSize,
  edgeSize = EDGE_SIZE,
  step = SCROLL_STEP,
}) {
  const maxScroll = Math.max(0, scrollSize - clientSize);
  if (maxScroll === 0) {
    // No overflow on this axis: nothing to scroll.
    return null;
  }
  const distLow = pointer - lowEdge;
  const distHigh = highEdge - pointer;
  const inLow = distLow < edgeSize;
  const inHigh = distHigh < edgeSize;
  // A negative distance means the pointer was dragged slightly PAST the
  // edge (the sortable helper can hover outside the lane box); that still
  // counts as being in that edge zone. When the element is so small that
  // both zones overlap, the nearer edge wins.
  if (inLow && (!inHigh || distLow <= distHigh)) {
    const next = Math.max(0, scrollPos - step);
    return next < scrollPos ? next : null;
  }
  if (inHigh) {
    const next = Math.min(maxScroll, scrollPos + step);
    return next > scrollPos ? next : null;
  }
  return null;
}

// Given the bounding rectangles ({left, right, top, bottom}) of every
// horizontal lane on the board (each `.js-lists` element — one per swimlane
// in Swimlanes view, a single one in Lists view), return the index of the
// lane the pointer is currently over, or -1. The drag may hover a DIFFERENT
// swimlane than the one the card came from; the lane under the pointer is
// the one the user is aiming at, so that is the one to scroll.
function findLaneUnderPointer(laneRects, pointerX, pointerY) {
  if (!laneRects) return -1;
  for (let i = 0; i < laneRects.length; i += 1) {
    const r = laneRects[i];
    if (
      r &&
      pointerX >= r.left &&
      pointerX <= r.right &&
      pointerY >= r.top &&
      pointerY <= r.bottom
    ) {
      return i;
    }
  }
  return -1;
}

module.exports = {
  EDGE_SIZE,
  SCROLL_STEP,
  computeEdgeScroll,
  findLaneUnderPointer,
};
