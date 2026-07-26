'use strict';

// All Boards on a phone must FIT the phone.
//
// Two things it did not do, both visible in the same screenshot:
//
// 1. The board titles were laid out two characters per line ("Da"/"ta"). Space
//    for the drag handle - one absolutely-positioned ~26px circle - was reserved
//    three times on the way down: 32px on the `li`, 30px on the tile and 50px on
//    `.details`. On a ~97px phone tile that is more than the tile, so the text
//    was squeezed into whatever was left. It is reserved ONCE now, and not at all
//    when the handle is not rendered (drag handles off).
//
// 2. The page could be dragged sideways: the avatar sat past the right edge and
//    the board list moved with the page. The quick-access bar is nowrap with
//    `overflow: visible` and every item `flex-shrink: 0`, so a row wider than the
//    screen spilled - and visible overflow is scrollable overflow.
//
// Run: node tests/mobileAllBoardsFit.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

const boards = read('client/components/boards/boardsList.css');
const header = read('client/components/main/header.css');
const layouts = read('client/components/main/layouts.css');

// Every rule in the file, including the ones inside a media query (the selector
// is then the last line of the match, after the media prelude).
function rules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
    selectors: m[1].split(',').map(s => s.trim().split('\n').pop().trim()),
    body: m[2],
  }));
}

// The declaration a browser ends up using: the LAST one that names this exact
// selector, since every rule here carries the same specificity for it.
function lastDeclaration(css, selector, prop) {
  let value = null;
  for (const rule of rules(css)) {
    if (!rule.selectors.includes(selector)) continue;
    const decl = new RegExp(`(?<![-\\w])${prop}:\\s*([^;]+);`).exec(rule.body);
    if (decl) value = decl[1].trim();
  }
  return value;
}

console.log('mobileAllBoardsFit:');

test('the handle width is reserved once, not on the list item as well', () => {
  // `li` is the grid cell; the handle lives inside the tile, so the cell has no
  // reason to pad for it. Both spellings (plain and .mobile-view) must agree.
  for (const selector of ['.board-list li', '.board-list.mobile-view li']) {
    const value = lastDeclaration(boards, selector, 'padding-inline-end');
    assert.strictEqual(value, '0',
      `${selector}: a second reserve here narrows the title by its full width`);
  }
});

test('and not a third time on the text container', () => {
  // The mobile tile reserves it on .details; the plain one on the tile's padding.
  // Whichever it is, the two must not stack.
  const details = lastDeclaration(boards, '.board-list .board-list-item .details',
    'padding-inline-end');
  assert.strictEqual(details, '0', 'the tile already keeps its text clear');
  const mobileDetails = lastDeclaration(boards,
    '.board-list.mobile-view .board-list-item .details', 'padding-inline-end');
  assert.ok(/^\d+px$/.test(mobileDetails) && parseInt(mobileDetails, 10) <= 30,
    `the mobile reserve is one handle wide, found ${mobileDetails}`);
  const mobileTile = lastDeclaration(boards,
    '.board-list.mobile-view .board-list-item', 'padding');
  assert.ok(!/\b(2[5-9]|[3-9]\d)px\b/.test(mobileTile || ''),
    `and the mobile tile does not reserve it again: ${mobileTile}`);
});

test('with drag handles OFF, the title gets that width back', () => {
  // The handle is only rendered when handles are on, so a tile without one must
  // not pad for it - neither the tile nor its text container.
  assert.ok(/\.board-list \.board-list-item:not\(:has\(\.board-handle\)\) \.details/
    .test(boards), 'the text container drops the reserve');
  const tile = boards.slice(boards.indexOf(
    '.board-list .board-list-item:not(:has(.board-handle)),'));
  assert.ok(/padding-inline-end: 8px;/.test(tile.slice(0, 400)),
    'and so does the tile itself - it was still padding 30px for nothing');
});

test('the phone board column is a grid that cannot be pushed wider', () => {
  // The tiles live in a 1fr track; a grid item refuses to go below its content
  // width unless it is told it may, which is what let the column overflow.
  assert.ok(/\.boards-right-grid \{[\s\S]*?min-width: 0;/.test(boards),
    'the right column may shrink to its track');
  assert.ok(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/.test(boards),
    'and its two columns may as well');
});

test('the quick-access bar gives way instead of spilling off the phone', () => {
  const at = header.indexOf('The quick-access bar must FIT the phone');
  assert.ok(at !== -1, 'the rules that make it fit must be there');
  const block = header.slice(at);
  const input = /\.zoom-input \{([\s\S]*?)\}/.exec(block);
  assert.ok(input, 'the zoom pill is the widest item in the bar');
  const width = /(?<![-\w])width:\s*(\d+)px/.exec(input[1]);
  assert.ok(width && Number(width[1]) <= 50,
    `the zoom input was a fixed 80px of a 375px bar, found ${width && width[1]}px`);
  assert.ok(/flex: 0 1 /.test(input[1]), 'and it may now shrink');
  // The two the user actually came for stay put, at the end of the row.
  assert.ok(/#header-quick-access #notifications,\s*\n\s*#header-quick-access #header-user-bar \{[\s\S]*?flex-shrink: 0/.test(block),
    'the bell and the avatar never shrink');
});

test('and the page itself can never be dragged sideways on a phone', () => {
  const small = layouts.slice(layouts.indexOf('Nothing on a phone may make the PAGE scroll sideways'));
  assert.ok(small.length, 'the guarantee must be stated where the phone rules are');
  assert.ok(/html \{[\s\S]{0,120}overflow-x: hidden;/.test(small.slice(0, 900)),
    'a spill must not become a scrollable page');
  // Belt and braces: mobile mode already said this for the body.
  assert.ok(/body\.mobile-mode \{[\s\S]{0,200}overflow-x: hidden;/.test(layouts));
});

console.log(`\n${passed} tests passed`);
