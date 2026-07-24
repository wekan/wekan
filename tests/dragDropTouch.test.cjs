'use strict';

// Source guards for the touch -> HTML5 drag-and-drop bridge
// (client/lib/dragDropTouch.js). The behaviour is browser/touch and cannot run
// in plain Node, so these pin the properties that make it correct and safe to
// coexist with the existing touch scrolling.
//
// Run: node tests/dragDropTouch.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'lib', 'dragDropTouch.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dragDropTouch:');

test('it dispatches the full set of real, bubbling DnD events', () => {
  for (const type of ['dragstart', 'dragenter', 'dragover', 'dragleave', 'drop', 'dragend']) {
    assert.ok(src.includes(`'${type}'`), `must dispatch ${type}`);
  }
  assert.ok(/new Event\(type, \{ bubbles: true, cancelable: true \}\)/.test(src),
    'events must bubble so delegated handlers fire, and be cancelable');
  assert.ok(/Object\.defineProperty\(ev, 'dataTransfer'/.test(src),
    'each event carries a dataTransfer shim');
});

test('the dataTransfer shim supports get/setData used by the handlers', () => {
  assert.ok(/setData\(type, val\)/.test(src) && /getData\(type\)/.test(src));
});

test('a long press is required, so a swipe still scrolls', () => {
  assert.ok(/LONG_PRESS_MS/.test(src), 'has a long-press threshold');
  assert.ok(/moved > MOVE_CANCEL_PX/.test(src),
    'moving before the hold completes cancels the drag (it is a scroll)');
});

test('it only preventDefaults once a drag has actually started (coexists with scroll)', () => {
  // In onTouchMove, preventDefault is inside the `if (drag)` branch and the
  // just-armed start - never on a plain pre-drag move.
  assert.ok(/if \(drag\) \{[\s\S]*?e\.preventDefault\(\)/.test(src),
    'preventDefault while a drag is in progress');
  assert.ok(!/if \(!pending\) return;[\s\S]{0,80}e\.preventDefault/.test(src),
    'must not preventDefault a plain pre-drag (scroll) move');
});

test('setDragImage is honoured, else the ghost is centred on the finger', () => {
  assert.ok(/setDragImage\(img, x, y\)/.test(src), 'shim captures setDragImage');
  assert.ok(/spec \? spec\.x : rect\.width \/ 2/.test(src),
    'centres the ghost when no explicit drag image was set');
});

test('it fires a mousedown first so the press-location handlers see the target', () => {
  assert.ok(/fireDnD\('mousedown', pending\.startTouchTarget/.test(src),
    'the board reorder handle gate reads mousedown - it must fire from touch too');
});

test('a cancelled dragstart aborts the drag (handle gate, etc.)', () => {
  assert.ok(/startEv\.defaultPrevented/.test(src),
    'if a handler cancels dragstart, no drag proceeds');
});

test('it leaves jQuery-UI sortables and form fields alone', () => {
  assert.ok(/ui-sortable/.test(src) && /input, select, textarea/.test(src),
    'excludes sortables (touch-punch handles them) and form fields');
});

test('listeners attach once, and touchmove is non-passive so it can preventDefault', () => {
  assert.ok(/__wekanDragDropTouch/.test(src), 'idempotent attach guard');
  assert.ok(/addEventListener\('touchmove', onTouchMove, \{ passive: false \}\)/.test(src),
    'touchmove must be non-passive to block scrolling mid-drag');
});

console.log(`\n${passed} tests passed`);
