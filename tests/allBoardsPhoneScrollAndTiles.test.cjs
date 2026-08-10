'use strict';

// #6488, reported again against 10.77 after being closed three times:
//
//   "at smartphone, at All Boards page, it is not possible to scroll down to
//    see remaining of boards. check that scrolling down works at all left menu
//    options right pages, and at mobile and desktop mode. also, some board icons
//    are too high, they are maybe 4x normal board icon height or more."
//   "board icons are too close to each other. there should be small amount of
//    space between board icons."
//
// Four separate things, and each earlier attempt fixed one shape of one of them:
//
//  1. THE SCROLL. Every viewport guess below `body` had been removed from
//     boardsList.css - and the last one was in layouts.css, where nobody looked:
//     `body.mobile-mode #content { height: calc(100dvh - 48px) }`. 48px is a
//     guess at the header, the header is not 48px and is not any one number
//     (Utils publishes --wekan-header-height from a ResizeObserver for exactly
//     this reason), so on a phone whose bar wraps, #content ended below the
//     screen and everything under it inherited that. Covered by
//     tests/mobileViewportHeight.test.cjs.
//
//  2. THE TABLE VIEW. The right column has two branches - the board icons and
//     `+tablePage` - and only the icons were given a scroller, so the other view
//     of every section could not be scrolled at all.
//
//  3. THE 4x-TALL TILES. A grid defaults to `align-content: stretch`, so a list
//     shorter than its column has the leftover height divided among its rows and
//     each tile grown into it; a board tile paints its colour over the whole
//     cell. This was fixed on `.board-list.mobile-view`, the class the template
//     sets from Utils.isMiniScreen() - but the phone MEDIA QUERY makes a grid
//     too, and a narrow window that is not a mini screen took that path and
//     never got the fix.
//
//  4. THE SPACING. An 8px grid gap PLUS a `margin-bottom: 0.5rem` per tile: 16px
//     between rows and 8px between columns, which reads as crowded sideways.
//     One value, both directions.
//
// Run: node tests/allBoardsPhoneScrollAndTiles.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const css = read('client/components/boards/boardsList.css');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// A rule's declarations, comments stripped - a rule that EXPLAINS what it no
// longer says must not read as still saying it.
function rule(selector, from = css) {
  const at = from.indexOf(`\n${selector} {`) !== -1
    ? from.indexOf(`\n${selector} {`)
    : from.indexOf(`${selector} {`);
  assert.notStrictEqual(at, -1, `no rule for ${selector}`);
  const open = from.indexOf('{', at);
  return from.slice(open + 1, from.indexOf('}', open))
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function decl(body, prop) {
  const m = body.match(new RegExp(`(?:^|;|\\n)\\s*${prop}\\s*:\\s*([^;\\n]+)`));
  return m ? m[1].trim().replace(/\s*!important$/, '') : null;
}

// The phone media query that turns the board list into a grid.
const phoneGrid = (() => {
  const at = css.indexOf('grid-template-columns: repeat(2, minmax(0, 1fr));');
  assert.notStrictEqual(at, -1, 'the 2-per-row phone grid must exist');
  const open = css.lastIndexOf('{', at);
  return css.slice(open + 1, css.indexOf('}', at)).replace(/\/\*[\s\S]*?\*\//g, '');
})();

// ── 3. the 4x-tall tiles ────────────────────────────────────────────────────

test('the phone board grid does not stretch its rows or its tiles', () => {
  assert.strictEqual(decl(phoneGrid, 'align-content'), 'start',
    'without align-content: start a grid divides the column\'s leftover height ' +
    'among its rows, so one row of boards becomes one band several times a ' +
    'tile\'s height - the "4x normal board icon height" in the report');
  assert.strictEqual(decl(phoneGrid, 'align-items'), 'start',
    'and without align-items: start each tile is stretched to its row');
});

test('the mini-screen grid does not stretch either, so both paths agree', () => {
  const mobileView = rule('.board-list.mobile-view');
  assert.strictEqual(decl(mobileView, 'display'), 'grid');
  // The stretch fix for this path lives in its own late rule (source order
  // decides at equal specificity), so it is looked for across the file.
  const at = css.indexOf('.board-list.mobile-view {\n  align-content: start;');
  assert.notStrictEqual(at, -1,
    '.board-list.mobile-view must also state align-content/align-items: start');
});

test('a tile is its own height, not the height of the cell it sits in', () => {
  const li = (() => {
    const at = phoneGrid.length && css.indexOf('  .board-list li {');
    assert.notStrictEqual(at, -1, 'the phone rule for .board-list li must exist');
    return css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at))
      .replace(/\/\*[\s\S]*?\*\//g, '');
  })();
  assert.strictEqual(decl(li, 'align-self'), 'start',
    'a grid item stretches to its row unless it says otherwise');
  assert.strictEqual(decl(li, 'height'), 'auto', 'and takes its own content height');
});

// ── 4. the spacing ──────────────────────────────────────────────────────────

test('one spacing value separates the tiles, in both directions', () => {
  const gap = decl(phoneGrid, 'gap');
  assert.ok(gap, 'the phone grid must set a gap');
  const px = parseInt(gap, 10);
  assert.ok(px >= 8, `the gap must be visible between tiles, got ${gap}`);
  assert.ok(/^\d+px$/.test(gap),
    `one length, applied to both rows and columns - got ${gap}`);
});

test('no per-tile margin adds a second, one-directional gap', () => {
  for (const [selector, body] of [
    ['.board-list li (phone)', css.slice(css.indexOf('  .board-list li {'),
      css.indexOf('}', css.indexOf('  .board-list li {'))).replace(/\/\*[\s\S]*?\*\//g, '')],
    ['.board-list.mobile-view li', rule('.board-list.mobile-view li')],
  ]) {
    const mb = decl(body, 'margin-bottom');
    assert.strictEqual(mb, '0',
      `${selector}: the grid gap spaces the tiles. A margin here spaced them a ` +
      `second time and only downwards, so the rows were twice as far apart as ` +
      `the columns - which is what "too close to each other" describes sideways`);
  }
});

// ── 2. every left-menu option's right page scrolls ──────────────────────────

test('the right column is a flex column with a scrolling part in BOTH views', () => {
  const jade = read('client/components/boards/boardsList.jade');
  // The two branches the template really has, so this test fails if a third
  // appears without a scroller.
  assert.ok(/if isAllBoardsView 'table'\s*\n\s*\+tablePage/.test(jade),
    'the Table branch of the right column must still be +tablePage');
  assert.ok(/ul\.board-list/.test(jade), 'the icons branch must still be .board-list');

  // The PHONE rule (two-space indent, inside the media query) - not the
  // page-level `.boards-layout > .boards-right-grid` padding rule near the top
  // of the file, which a loose substring search finds first.
  const rgAt = css.indexOf('\n  .boards-right-grid {');
  assert.notStrictEqual(rgAt, -1, 'the phone rule for .boards-right-grid must exist');
  const rightGrid = css.slice(css.indexOf('{', rgAt) + 1, css.indexOf('}', rgAt))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.strictEqual(decl(rightGrid, 'display'), 'flex');
  assert.strictEqual(decl(rightGrid, 'flex-direction'), 'column');

  const table = rule('.boards-right-grid > .table-page');
  assert.strictEqual(decl(table, 'flex'), '1 1 auto',
    'the table view must take what the column has left');
  assert.strictEqual(decl(table, 'min-height'), '0',
    'and be allowed to be shorter than the table, or it can never scroll');
  assert.ok(/auto/.test(decl(table, 'overflow-y')),
    'a table taller than the phone must scroll inside the column - #content is ' +
    'overflow: hidden, so anything past the fold is otherwise clipped');
  assert.ok(/auto|scroll/.test(decl(table, 'overflow-x')),
    'a table is wider than a phone too');
});

test('the pane heading does not get squeezed instead of the scroller scrolling', () => {
  // Again the PHONE rule: there is a page-level
  // `.boards-right-grid > .admin-pane-title` earlier in the file that sets the
  // heading's margins, and a loose search finds that one.
  const tAt = css.indexOf('\n  .boards-right-grid > .admin-pane-title {');
  assert.notStrictEqual(tAt, -1, 'the phone rule for the pane title must exist');
  const title = css.slice(css.indexOf('{', tAt) + 1, css.indexOf('}', tAt))
    .replace(/\/\*[\s\S]*?\*\//g, '');
  assert.strictEqual(decl(title, 'flex'), '0 0 auto',
    'a flex item shrinks by default; the title must keep its height and let the ' +
    'list below it be the flexible one');
});

test('the left menu is its own scroller, so its options are reachable too', () => {
  // "check that scrolling down works at all left menu options" - the menu
  // itself has to scroll when there are more workspaces than fit.
  const menu = css.slice(css.indexOf('  .boards-left-menu {\n    overflow-y: auto;'));
  assert.ok(menu.length, 'the phone rule making the left menu a scroller must exist');
  const body = menu.slice(menu.indexOf('{') + 1, menu.indexOf('}')).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.strictEqual(decl(body, 'overflow-y'), 'auto');
  assert.strictEqual(decl(body, 'min-height'), '0');
  assert.strictEqual(decl(body, 'height'), '100%');
});

// ── 1. the chain the scroll hangs from, end to end ──────────────────────────

test('nothing between the body and the board list computes a height from the viewport', () => {
  const layouts = read('client/components/main/layouts.css');
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

  // #content: the flex item, no arithmetic (the fix in layouts.css).
  const contentAt = layouts.indexOf('body.mobile-mode #content {');
  const content = strip(layouts.slice(contentAt, layouts.indexOf('}', contentAt)));
  assert.ok(!/height:\s*calc\(/.test(content),
    'body.mobile-mode #content must be sized by flex: 1, not by 100dvh minus a ' +
    'guessed header height - that is what put the bottom of All Boards off screen');

  // ...and each step below it is a definite height that can also shrink.
  for (const [selector, expect] of [
    ['#content .wrapper', { height: '100%', 'min-height': '0' }],
    ['#content .wrapper > .boards-layout', { flex: '1 1 auto', 'min-height': '0' }],
  ]) {
    const at = css.indexOf(`  ${selector} {`);
    assert.notStrictEqual(at, -1, `the phone rule for ${selector} must exist`);
    const body = strip(css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at)));
    for (const [prop, value] of Object.entries(expect)) {
      assert.strictEqual(decl(body, prop), value,
        `${selector} must state ${prop}: ${value} - a step that cannot shrink ` +
        `below its content stops every scroller under it from scrolling`);
    }
  }
});

console.log(`\n${passed} passed`);
