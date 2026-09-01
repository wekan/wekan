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

test('long phone board names grow their tile instead of being clipped', () => {
  for (const selector of [
    '.board-list .board-list-item',
    '.board-list.mobile-view .board-list-item',
  ]) {
    assert.strictEqual(lastDeclaration(boards, selector, 'height'), 'auto',
      `${selector}: a fixed tile height cuts a wrapped board name`);
    assert.strictEqual(lastDeclaration(boards, selector, 'min-height'), '4rem',
      `${selector}: short tiles keep the compact 4rem floor`);
  }
  assert.strictEqual(lastDeclaration(boards, '.board-list .board-list-item-name',
    'overflow-wrap'), 'anywhere', 'an unbroken board name must wrap inside its tile');
  assert.strictEqual(lastDeclaration(boards, '.board-list li', 'align-self'), 'start',
    'each tile takes its own title height without stretching its row sibling');
});

test('the quick-access bar gives way instead of spilling off the phone', () => {
  const at = header.indexOf('The quick-access bar must FIT the phone');
  assert.ok(at !== -1, 'the rules that make it fit must be there');
  const block = header.slice(at);
  // The zoom pill used to be the widest item in this bar, and this test capped
  // its input at 50px of a 375px phone. The pill is gone - removed rather than
  // fixed, since it never worked and WeKan has a font-size setting - so what is
  // checked now is that nothing has put it back to eat the width again.
  assert.ok(!/zoom-(controls|level|display|input)/.test(header),
    'the removed zoom pill must not be back in the quick-access bar');
  assert.ok(/#header-quick-access \{[\s\S]*?box-sizing: border-box;[\s\S]*?max-width: 100%;/.test(block),
    'width:100% includes the header gutters instead of adding them past the viewport');
  // The two the user actually came for stay put, at the end of the row. They are
  // two rules now, each with the `.iphone-device` / `.wrapper ~` variants that
  // have to be named to win, so what is asserted is that EACH of them declares
  // flex-shrink: 0 - not that both share one selector list.
  for (const item of ['#notifications', '#header-user-bar']) {
    const rule = new RegExp(
      `#header-quick-access ${item}[^{]*\\{([^}]*)\\}`, 'g');
    const declares = [...block.matchAll(rule)]
      .some(m => /flex-shrink:\s*0/.test(m[1]));
    assert.ok(declares, `${item} must never shrink - it is what the user came for`);
  }
});

// The test that lived here checked that the "100%" zoom number stayed inside its
// white pill and stayed readable - a real bug once, when the pill shrank below its
// contents and the number ended up beside it in 8px type under the notification
// bell. The pill is REMOVED now (it scaled the board with a CSS transform, never
// worked, and WeKan has a font-size setting), so there is nothing left to lay out.
// The test above asserts it has not come back.

test('and the page itself can never be dragged sideways on a phone', () => {
  const small = layouts.slice(layouts.indexOf('Nothing on a phone may make the PAGE scroll sideways'));
  assert.ok(small.length, 'the guarantee must be stated where the phone rules are');
  assert.ok(/html \{[\s\S]{0,120}overflow-x: hidden;/.test(small.slice(0, 900)),
    'a spill must not become a scrollable page');
  // Belt and braces: mobile mode already said this for the body.
  assert.ok(/body\.mobile-mode \{[\s\S]{0,200}overflow-x: hidden;/.test(layouts));
});

test('the left menu fits its column, so it cannot lie over the boards', () => {
  // Spec 43 (`43-mobile-allboards.e2e.js`) measures this in a browser: the
  // board list must start at or after the menu's right edge. On a 375px phone
  // the grid track is capped at 42% - about 157px - but the menu carries a
  // width of its own (260px, so it can be dragged), and it kept every pixel of
  // it and lay over the boards.
  //
  // `max-width: 100%` alone did NOT fix it, which is the part worth pinning: a
  // grid item's default `min-width: auto` is its content's intrinsic minimum,
  // and a minimum beats a maximum. The cap only applies once the item is
  // allowed to shrink - which is the same pair the right-hand column beside it
  // has always had.
  const boards = read('client/components/boards/boardsList.css');
  const at = boards.indexOf('.boards-left-menu {');
  assert.notStrictEqual(at, -1, 'the menu has its own rule');
  const rule = boards.slice(at, boards.indexOf('}', at));
  assert.ok(/width: var\(--wekan-left-menu-width\);/.test(rule),
    'it carries the width that can be dragged');
  assert.ok(/max-width: 100%;/.test(rule), 'capped by the column it is in');
  assert.ok(/min-width: 0;/.test(rule),
    'and allowed to shrink to that cap - without this the maximum does nothing');

  // The column it is capped against really is narrower than that width on a
  // phone, or the cap would be untested in the only place it matters.
  const phone = boards.match(/\.boards-layout \{[^}]*grid-template-columns:[^;]*min\(42%, 210px\)[^;]*;/);
  assert.ok(phone, 'the phone track is the one that caps it');

  // And the same fix on the right-hand column, which is where this came from -
  // whichever of its rules carries it: `.boards-right-grid` has more than one.
  const rightRules = [...boards.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(r => r[1].split(',').some(sel => sel.trim().endsWith('.boards-right-grid')));
  assert.ok(rightRules.some(r => /min-width: 0;/.test(r[2])),
    'the boards column shrinks to its track too');
});

test('the board counts line up in one column, at every width', () => {
  // xet7, from an iPhone 12 mini: "count of boards should be at same x
  // position, of Starred, Home, Templates, Archive".
  //
  // Those four labels are four different lengths, so a count that follows its
  // label lands at four different x positions and the column of numbers reads
  // as ragged. #6523 had packed them that way on a phone deliberately - the
  // number beside the text rather than across a gap - and this is the reversal.
  const boards = read('client/components/boards/boardsList.css');
  const code = boards.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...code.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

  // The row spreads its two children apart, and the label takes the slack -
  // which is what puts every count at the END of its row.
  const rowRules = rules.filter(r => r[1].trim() === '.boards-left-menu .menu-item a');
  assert.ok(rowRules.some(r => /justify-content: space-between/.test(r[2])),
    'the row spreads label and count apart');
  assert.ok(rules.some(r => r[1].trim() === '.boards-left-menu .menu-item .menu-label'
    && /flex: 1/.test(r[2])), 'and the label takes the slack');

  // ...and NOTHING may take that back at a narrower width. A phone override is
  // exactly how they came to be ragged in the first place.
  for (const r of rowRules) {
    assert.ok(!/justify-content: flex-start/.test(r[2]),
      'no width may pack the row from the start - that is what ragged looks like');
  }
  for (const r of rules.filter(r => /\.menu-item \.menu-label$/.test(r[1].trim()))) {
    assert.ok(!/flex: 0/.test(r[2]),
      'and none may stop the label taking the slack');
  }
});

console.log(`\n${passed} tests passed`);
