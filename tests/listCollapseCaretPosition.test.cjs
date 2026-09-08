'use strict';

// #6675: an expanded list's collapse caret rendered as a static sibling
// BEFORE the title wrapper - which put it on the row with the card count and
// the +/menu icons (normal document flow), nowhere visually near either the
// title (its own row, below) or the hamburger menu (floated to the far end
// of the SAME row). Nesting it inside the title heading was tried first, but
// reverted: that heading carries js-open-inlined-form/is-editable, so a
// click on the caret bubbled up and opened the rename form instead of
// collapsing the list (see .tools/list1's screenshots). The fix that stuck:
// keep the caret a sibling BEFORE the title, same as a collapsed list
// already had it, and float it to the START of the header's top line - the
// same line the hamburger menu floats to the END of - so it lands level
// with that menu, at the header's top corner.
// Run: node tests/listCollapseCaretPosition.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('listCollapseCaretPosition:');

const jade = read('client/components/lists/listHeader.jade');
const css = read('client/components/lists/list.css');

// The template has three `h2.list-header-name` headings, in order: the
// mini-screen one, the collapsed desktop one, then the expanded desktop one.
// `h2.list-header-name(` - the trailing paren excludes this file's own
// prose comment about h2.list-header-name (no paren after it there).
const firstH2 = jade.indexOf('h2.list-header-name(');
const secondH2 = jade.indexOf('h2.list-header-name(', firstH2 + 1);
const thirdH2 = jade.indexOf('h2.list-header-name(', secondH2 + 1);
assert.ok(firstH2 > -1 && secondH2 > -1 && thirdH2 > -1,
  'listHeader.jade has all three title headings this test expects');
const collapsedCaretAt = jade.lastIndexOf('a.list-collapse-indicator', secondH2);
const expandedCaretAt = jade.lastIndexOf('a.list-collapse-indicator', thirdH2);
assert.ok(collapsedCaretAt !== -1 && collapsedCaretAt < secondH2,
  'the collapsed branch has its own caret before its title');
assert.ok(expandedCaretAt !== -1 && expandedCaretAt < thirdH2 && expandedCaretAt > secondH2,
  'the expanded branch has its own caret before its title');

test('neither caret is nested inside its title heading (negative)', () => {
  // Both h2.list-header-name elements conditionally carry
  // js-open-inlined-form/is-editable (click-to-rename); a caret inside
  // either one would have a rename click bubble past it.
  [[collapsedCaretAt, secondH2], [expandedCaretAt, thirdH2]].forEach(([caretAt, h2At]) => {
    assert.ok(caretAt < h2At, 'the caret comes before its h2 in the markup, not inside it');
  });
});

test('a collapsed list keeps its caret OUTSIDE .list-rotated (negative)', () => {
  // .list-rotated is position:relative (for its 90deg text rotation) - the
  // collapsed caret must stay a sibling before it, or its position:absolute
  // (below) would resolve against that small rotated box instead of the
  // whole .list-header.
  const rotatedAt = jade.indexOf('div.list-rotated');
  assert.ok(rotatedAt !== -1 && collapsedCaretAt < rotatedAt,
    'the collapsed caret still comes before div.list-rotated, not inside it');
});

test('the collapsed caret is still absolutely positioned against .list-header', () => {
  // Anchored at the START of a line: `.list.list-collapsed .list-header
  // .js-collapse {` (a different, unrelated rule) contains this same
  // selector text as a SUBSTRING and would otherwise match first.
  const at = css.search(/^\.list-header \.js-collapse \{/m);
  assert.ok(at !== -1, 'the base .list-header .js-collapse rule exists');
  const rule = css.slice(at);
  const block = rule.slice(0, rule.indexOf('}'));
  assert.match(block, /position:\s*absolute\s*!important/);
  assert.match(block, /inset-inline-start:\s*10px\s*!important/,
    'a logical inset, so it is already the correct side under RTL');
});

test('the expanded caret floats to the START of the top line, like the menu floats to the END', () => {
  const at = css.indexOf('.list:not(.list-collapsed):not(.mobile-view) .list-header .js-collapse');
  assert.ok(at !== -1, 'the expanded-caret rule exists');
  const rule = css.slice(at);
  const block = rule.slice(0, rule.indexOf('}'));
  assert.match(block, /float:\s*inline-start/,
    'a logical float, so it lands on the correct side under RTL too');

  const menuAt = css.search(/^\.list-header \.list-header-menu \{/m);
  assert.ok(menuAt !== -1, 'the hamburger-menu rule exists');
  const menuBlock = css.slice(menuAt, css.indexOf('}', menuAt));
  assert.match(menuBlock, /float:\s*inline-end/,
    'the two floats share one line from opposite logical sides');
});

console.log(`\nlistCollapseCaretPosition: ${passed} tests passed`);
