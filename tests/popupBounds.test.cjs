'use strict';

// A movable popup that grows after it was placed - the card's Drawing popup,
// opened from the card's menu at the right of the window, at
// min(820px, 90vw) - is moved so that all of it is inside the window, by the
// rule a drag keeps it there (client/lib/popupBounds.js). And a maximized
// drawing is no longer squeezed into an 800 x 500 shape by popup.css.
// Run: node tests/popupBounds.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { keptInside, MARGIN } = require('../client/lib/popupBounds');

const root = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('a popup cut off at the right is moved back inside, 12px from the edge', () => {
  // The screenshot's case: a 820px wide Drawing popup placed at x=738 of 1280.
  assert.deepStrictEqual(keptInside({ left: 738, top: 100, width: 820, height: 600 }, 1280, 720),
    { left: 1280 - 820 - MARGIN, top: 100 });
});

test('a popup cut off at the bottom, or at the top-left, is moved too', () => {
  assert.deepStrictEqual(keptInside({ left: 100, top: 400, width: 300, height: 500 }, 1280, 720),
    { left: 100, top: 720 - 500 - MARGIN });
  assert.deepStrictEqual(keptInside({ left: -40, top: -10, width: 300, height: 200 }, 1280, 720),
    { left: MARGIN, top: MARGIN });
});

test('negative: a popup that fits stays where it is', () => {
  assert.strictEqual(keptInside({ left: 300, top: 100, width: 400, height: 300 }, 1280, 720), null);
  assert.strictEqual(keptInside({ left: 300, top: 100, width: 0, height: 0 }, 1280, 720), null, 'not laid out yet');
});

test('popup.js keeps movable popups inside as they grow, and not when maximized', () => {
  const src = fs.readFileSync(path.join(root, 'client/components/main/popup.js'), 'utf8');
  assert.match(src, /this\._boundsObserver = new ResizeObserver\(/);
  // #6839: and any popup the user dragged, now that every popup moves.
  assert.match(src, /if \(!\(MOVABLE_POPUPS\.has\(element\.dataset\.popup\) \|\| element\.dataset\.userMoved\)\n\s+\|\| element\.classList\.contains\('pop-over--maximized'\)\) return;/);
  assert.match(src, /this\._boundsObserver\?\.disconnect\(\);/);
});

test('the Drawing popup is as wide as its drawing, not the default 380px that clipped it', () => {
  const css = fs.readFileSync(path.join(root, 'client/components/main/popup.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = css.match(/\.pop-over\[data-popup='cardDrawingPopup'\]\s*\{([^}]*)\}/);
  assert.ok(rule, 'popup.css has a width rule for the Drawing popup');
  assert.match(rule[1], /width:\s*min\(860px,\s*calc\(100vw - 20px\)\)/);
  // Negative: !important would beat the maximized `width: auto !important`.
  assert.doesNotMatch(rule[1], /!important/);
});

test('negative: a maximized drawing is not squeezed into an 800 x 500 shape', () => {
  const css = fs.readFileSync(path.join(root, 'client/components/main/popup.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /pop-over--maximized \.card-drawing-surface/);
  assert.doesNotMatch(css, /aspect-ratio:\s*8\s*\/\s*5/);
});

console.log(`\npopupBounds: ${passed} passed`);
