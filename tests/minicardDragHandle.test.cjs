'use strict';

// The minicard's drag handle sits BELOW the minicard menu button, on the same edge.
//
// Requested for mobile mode, where it was not where you would look for it. On a
// coarse (touch) pointer the handle was a full-height strip down the LEADING edge -
// added for #6521, because on a touch device the handle is the ONLY way to drag a
// card (the card body deliberately pans the board instead), so a 20-28px corner icon
// was too small to hit. That reached the size goal but put the handle on the opposite
// side of the card from every other card control, and from where a mouse user's
// handle already is.
//
// Now both pointer kinds put it in the same place: menu button on top, drag handle
// directly below it, down the trailing edge. The touch version is simply bigger.
//
// Run: node tests/minicardDragHandle.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const css = read('client/components/cards/minicard.css');
const jade = read('client/components/cards/minicard.jade');
const js = read('client/components/cards/minicard.js');
const swimlaneJade = read('client/components/swimlanes/swimlaneHeader.jade');
const swimlaneCss = read('client/components/swimlanes/swimlanes.css');

function rule(block, selector) {
  const at = block.indexOf(selector);
  assert.ok(at > -1, `${selector} must be styled`);
  return block.slice(block.indexOf('{', at) + 1, block.indexOf('}', at));
}

console.log('minicardDragHandle:');

