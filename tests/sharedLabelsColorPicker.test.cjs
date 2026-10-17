'use strict';

// Admin Panel / Settings / Shared labels picks a colour with the board labels'
// own picker - labelColorPicker, the palette swatches and the custom colour
// wheel - instead of a dropdown of colour names, and its swatches have the size
// they have in an opened card's label popup at every window width.
// tests/playwright/specs/shared-labels-color-picker.e2e.js drives it in a browser.
//
// Run: node tests/sharedLabelsColorPicker.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('sharedLabelsColorPicker:');

test('one picker template, used by the board label popup and by Shared labels', () => {
  const labels = read('client/components/cards/labels.jade');
  assert.match(labels, /template\(name="labelColorPicker"\)/);
  assert.match(labels, /template\(name="formLabel"\)[\s\S]*?\+labelColorPicker\(color=color\)/);
  const shared = read('client/components/settings/sharedLabelsSettings.jade');
  assert.match(shared, /\+labelColorPicker\(color=color onChange=colorSink\)/);
  assert.ok(!/select\.js-shared-label-color/.test(shared), 'no dropdown of colour names (negative)');
  assert.ok(!/colorOptions/.test(read('client/components/settings/sharedLabelsSettings.js')));
});

test('a pick reaches the Shared labels row through an object, not a function argument', () => {
  const js = read('client/components/settings/sharedLabelsSettings.js');
  assert.match(js, /colorSink: \{ set: color => change\(tpl, id, 'color', color\) \}/);
  const picker = read('client/components/cards/labels.js');
  assert.match(picker, /typeof onChange\.set === 'function'\) onChange\.set\(color\)/);
});

test('the swatches have the label popup\'s size, not the window\'s (negative: no growth)', () => {
  const css = read('client/components/cards/labels.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const at = css.indexOf('.shared-label-color .palette-colors .palette-color {');
  assert.ok(at !== -1);
  const body = css.slice(at, css.indexOf('}', at));
  for (const rule of [/flex:\s*0 0 auto/, /box-sizing:\s*content-box/, /width:\s*36px/, /height:\s*25px/, /padding:\s*3px 8px/]) {
    assert.match(body, rule);
  }
});

console.log(`\nsharedLabelsColorPicker: ${passed} tests passed`);
