'use strict';

// #6675: dragging a swimlane's height handle shorter left stale dependency
// ("red string") lines drawn past its new, shorter edge and on top of the
// swimlane below it - and while actively dragging, the swimlane's own
// collapsed lists did the same.
// Run: node tests/swimlaneResizeDependencyLines.test.cjs
//
// Two independent causes, two independent fixes:
//  1. `.swimlane.swimlane-resizing` forced `overflow: visible !important` for
//     the whole drag, so anything taller than the previewed height (a
//     collapsed list is a fixed 540px, see list.css) painted straight past
//     it. Now `hidden`, matching what the swimlane clips to once the drag
//     ends anyway.
//  2. dependencyOverlay.js (the "red string" SVG) only ever redraws on
//     scroll or a window resize; changing a swimlane's own height via drag
//     fires neither, so its lines kept whatever coordinates a card had
//     BEFORE the resize - stale positions that can lie on top of the next
//     swimlane once the real card is scrolled/clipped out of view. Fixed by
//     (a) swimlanes.js dispatching a dedicated event on every height change,
//     which dependencyOverlay.js listens for, and (b) dependencyOverlay.js
//     no longer drawing to/from a card that has no on-screen area left once
//     every clipping ancestor is accounted for - so a line between two cards
//     in the SAME (now-shrunk) swimlane disappears when its card does,
//     while a line to a DIFFERENT, still-visible swimlane's card is
//     unaffected, because that card's own visibility is checked separately.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('swimlaneResizeDependencyLines:');

const swimlanesCss = read('client/components/swimlanes/swimlanes.css');
const swimlanesJs = read('client/components/swimlanes/swimlanes.js');
const overlayJs = read('client/components/boards/dependencyOverlay.js');

test('a swimlane being resized clips its own content instead of showing it past its edge', () => {
  const rule = swimlanesCss.slice(swimlanesCss.indexOf('.swimlane.swimlane-resizing'));
  const block = rule.slice(0, rule.indexOf('}'));
  assert.match(block, /overflow:\s*hidden\s*!important/);
  assert.doesNotMatch(block, /overflow:\s*visible/,
    'no longer forces the whole drag to paint unclipped (negative)');
});

test('a swimlane height drag tells the dependency overlay to recompute', () => {
  const doResize = swimlanesJs.slice(
    swimlanesJs.indexOf('const doResize'), swimlanesJs.indexOf('const stopResize'));
  const stopResize = swimlanesJs.slice(swimlanesJs.indexOf('const stopResize'));
  assert.match(doResize, /window\.dispatchEvent\(new Event\('wekan-swimlane-resized'\)\)/,
    'fired live, on every mousemove while dragging');
  assert.match(stopResize, /window\.dispatchEvent\(new Event\('wekan-swimlane-resized'\)\)/,
    'and once more after the drag settles, when overflow reverts to auto');
});

test('the dependency overlay listens for that event, and cleans up the listener', () => {
  assert.match(overlayJs, /addEventListener\('wekan-swimlane-resized', this\.onSwimlaneResize\)/);
  assert.match(overlayJs, /removeEventListener\('wekan-swimlane-resized', this\.onSwimlaneResize\)/);
});

test('a card with no visible area left after ancestor clipping is treated as not rendered', () => {
  assert.match(overlayJs, /function hasVisibleArea\(el\)/);
  const rectOf = overlayJs.slice(overlayJs.indexOf('this.rectOf ='), overlayJs.indexOf('this.recompute ='));
  assert.match(rectOf, /if \(!hasVisibleArea\(el\)\) return null;/,
    'rectOf refuses a card that is clipped out of view, the same way it already refuses a 0x0 one');
});

test('visibility is checked against EVERY clipping ancestor, not just the swimlane', () => {
  // A dependency line reads getBoundingClientRect(), which does not know
  // about a scrolled/clipped ancestor - walking up the tree and intersecting
  // against each one that actually clips (overflow hidden/auto/scroll) is
  // what makes "the card is not really visible here" correct in general,
  // not just for the one bug that was reported.
  const fn = overlayJs.slice(overlayJs.indexOf('function hasVisibleArea'), overlayJs.indexOf('this.rectOf ='));
  assert.match(fn, /overflowY/);
  assert.match(fn, /overflowX/);
  assert.match(fn, /while \(node/);
});

console.log(`\nswimlaneResizeDependencyLines: ${passed} tests passed`);