test('the handle exists and is the drag source on touch', () => {
  assert.ok(/\.handle\n?\s*i\.fa\.fa-arrows/.test(jade) || /\.handle/.test(jade),
    'the minicard renders a handle');
  // Rendered only when the card can be moved AND handles are on - the same pair of
  // conditions that adds the `minicard-with-handle` class, so the reserved space and
  // the handle always appear together.
  assert.ok(/if canMoveCard/.test(jade), 'only when the card can be moved');
  assert.ok(/if isTouchScreenOrShowDesktopDragHandles/.test(jade),
    'and only when drag handles are on');
  assert.ok(/showMinicardHandle\(\) \{\s*return Utils\.canMoveCard\(\) && Utils\.showDragHandles\(\);/
    .test(js), 'the class that reserves room uses the same two conditions');
});

test('for a mouse the handle is just below the menu button', () => {
  // Desktop MODE keeps its compact control even on a mouse.
  const base = rule(css, '.minicard .handle {');
  assert.ok(/top:\s*28px/.test(base), 'below the menu button, not level with it');
  assert.ok(/inset-inline-end/.test(base), 'on the trailing edge, mirrored in RTL');
});

test('in Mobile Mode the handle is below the menu on every browser', () => {
  const handle = rule(css, 'body.mobile-mode .minicard .handle {');
  const menu = rule(css, 'body.mobile-mode .minicard .minicard-details-menu-with-handle {');
  // Menu at the top of the trailing edge...
  assert.ok(/top:\s*0/.test(menu), 'the menu button is at the top');
  assert.ok(/inset-inline-end:\s*0/.test(menu), 'on the trailing edge');
  // ...handle directly beneath it, on the same edge.
  assert.ok(/top:\s*32px/.test(handle), 'the handle starts where the menu button ends');
  assert.ok(/inset-inline-end:\s*0/.test(handle), 'on the same edge as the menu');
  assert.ok(/inset-inline-start:\s*auto/.test(handle),
    'and NOT on the leading edge - that is the placement being replaced');
  const px = (block, property) =>
    Number(new RegExp(`${property}:\\s*(\\d+)(?:px)?`).exec(block)[1]);
  const menuCenterFromEdge = px(menu, 'inset-inline-end') + px(menu, 'width') / 2;
  const handleCenterFromEdge = px(handle, 'inset-inline-end') + px(handle, 'width') / 2;
  assert.strictEqual(handleCenterFromEdge, menuCenterFromEdge,
    'menu and drag-handle hit areas have exactly the same x center');
  // Both are logical properties, so the column mirrors in RTL rather than being
  // stranded on the left of an Arabic or Hebrew board.
  assert.ok(!/\b(left|right):/.test(handle + menu),
    'no physical left/right - the column must mirror in RTL');
});

test('the Mobile Mode handle has no grey button background in Safari', () => {
  const handle = rule(css, 'body.mobile-mode .minicard .handle {');
  assert.ok(/background:\s*inherit\s*!important/.test(handle),
    'the touch target uses the minicard background instead of painting a layer');
  assert.ok(!/background(?:-color)?:\s*(?:#(?:ccc|ddd|eee)|rgba?\()/i.test(handle),
    'no grey or tinted background may turn the handle into a separate button');
  assert.ok(/border:\s*0/.test(handle), 'no border draws a box around the target');
  assert.ok(/box-shadow:\s*none/.test(handle), 'no shadow draws a grey layer below it');
  assert.ok(/-webkit-tap-highlight-color:\s*transparent/.test(handle),
    'iPhone Safari cannot add its own grey tap highlight');
  const pseudos = rule(css, 'body.mobile-mode .minicard .handle::before,');
  assert.ok(/background:\s*transparent\s*!important/.test(pseudos),
    'neither handle pseudo-element can paint a background');
});

test('the arrow glyph stays centered below the menu icon', () => {
  const icon = rule(css, 'body.mobile-mode .minicard .handle .fa {');
  assert.ok(!/position:|inset-|\b(left|right):/.test(icon),
    'the glyph must not be shifted away from its parent control center');
});

test('the swimlane uses its desktop handle position on every device', () => {
  assert.strictEqual((swimlaneJade.match(/a\.swimlane-header-handle/g) || []).length, 1,
    'one shared swimlane handle is rendered behind the handle preference');
  assert.ok(!/swimlane-header-miniscreen-handle/.test(swimlaneJade + swimlaneCss),
    'touch detection must not select a differently positioned handle');
  const handle = rule(swimlaneCss,
    '.swimlane .swimlane-header-wrap .swimlane-header-handle {');
  assert.ok(/font-size:\s*calc\(16px/.test(handle), 'the compact desktop size is shared');
  assert.ok(/margin-inline-start:\s*30px/.test(handle),
    'the desktop logical position is shared and mirrors in RTL');
});

test('the touch handle is still a finger-sized target (#6521)', () => {
  const handle = rule(css, 'body.mobile-mode .minicard .handle {');
  assert.ok(/width:\s*44px/.test(handle), 'wide enough for a finger');
  // It runs from under the menu to the bottom of the card, so a tall card gives a
  // tall target, with a floor for a card that holds nothing but a title.
  assert.ok(/bottom:\s*0/.test(handle), 'stretches to the bottom of the card');
  assert.ok(/min-height:\s*36px/.test(handle), 'with a minimum on a short card');
  assert.ok(/height:\s*auto/.test(handle),
    'height must be released, or the inherited fixed height wins over top/bottom');
});

test('the card reserves the column and is tall enough to hold it', () => {
  const card = rule(css, 'body.mobile-mode .minicard.minicard-with-handle {');
  assert.ok(/padding-inline-end:\s*44px/.test(card),
    'the card text must not run under the column');
  // menu (32) + handle minimum (36).
  assert.ok(/min-height:\s*68px/.test(card),
    'and the card must be tall enough for menu + handle at their minimums');
  // The leading-edge reservation belonged to the old strip and must be gone, or the
  // card keeps a 48px blank margin on the wrong side.
  assert.ok(!/padding-inline-start/.test(card),
    'no leftover reservation on the leading edge');
});

test('the menu button is pinned, not floated, on a touch pointer', () => {
  // The card gets trailing padding to clear the column; a float:inline-end menu
  // would be pushed inward by that padding and no longer line up over the handle.
  const menu = rule(css, 'body.mobile-mode .minicard .minicard-details-menu-with-handle {');
  assert.ok(/position:\s*absolute/.test(menu), 'pinned to the corner');
  assert.ok(/float:\s*none/.test(menu), 'and its float explicitly cleared');
  // Same width as the handle, so the two line up as one column.
  const handle = rule(css, 'body.mobile-mode .minicard .handle {');
  const w = s => /width:\s*(\d+)px/.exec(s)[1];
  assert.strictEqual(w(menu), w(handle), 'menu and handle are the same width');
});

test('Desktop Mode keeps the compact handle (negative)', () => {
  const mobileStart = css.indexOf('body.mobile-mode .minicard .minicard-details-menu-with-handle {');
  const base = css.slice(0, mobileStart);
  assert.ok(!/padding-inline-end:\s*44px/.test(base), 'Desktop Mode gets no reserved column');
  assert.ok(!/min-height:\s*68px/.test(base), 'and is not forced taller');
  assert.ok(!/@media\s*\(pointer:\s*coarse\)/.test(css),
    'pointer type must not make a second answer to the explicit mode toggle');
});

console.log(`\nminicardDragHandle: ${passed} tests passed`);
