'use strict';

// Board Table view's toolbar (search input, Search button, pagination
// buttons, the two toggle buttons) is one flex row with align-items: center
// (.table-view-controls) - but a flex child never shrinks below its own
// content's minimum height no matter what the container measures, so the
// Search button's bold label pushed it visibly taller/lower than the search
// input beside it (.tools/button-center.png). Every control now shares one
// explicit border-box height, so there is nothing left for align-items:
// center to fail to center. Run: node tests/tableViewControlsAlignment.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tableViewControlsAlignment:');

const css = read('client/components/boards/tableView.css');

function ruleFor(selector) {
  const at = css.indexOf(selector);
  assert.ok(at !== -1, `${selector} rule exists`);
  return css.slice(at, css.indexOf('}', at));
}

const ROW_HEIGHT = '34px';

const CONTROLS = [
  '.table-view-search-box input {',
  '.table-view-search-box button {',
  '.table-view-pagination button {',
];

test('the row is a flex container centering its children', () => {
  const row = ruleFor('.table-view-controls {');
  assert.match(row, /display:\s*flex/);
  assert.match(row, /align-items:\s*center/);
});

CONTROLS.forEach(selector => {
  test(`${selector.replace(' {', '')} has the row's exact height, in border-box`, () => {
    const rule = ruleFor(selector);
    assert.match(rule, /box-sizing:\s*border-box/,
      'without border-box, padding/border would add to the height and overflow it again');
    assert.match(rule, new RegExp(`height:\\s*${ROW_HEIGHT}`));
  });
});

test('the two toggle buttons share the same height too', () => {
  const rule = ruleFor('.table-view-controls .js-table-view-toggle-card-title-wrap,');
  assert.match(rule, /box-sizing:\s*border-box/);
  assert.match(rule, new RegExp(`height:\\s*${ROW_HEIGHT}`));
});

test('every control pins line-height so its own font cannot demand more than the fixed height (negative)', () => {
  // The exact bug this fixes: a flex item's minimum height is at least its
  // content's minimum size, and a button's default line-height can exceed
  // the box's own declared height - line-height: 1 removes that margin.
  [
    '.table-view-search-box button {',
    '.table-view-pagination button {',
    '.table-view-controls .js-table-view-toggle-card-title-wrap,',
  ].forEach(selector => {
    const rule = ruleFor(selector);
    assert.match(rule, /line-height:\s*1\b/, `${selector} sets line-height: 1`);
  });
});

console.log(`\ntableViewControlsAlignment: ${passed} tests passed`);
