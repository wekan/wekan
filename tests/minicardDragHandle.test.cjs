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

// The rules that only apply to a touch pointer.
const coarse = (() => {
  const at = css.indexOf('@media (pointer: coarse)');
  assert.ok(at > -1, 'the coarse-pointer block must exist');
  // Balanced-brace scan: the block contains nested rules.
  let depth = 0, i = css.indexOf('{', at);
  const start = i;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}' && --depth === 0) break;
  }
  return css.slice(start, i);
})();

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
  // Unchanged behaviour, asserted so the two placements cannot drift apart.
  const base = rule(css.slice(0, css.indexOf('@media (pointer: coarse)')), '.minicard .handle {');
  assert.ok(/top:\s*28px/.test(base), 'below the menu button, not level with it');
  assert.ok(/inset-inline-end/.test(base), 'on the trailing edge, mirrored in RTL');
});

test('on a touch pointer the handle is below the menu, same edge', () => {
  const handle = rule(coarse, '.minicard .handle {');
  const menu = rule(coarse, '.minicard .minicard-details-menu-with-handle {');
  // Menu at the top of the trailing edge...
  assert.ok(/top:\s*0/.test(menu), 'the menu button is at the top');
  assert.ok(/inset-inline-end:\s*0/.test(menu), 'on the trailing edge');
  // ...handle directly beneath it, on the same edge.
  assert.ok(/top:\s*32px/.test(handle), 'the handle starts where the menu button ends');
  assert.ok(/inset-inline-end:\s*0/.test(handle), 'on the same edge as the menu');
  assert.ok(/inset-inline-start:\s*auto/.test(handle),
    'and NOT on the leading edge - that is the placement being replaced');
  // Both are logical properties, so the column mirrors in RTL rather than being
  // stranded on the left of an Arabic or Hebrew board.
  assert.ok(!/\b(left|right):/.test(handle + menu),
    'no physical left/right - the column must mirror in RTL');
});

test('the touch handle has no grey button background', () => {
  const handle = rule(coarse, '.minicard .handle {');
  assert.ok(/background:\s*transparent\s*!important/.test(handle),
    'only the drag icon is visible on the minicard');
  assert.ok(!/background(?:-color)?:\s*(?:#(?:ccc|ddd|eee)|rgba?\()/i.test(handle),
    'no grey or tinted background may turn the handle into a separate button');
  assert.ok(/border:\s*0/.test(handle), 'no border draws a box around the target');
  assert.ok(/box-shadow:\s*none/.test(handle), 'no shadow draws a grey layer below it');
});

test('the arrow glyph is visually aligned below the menu icon', () => {
  const icon = rule(coarse, '.minicard .handle .fa {');
  assert.ok(/position:\s*relative/.test(icon), 'the glyph can be aligned independently');
  assert.ok(/inset-inline-end:\s*6px/.test(icon),
    'the asymmetric arrow is shifted inward below the menu bars');
  assert.ok(!/\b(left|right):/.test(icon), 'the correction mirrors in RTL');
});

test('the touch handle is still a finger-sized target (#6521)', () => {
  const handle = rule(coarse, '.minicard .handle {');
  assert.ok(/width:\s*44px/.test(handle), 'wide enough for a finger');
  // It runs from under the menu to the bottom of the card, so a tall card gives a
  // tall target, with a floor for a card that holds nothing but a title.
  assert.ok(/bottom:\s*0/.test(handle), 'stretches to the bottom of the card');
  assert.ok(/min-height:\s*36px/.test(handle), 'with a minimum on a short card');
  assert.ok(/height:\s*auto/.test(handle),
    'height must be released, or the inherited fixed height wins over top/bottom');
});

test('the card reserves the column and is tall enough to hold it', () => {
  const card = rule(coarse, '.minicard.minicard-with-handle {');
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
  const menu = rule(coarse, '.minicard .minicard-details-menu-with-handle {');
  assert.ok(/position:\s*absolute/.test(menu), 'pinned to the corner');
  assert.ok(/float:\s*none/.test(menu), 'and its float explicitly cleared');
  // Same width as the handle, so the two line up as one column.
  const handle = rule(coarse, '.minicard .handle {');
  const w = s => /width:\s*(\d+)px/.exec(s)[1];
  assert.strictEqual(w(menu), w(handle), 'menu and handle are the same width');
});

test('a mouse keeps the compact handle (negative)', () => {
  // `pointer: coarse` does not match a mouse, so none of the above applies there.
  const base = css.slice(0, css.indexOf('@media (pointer: coarse)'));
  assert.ok(!/padding-inline-end:\s*44px/.test(base),
    'a mouse card gets no reserved column');
  assert.ok(!/min-height:\s*68px/.test(base), 'and is not forced taller');
});

console.log(`\nminicardDragHandle: ${passed} tests passed`);
