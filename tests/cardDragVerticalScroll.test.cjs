'use strict';

// wekan/wekan#6584 "It is not possible to move a card downwards":
//
//   "With v6 i was able to move a Card downwards by drag & Drop. Upwards is no
//    problem, the Line scrolls automaticly up, but this does not work downwards.
//    The whole Page/Site scrolls down and not ne Line"
//
// Run: node tests/cardDragVerticalScroll.test.cjs
//
// The card sortable's `sort` handler auto-scrolls at the edges. Horizontally it
// picks the LANE under the pointer (#443). Vertically it did not pick anything:
// it always scrolled `.board-canvas`, which holds the swimlanes, rather than the
// `.list-body` under the pointer, which is `overflow-y: scroll` and holds the
// cards. Scrolling the canvas moves the whole board - "the whole Page/Site
// scrolls down and not ne Line".
//
// THE ASYMMETRY IS THE TELL, and it is what makes this reproducible rather than
// vague. Dragging UP, the canvas is usually already at scrollTop 0, so
// computeEdgeScroll returned null, this handler did nothing, and jQuery UI's own
// `scroll` option - which acts on the placeholder's scrollParent, i.e. the list
// body - scrolled the list, which is why up "is no problem". Dragging DOWN, the
// canvas nearly always has room left, so the handler fired first and scrolled the
// board instead.
//
// The list under the pointer now scrolls first, and the canvas only once the list
// cannot go further that way - so a drag down a long list scrolls the list, and a
// drag past the end of it moves on to the board.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const listJs = fs.readFileSync(
  path.join(repoRoot, 'client/components/lists/list.js'), 'utf8');
const listCss = fs.readFileSync(
  path.join(repoRoot, 'client/components/lists/list.css'), 'utf8');
const { computeEdgeScroll, findLaneUnderPointer } =
  require(path.join(repoRoot, 'imports/lib/boardAutoScroll.js'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// The `sort` handler, which is where the auto-scroll lives.
const sortHandler = (() => {
  const at = listJs.indexOf('    sort(event, ui) {');
  assert.notStrictEqual(at, -1, 'list.js must still have the sortable sort handler');
  return listJs.slice(at, listJs.indexOf("\n      $cards.sortable('refreshPositions');", at));
})();

test('the list body is still the element that scrolls cards', () => {
  const at = listCss.indexOf('.list-body {');
  assert.notStrictEqual(at, -1, 'list.css must still style .list-body');
  const rule = listCss.slice(at, listCss.indexOf('}', at));
  assert.ok(/overflow-y:\s*scroll/.test(rule),
    'if the cards ever stop scrolling inside .list-body, the drag auto-scroll ' +
    'has to follow them to whatever does');
});

test('the vertical auto-scroll picks the list under the pointer', () => {
  assert.ok(/document\.querySelectorAll\('\.list-body'\)/.test(sortHandler),
    'the handler must look at the list bodies, not only at .board-canvas - ' +
    'scrolling the canvas moves the whole board, which is the reported symptom');
  const listAt = sortHandler.indexOf(".querySelectorAll('.list-body')");
  const canvasAt = sortHandler.indexOf(".querySelector('.board-canvas')");
  assert.ok(listAt !== -1 && canvasAt !== -1 && listAt < canvasAt,
    'and it must try the list BEFORE the canvas');
});

test('the canvas is only scrolled when the list could not be', () => {
  assert.ok(/scrolledList\s*\?\s*null\s*:\s*document\.querySelector\('\.board-canvas'\)/.test(sortHandler),
    'a drag past the end of a list should still move on to the board, but a drag ' +
    'down a list that can still scroll must not move the board underneath it');
});

test('the horizontal lane scroll is untouched', () => {
  // #443 is the reason the lane hit-test exists; this fix must not disturb it.
  assert.ok(/document\.querySelectorAll\('\.js-lists'\)/.test(sortHandler),
    'the lane lookup must stay');
  assert.ok(/scrollLeft = nextLeft/.test(sortHandler), 'and still set scrollLeft');
});

test('positions are still re-cached after any auto-scroll', () => {
  // #6477: jQuery UI caches geometry at drag start; a manual scroll invalidates
  // it and the drop lands in the wrong swimlane without this.
  assert.ok(/if \(scrolled\) \{/.test(listJs) &&
            /refreshPositions/.test(listJs),
    'scrolling the list is a manual scroll like any other and must refresh too');
  assert.ok(/scrolled = true;/.test(sortHandler.slice(sortHandler.indexOf('.list-body'))),
    'the list branch must set `scrolled`, or the refresh is skipped for it');
});

// ── the decision logic itself, exercised with real numbers ──────────────────

test('a pointer near the bottom of a scrollable list scrolls it DOWN', () => {
  // A list body 600px tall on screen, 2000px of cards, currently at the top.
  // The pointer is 10px above its bottom edge: inside the 40px edge zone.
  const next = computeEdgeScroll({
    pointer: 690, lowEdge: 100, highEdge: 700,
    scrollPos: 0, scrollSize: 2000, clientSize: 600,
  });
  assert.strictEqual(next, 15, 'it should step down by SCROLL_STEP');
});

test('...and stops at the end instead of handing the drag to the board', () => {
  const next = computeEdgeScroll({
    pointer: 690, lowEdge: 100, highEdge: 700,
    scrollPos: 1400, scrollSize: 2000, clientSize: 600,
  });
  assert.strictEqual(next, null,
    'at maxScroll it returns null - which is exactly what lets the canvas take over');
});

test('a list that does not overflow never claims the scroll', () => {
  const next = computeEdgeScroll({
    pointer: 690, lowEdge: 100, highEdge: 700,
    scrollPos: 0, scrollSize: 600, clientSize: 600,
  });
  assert.strictEqual(next, null, 'a short list must let the board scroll instead');
});

test('the list under the pointer is the one chosen, not the first on the board', () => {
  // Three lists side by side; the pointer is over the middle one.
  const rects = [
    { left: 0, right: 200, top: 100, bottom: 700 },
    { left: 210, right: 410, top: 100, bottom: 700 },
    { left: 420, right: 620, top: 100, bottom: 700 },
  ];
  assert.strictEqual(findLaneUnderPointer(rects, 300, 690), 1);
  assert.strictEqual(findLaneUnderPointer(rects, 300, 900), -1,
    'below every list, nothing is chosen and the canvas handles it');
});

console.log(`\n${passed} passed`);
