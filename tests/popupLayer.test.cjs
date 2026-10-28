'use strict';

// A popup LAYER (client/lib/popup.js `Popup.open(name, { layer: true })`): a
// menu opened from inside a popup - Card Settings' hamburgers - drawn on top
// of that popup next to its button, the popup still visible under it. Before,
// a hamburger slid into the popup's place and Card Settings disappeared.
// Run: node tests/popupLayer.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { popupLayerPosition, popupLayerStyle } = require('../models/lib/popupLayerPosition.js');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('popupLayer:');

const popover = { top: 100, bottom: 900, left: 200, right: 800 };

test('below a button in the right half, its right edge at the button\'s', () => {
  const pos = popupLayerPosition({ opener: { top: 150, bottom: 170, left: 760, right: 780 }, popover });
  assert.deepStrictEqual(pos, { vertical: 'top', y: 72, horizontal: 'right', x: 20, maxHeight: 720, maxWidth: 572 });
  assert.strictEqual(popupLayerStyle(pos), 'top:72px; right:20px; max-height:720px; max-width:572px;');
});

// The + under Custom Fields is at the left: anchored by its right edge, the
// create form ran out of the popup's left side and its Save was unreachable.
test('a button in the left half: the layer\'s left edge at the button\'s, opening toward the middle', () => {
  const pos = popupLayerPosition({ opener: { top: 150, bottom: 170, left: 240, right: 260 }, popover });
  assert.strictEqual(pos.horizontal, 'left');
  assert.strictEqual(pos.x, 40);
  assert.strictEqual(pos.maxWidth, 800 - 240 - 8);
});

test('above its button when there is more room there', () => {
  const pos = popupLayerPosition({ opener: { top: 820, bottom: 840, left: 760, right: 780 }, popover });
  assert.strictEqual(pos.vertical, 'bottom');
  assert.strictEqual(pos.y, 900 - 820 + 2);
  assert.strictEqual(pos.maxHeight, 820 - 100 - 2 - 8);
});

test('below while there is room for a menu, even with more room above', () => {
  const pos = popupLayerPosition({ opener: { top: 600, bottom: 620, left: 760, right: 780 }, popover });
  assert.strictEqual(pos.vertical, 'top');
  assert.strictEqual(pos.maxHeight, 900 - 620 - 2 - 8);
});

test('physical, so the same right to left: a hamburger on the left opens rightward', () => {
  const pos = popupLayerPosition({ opener: { top: 150, bottom: 170, left: 220, right: 240 }, popover });
  assert.strictEqual(pos.horizontal, 'left');
  assert.strictEqual(pos.x, 20);
});

test('negative: never outside the popup', () => {
  const pos = popupLayerPosition({ opener: { top: 150, bottom: 170, left: 790, right: 820 }, popover });
  assert.strictEqual(pos.x, 0);
  // Its width is capped to the room on its side.
  assert.ok(pos.maxWidth <= 800 - 200);
  assert.strictEqual(popupLayerStyle(null), '');
});

test('Popup keeps the popup under a layer, and back() closes the layer alone', () => {
  const js = read('client/lib/popup.js');
  assert.match(js, /const asLayer = Boolean\(openOptions\.layer\) && self\.isOpen\(\) && clickFromPopup\(evt\);/);
  // One layer at a time; its own button closes it.
  assert.match(js, /if \(top && top\.layer\) \{\n\s+\/\/[^\n]*\n\s+\/\/[^\n]*\n\s+self\._stack\.pop\(\);/);
  assert.match(js, /if \(top\.openerElement === evt\.currentTarget\) \{/);
  // Drawn: the popup under the layer, with the layer; depth counts sliding popups.
  assert.match(js, /return \{ \.\.\.this\._stack\[this\._stack\.length - 2\], depth, stack, layer: top \};/);
  assert.match(js, /const stack = this\._stack\.filter\(entry => !entry\.layer\);/);
  // A layer does not scroll the popup under it.
  assert.match(js, /if \(\$contentWrapper\.length > 0 && !asLayer\) \{/);
  const tpl = read('client/components/main/popup.tpl.jade');
  assert.match(tpl, /if layer\n\s+\.popup-layer\.js-popup-layer\(data-popup="\{\{layer\.popupName\}\}"/);
  // Negative: the layer is outside the scrolling content, so it stays by its button.
  assert.ok(tpl.indexOf('.popup-layer.js-popup-layer') > tpl.indexOf('.clearfix'));
  const events = read('client/components/main/popup.js');
  assert.match(events, /'mousedown \.content-wrapper'\(evt\) \{/);
});

test('every hamburger and form of Card Settings opens as a layer', () => {
  const js = read('client/components/sidebar/sidebar.js');
  for (const name of ['cardSettingsSection', 'cardSettingsItem', 'editCustomField', 'createCustomField']) {
    const calls = [...js.matchAll(new RegExp(`Popup\\.open\\('${name}'[^\\n]*`, 'g'))].map(m => m[0]);
    assert.ok(calls.length, name);
    for (const call of calls) assert.match(call, /layer: true/, call);
  }
  assert.match(js, /Popup\.open\(action\.popup, \{ layer: true \}\)\(evt\);/);
});

console.log(`popupLayer: ${passed} passed`);
