'use strict';

// Unit tests for the drag-handle visibility rule (#6521).
//
// The bug: "Show desktop drag handles" did nothing on a touch screen. The rule
// was `isTouchScreen() || preference`, so on touch the OR was already true and
// the toggle could never hide the handles. This matters more than a cosmetic
// setting, because handles change what a DRAG MEANS: with handles on, the card
// body pans the board (dragscroll) and only the handle moves the card.
//
// Run: node tests/dragHandles.test.cjs

const assert = require('assert');
const {
  resolveShowDragHandles,
  readDragHandlesPreference,
} = require('../models/lib/dragHandles.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dragHandles:');

test('never chosen: a touch screen gets handles, a mouse does not', () => {
  assert.strictEqual(resolveShowDragHandles(null, true), true);
  assert.strictEqual(resolveShowDragHandles(null, false), false);
});

// The regression itself.
test('an explicit OFF hides the handles ON A TOUCH SCREEN (the reported bug)', () => {
  assert.strictEqual(resolveShowDragHandles(false, true), false);
});

test('an explicit ON shows the handles on a desktop', () => {
  assert.strictEqual(resolveShowDragHandles(true, false), true);
});

test('an explicit choice always beats the device default', () => {
  // Both directions, so the device can never override the user again.
  assert.strictEqual(resolveShowDragHandles(true, false), true);
  assert.strictEqual(resolveShowDragHandles(false, true), false);
});

test('the touch default only applies when nothing was chosen (negative)', () => {
  // undefined is not a choice - it must behave exactly like null.
  assert.strictEqual(resolveShowDragHandles(undefined, true), true);
  assert.strictEqual(resolveShowDragHandles(undefined, false), false);
});

test('a non-boolean touch flag is coerced, never leaks through', () => {
  assert.strictEqual(resolveShowDragHandles(null, 1), true);
  assert.strictEqual(resolveShowDragHandles(null, 0), false);
  assert.strictEqual(resolveShowDragHandles(null, undefined), false);
});

test('reads the three states from a user profile value', () => {
  assert.strictEqual(readDragHandlesPreference(true), true);
  assert.strictEqual(readDragHandlesPreference(false), false);
  assert.strictEqual(readDragHandlesPreference(undefined), null);
});

test('reads the three states from localStorage strings', () => {
  assert.strictEqual(readDragHandlesPreference('true'), true);
  // 'false' must be a real OFF, not "absent" - this is what makes the toggle
  // work for a logged-out user on a touch screen.
  assert.strictEqual(readDragHandlesPreference('false'), false);
  assert.strictEqual(readDragHandlesPreference(null), null);
});

test('anything unrecognized falls back to the device default (negative)', () => {
  for (const junk of ['', 'yes', 'no', '1', '0', 0, 1, {}, []]) {
    assert.strictEqual(
      readDragHandlesPreference(junk), null,
      `expected ${JSON.stringify(junk)} to read as "never chosen"`,
    );
  }
});

test('a corrupt stored value cannot flip a touch device to no-handles', () => {
  // The end-to-end property: junk in storage still leaves a finger able to drag.
  assert.strictEqual(
    resolveShowDragHandles(readDragHandlesPreference('garbage'), true), true);
});

console.log(`\n${passed} tests passed`);
