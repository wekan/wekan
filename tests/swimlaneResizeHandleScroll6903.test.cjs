'use strict';
// #6903: the swimlane-height resize line stopped short of the right edge of a
// swimlane whose row of lists was scrolled right.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

function scroller(scrollLeft = 0) {
  const listeners = [];
  return {
    scrollLeft,
    listeners,
    addEventListener(type, fn, options) { listeners.push({ type, fn, options }); },
    scrollTo(x) { this.scrollLeft = x; for (const l of listeners) if (l.type === 'scroll') l.fn(); },
  };
}

test('the handle is shifted by the row\'s horizontal scroll, in both directions', async () => {
  const { keepResizeHandleInView, resizeHandleTransform } = await import('../client/components/swimlanes/resizeHandleScroll.js');
  const handle = { style: {} };
  const row = scroller(0);
  keepResizeHandleInView(handle, row);
  assert.equal(handle.style.transform, '', 'unscrolled: no shift');
  row.scrollTo(270);
  assert.equal(handle.style.transform, 'translateX(270px)', 'scrolled right: follows the visible part');
  row.scrollTo(0);
  assert.equal(handle.style.transform, '');
  // Right-to-left: scrollLeft is negative, and so is the shift.
  row.scrollTo(-120);
  assert.equal(handle.style.transform, 'translateX(-120px)');
  assert.equal(row.listeners.length, 1);
  assert.equal(row.listeners[0].options.passive, true, 'never blocks scrolling');
  assert.equal(resizeHandleTransform({ scrollLeft: 'x' }), '');
  assert.equal(resizeHandleTransform(null), '');
});

test('negative: no second listener for the same swimlane, nothing for missing elements', async () => {
  const { keepResizeHandleInView } = await import('../client/components/swimlanes/resizeHandleScroll.js');
  const handle = { style: {} };
  const row = scroller(40);
  keepResizeHandleInView(handle, row);
  keepResizeHandleInView(handle, row);
  assert.equal(row.listeners.length, 1, 'a re-run of the initializer does not stack listeners');
  assert.equal(handle.style.transform, 'translateX(40px)', 'an already scrolled row is followed at once');
  assert.doesNotThrow(() => keepResizeHandleInView(null, row)());
  assert.doesNotThrow(() => keepResizeHandleInView(handle, null)());
});

test('the swimlane resize is wired to it, and the handle does not animate its shift', () => {
  const js = read('client/components/swimlanes/swimlanes.js');
  assert.match(js, /import \{ keepResizeHandleInView \} from '\/client\/components\/swimlanes\/resizeHandleScroll';/);
  const init = js.slice(js.indexOf('function initializeSwimlaneResize('), js.indexOf('Template.swimlane.helpers('));
  assert.match(init, /keepResizeHandleInView\(\$resizeHandle\[0\], \$swimlane\[0\]\);/);
  // The handle sits in the swimlane that scrolls horizontally - why it moved.
  const jade = read('client/components/swimlanes/swimlanes.jade');
  assert.match(jade, /\.swimlane\.js-lists\.js-swimlane\.dragscroll[^\n]*\n(?:[^\n]*\n){0,3}\s*\.swimlane-resize-handle\.js-swimlane-resize-handle/);
  const css = read('client/components/swimlanes/swimlanes.css');
  const rule = css.slice(css.indexOf('.swimlane-resize-handle {'), css.indexOf('}', css.indexOf('.swimlane-resize-handle {')));
  assert.match(rule, /position: absolute;/);
  assert.doesNotMatch(rule, /transition: all/, 'an animated transform trails behind the scroll');
  assert.doesNotMatch(rule, /transition:[^;]*transform/);
});
