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

// ── where the handle appears, and what a drag starts from ────────────────────
//
// The rule above decides IF handles are shown; these pin the places that have
// to obey it, and what a drag means when they are off.

const fs = require('fs');
const path = require('path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('a workspace row obeys the toggle, and its icon drags when the handle is off', () => {
  // xet7: "1st top header toggle drag handles should toggle them at left side
  // of each workspace at All Boards page left menu. if there is no drag handle,
  // reordering workspaces is from icon of workspace."
  const jade = read('client/components/boards/boardsList.jade');
  const tree = jade.slice(jade.indexOf('template(name="workspaceTree")'));
  const node = tree.slice(0, tree.indexOf('\n\n//-'));

  // The handle is drawn only when the toggle says so - the same helper the
  // board tiles in this file use, so the two cannot drift apart.
  assert.ok(/if isTouchScreenOrShowDesktopDragHandles\n\s+span\.workspace-drag-handle/.test(node),
    'the handle is behind the toggle');
  assert.ok(/span\.workspace-drag-handle[^\n]*draggable="true"/.test(node),
    'and with the handle shown, the handle is what drags');

  // Handles OFF: the workspace ICON is the drag source, and it says so with
  // `draggable` rather than a second class that could fall out of step.
  assert.ok(
    /span\.workspace-icon\(draggable="\{\{#if isTouchScreenOrShowDesktopDragHandles\}\}false\{\{else\}\}true\{\{\/if\}\}"\)/
      .test(node),
    'the icon drags exactly when the handle is not there');

  // NOT the whole row. A workspace row is a row you click - it is how a
  // workspace is opened - and a draggable row starts a drag on the way to a
  // click.
  assert.ok(!/li\.workspace-node\([^)]*draggable="true"/.test(node),
    'the row itself must not be draggable');

  // The handler stays on the row, which works because dragstart bubbles from
  // whichever child started it.
  const js = read('client/components/boards/boardsList.js');
  assert.ok(/'dragstart \.workspace-node'/.test(js),
    'the row still handles the drag it did before');

  // And the cursor follows the same attribute, so there is no third source of
  // truth for "is this the handle right now".
  const css = read('client/components/boards/boardsList.css');
  assert.ok(/\.workspace-node \.workspace-icon\[draggable="true"\] \{\n  cursor: grab;/.test(css),
    'a draggable icon shows the grab cursor');
  assert.ok(/\.workspace-drag-handle \{[^}]*cursor: grab;/.test(css),
    'the same cursor the handle has');
});

console.log(`\n${passed} tests passed`);
