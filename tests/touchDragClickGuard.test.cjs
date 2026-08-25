'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  runTouchEndWithoutPostDragClick,
} = require('../models/lib/touchDragClickGuard');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

test('a completed fast drag suppresses the touch bridge click', () => {
  const target = new EventTarget();
  let navigations = 0;

  runTouchEndWithoutPostDragClick(true, target, () => {
    const allowed = target.dispatchEvent(new Event('click', { cancelable: true }));
    if (allowed) navigations++;
  });

  assert.strictEqual(navigations, 0);
});

test('a normal tap keeps its click', () => {
  const target = new EventTarget();
  let navigations = 0;

  runTouchEndWithoutPostDragClick(false, target, () => {
    const allowed = target.dispatchEvent(new Event('click', { cancelable: true }));
    if (allowed) navigations++;
  });

  assert.strictEqual(navigations, 1);
});

test('an independent click after a drag is not suppressed', () => {
  const target = new EventTarget();
  let navigations = 0;

  runTouchEndWithoutPostDragClick(true, target, () => {
    const allowed = target.dispatchEvent(new Event('click', { cancelable: true }));
    if (allowed) navigations++;
  });
  const allowed = target.dispatchEvent(new Event('click', { cancelable: true }));
  if (allowed) navigations++;

  assert.strictEqual(navigations, 1);
});

test('the touch-punch adapter guards its click while a sortable is active', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../client/lib/jquery-ui.js'),
    'utf8',
  );
  assert.match(source, /const wasDragging = this\._mouseStarted === true/);
  assert.match(source, /runTouchEndWithoutPostDragClick\(/);
  assert.match(source, /touchEnd\.call\(this, event\)/);
});

console.log(`\n${passed} passing`);
