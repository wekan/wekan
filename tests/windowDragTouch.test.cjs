'use strict';

// The opened card, and every popup, move under a finger as well as a mouse. The card
// was moved by mousedown / mousemove / mouseup only; a finger sends none of them while
// it moves, so on an iPad the page behind scrolled and the card stayed where it was -
// from the collapse caret, the space beside it, the card number, and from the drag
// handle too. Pointer Events carry both, and the drag areas need touch-action: none.
// models/lib/windowDrag.js is the decisions; the wiring is read from the source.
// tests/playwright/specs/card-window-touch-drag.e2e.js drags with a real touch.
//
// Run: node tests/windowDragTouch.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { cardHeaderPress, dragThreshold, passedThreshold, clampWindow } = require('../models/lib/windowDrag');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const none = { onEditable: false, onTitleEditZone: false, onHandle: false, cardHasHandle: false, onControl: false };

test('with drag handles off, the header row moves the window - and a control waits for a real drag', () => {
  // empty space of the row, beside the caret
  assert.deepEqual(cardHeaderPress({ ...none }), { start: true, deferred: false });
  // the collapse caret, the menu, close: a tap still does its job, a drag moves the window
  assert.deepEqual(cardHeaderPress({ ...none, onControl: true }), { start: true, deferred: true });
});

test('the title edits, and an open editor keeps its text selection (negative)', () => {
  assert.deepEqual(cardHeaderPress({ ...none, onTitleEditZone: true }), { start: false, deferred: false });
  assert.deepEqual(cardHeaderPress({ ...none, onEditable: true }), { start: false, deferred: false });
  assert.deepEqual(cardHeaderPress({ ...none, onEditable: true, onControl: true }), { start: false, deferred: false });
});

test('with drag handles on, only the handle moves the window', () => {
  assert.deepEqual(cardHeaderPress({ ...none, onHandle: true, cardHasHandle: true }), { start: true, deferred: false });
  // negative: the header row does not
  assert.deepEqual(cardHeaderPress({ ...none, cardHasHandle: true }), { start: false, deferred: false });
  assert.deepEqual(cardHeaderPress({ ...none, cardHasHandle: true, onControl: true }), { start: false, deferred: false });
});

test('a finger may wobble more than a mouse before a press on a control becomes a drag', () => {
  assert.equal(dragThreshold('touch', false), 0, 'a press that is not on a control moves at once');
  assert.equal(dragThreshold('mouse', true), 4);
  assert.equal(dragThreshold('touch', true), 8);
  assert.equal(dragThreshold('pen', true), 8);
  assert.equal(passedThreshold(3, 3, 8), false, 'a 4 px wobble is a tap');
  assert.equal(passedThreshold(6, 6, 8), true);
  assert.equal(passedThreshold(0, 0, 0), true, 'threshold 0: any move');
});

test('the window cannot be dragged out of reach', () => {
  const viewport = { width: 1000, height: 800 };
  assert.deepEqual(clampWindow(100, 50, 520, viewport), { left: 100, top: 50 }, 'inside: unchanged');
  assert.deepEqual(clampWindow(-2000, -300, 520, viewport), { left: 48 - 520, top: 0 }, 'left of the window: its right strip stays');
  assert.deepEqual(clampWindow(5000, 5000, 520, viewport), { left: 1000 - 48, top: 800 - 48 }, 'right and below: its top-left strip stays');
  // a viewport narrower than the strip does not produce NaN
  const tiny = clampWindow(10, 10, 300, { width: 20, height: 20 });
  assert.ok(Number.isFinite(tiny.left) && Number.isFinite(tiny.top));
});

test('the card window is moved by Pointer Events, and no mouse-only drag is left', () => {
  const js = read('client/components/cards/cardDetails.js');
  assert.match(js, /'pointerdown \.js-card-drag-handle'\(event\)/);
  assert.match(js, /'pointerdown \.js-card-title-drag-handle'\(event\)/);
  assert.match(js, /document\.addEventListener\('pointermove', onMove, \{ passive: false \}\)/);
  assert.match(js, /document\.addEventListener\('pointercancel', onEnd\)/);
  assert.match(js, /require\('\/models\/lib\/windowDrag'\)/);
  // negative: the two mouse-only drag handlers are gone, and no window drag listens for mousemove
  assert.doesNotMatch(js, /'mousedown \.js-card-drag-handle'/);
  assert.doesNotMatch(js, /'mousedown \.js-card-title-drag-handle'/);
  const helper = js.slice(js.indexOf('function beginCardWindowDrag'), js.indexOf('Template.cardDetails.events({'));
  assert.doesNotMatch(helper, /mousemove|mouseup|mousedown/);
  // a drag that began on a control swallows the click that follows it
  assert.match(helper, /addEventListener\('click', swallow, \{ capture: true, once: true \}\)/);
  // the window is clamped into reach, and the user-moved mark is kept (#6465)
  assert.match(helper, /clampWindow\(/);
  assert.match(helper, /markCardDetailsUserMoved\(\$card\)/);
});

test('the drag areas are touch-action: none, the card number is over the title edit zone, popups too', () => {
  const css = read('client/components/cards/cardDetails.css');
  assert.match(css, /body\.desktop-mode \.card-details \.card-details-header,\nbody\.desktop-mode \.card-details \.card-details-header \.card-drag-handle \{\n  touch-action: none;/);
  // the number above the zone (z-index 1)
  assert.match(css, /\.card-details-title-edit-zone \{[^}]*z-index: 1;/);
  assert.match(css, /\.card-details-header \.card-number \{[^}]*position: relative;\n  z-index: 2;/);
  // negative: mobile mode (the full-screen card, which is not moved) is not made unscrollable
  assert.doesNotMatch(css, /body\.mobile-mode \.card-details[^{]*\{[^}]*touch-action: none/);
  const popup = read('client/components/main/popup.css');
  assert.match(popup, /\.pop-over \.header \{\n  \/\*[\s\S]*?\*\/\n  touch-action: none;/);
  assert.match(popup, /\.pop-over \.header \.popup-drag-handle \{\n  touch-action: none;/);
  // popup.js moves a popup with Pointer Events already
  assert.match(read('client/components/main/popup.js'), /'pointerdown \.header'\(evt, tpl\)/);
});
