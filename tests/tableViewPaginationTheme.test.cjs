'use strict';

// Board Table view: the pagination buttons (prev/next page) were plain white
// with a grey border, unlike the blue "Search" button right next to them in
// the same control row (.tools/table-view screenshots) - the two read as
// different UI families rather than one toolbar.
// Run: node tests/tableViewPaginationTheme.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('tableViewPaginationTheme:');

const css = read('client/components/boards/tableView.css');

function ruleFor(selector) {
  const at = css.indexOf(selector);
  assert.ok(at !== -1, `${selector} rule exists`);
  return css.slice(at, css.indexOf('}', at));
}

test('the pagination buttons use the same blue as the Search button', () => {
  const search = ruleFor('.table-view-search-box button {');
  const pagination = ruleFor('.table-view-pagination button {');
  assert.match(search, /background:\s*#01628c/);
  assert.match(pagination, /background:\s*#01628c/,
    'the prev/next buttons must share the Search button\'s background color');
  assert.match(pagination, /color:\s*#fff/, 'and white icon/text on top of it');
});

test('the pagination buttons hover the same shade the Search button hovers to', () => {
  const searchHover = ruleFor('.table-view-search-box button:hover {');
  const paginationHover = ruleFor('.table-view-pagination button:hover {');
  assert.match(searchHover, /background:\s*#005377/);
  assert.match(paginationHover, /background:\s*#005377/);
});

test('a disabled pagination button is still dimmed, not just recolored', () => {
  const disabled = ruleFor('.table-view-pagination button.disabled {');
  assert.match(disabled, /opacity:\s*0\.5/);
  assert.match(disabled, /pointer-events:\s*none/);
});

console.log(`\ntableViewPaginationTheme: ${passed} tests passed`);
