'use strict';

// The Change Language popup should show languages in multiple columns when there is
// browser width (so as many as possible are visible), collapsing to one column when
// narrow. Guards the responsive width + auto-filling grid.
//
// Run: node tests/changeLanguageColumns.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const css = fs.readFileSync(
  path.join(path.resolve(__dirname, '..'), 'client/components/main/popup.css'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
function block(sel) {
  const i = css.indexOf(sel + ' {');
  assert.ok(i !== -1, `missing rule: ${sel}`);
  return css.slice(i, css.indexOf('}', i));
}

test('language popup is responsively wide (not a fixed 450px)', () => {
  const p = block(".pop-over[data-popup='changeLanguagePopup']");
  assert.ok(/width:\s*min\(90vw,\s*1100px\)/.test(p), 'responsive width up to 1100px');
  assert.ok(!/max-width:\s*450px/.test(p), 'no longer capped at 450px');
});

test('language list is an auto-filling multi-column grid', () => {
  const list = block(".pop-over[data-popup='changeLanguagePopup'] .pop-over-list");
  assert.ok(/display:\s*grid/.test(list), 'grid layout');
  assert.ok(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(170px,\s*1fr\)\)/.test(list),
    'auto-fill columns (many when wide, one when narrow)');
});

console.log(`\nAll ${passed} change-language-columns tests passed`);
