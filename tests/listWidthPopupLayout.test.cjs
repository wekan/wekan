'use strict';

// The "Set width" popup (setListWidthPopup, client/components/lists/listHeader.jade):
// "Auto list width" and "Same width for all lists" are two separate `a`
// toggles with no display rule of their own, so the browser default
// (inline) put them side by side on one crowded line instead of stacked
// rows like the rest of the popup. Run: node tests/listWidthPopupLayout.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('listWidthPopupLayout:');

const jade = read('client/components/lists/listHeader.jade');
const css = read('client/components/lists/list.css');

test('"Same width for all lists" still comes after "Auto list width" in the markup', () => {
  const popup = jade.slice(jade.indexOf('template(name="setListWidthPopup")'));
  const autoAt = popup.indexOf('js-toggle-auto-width');
  const fixedAt = popup.indexOf('js-toggle-fixed-list-width');
  assert.ok(autoAt !== -1 && fixedAt !== -1 && autoAt < fixedAt,
    'auto-width toggle before the same-width-for-all-lists toggle');
});

test('both toggles are block-level, so each is its own row', () => {
  const rule = css.slice(css.indexOf('#js-list-width-edit .js-toggle-auto-width'));
  const block = rule.slice(0, rule.indexOf('}'));
  assert.match(block, /\.js-toggle-auto-width/);
  assert.match(block, /\.js-toggle-fixed-list-width/);
  assert.match(block, /display:\s*block/,
    'no longer the default inline, which put both on one line');
});

console.log(`\nlistWidthPopupLayout: ${passed} tests passed`);
