'use strict';

// Boards in Archive is a PAGE, not a modal.
//
// It was `Modal.open('archivedBoards')` from three menus, so the one place that
// lists every archived board - with its own search and its own pager - was a box
// floating over whatever you happened to be looking at. It could not be linked
// or bookmarked, it had no address to come back to, and Escape closed it while
// you were reading. Restoring a board archived last month deserves a page.
//
// Run: node tests/archivePage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const router = read('config/router.js');
const jade = read('client/components/boards/boardArchive.jade');
const js = read('client/components/boards/boardArchive.js');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('archivePage:');

test('/archive is a page, rendered like every other page', () => {
  const at = router.indexOf("FlowRouter.route('/archive', {");
  assert.notStrictEqual(at, -1, '/archive must be a route');
  const body = router.slice(at, router.indexOf('\n});', at));
  assert.ok(/name: 'archive',/.test(body), 'with a name, so it can be linked by it');
  assert.ok(/this\.render\('defaultLayout', \{/.test(body), 'in the default layout');
  assert.ok(/content: 'archivedBoards',/.test(body), 'showing the archive');
  // No second header bar: the first one names the page now, and this page has
  // no controls to put in a sidebar - so it is its content and nothing else.
  assert.ok(!/headerBar:/.test(body), 'and no second header bar to name it twice');
  const { PAGE_TITLE_KEYS } = require('../models/lib/pageTitles');
  assert.strictEqual(PAGE_TITLE_KEYS.archive, 'archived-boards',
    'the top header bar names it instead');
  // Signed in, and it clears the board session state the way the other
  // non-board pages do - otherwise the previous board stays "current".
  assert.ok(/ensureSignedInUnlessSandstorm/.test(body), 'behind sign-in');
  assert.ok(/Session\.set\('currentBoard', null\)/.test(body), 'and not on a board');
});

test('and nothing opens it as a modal any more', () => {
  const offenders = [];
  for (const dir of ['client/components/boards', 'client/components/users',
    'client/components/sidebar']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
      if (!f.endsWith('.js')) continue;
      const rel = `${dir}/${f}`;
      if (/Modal\.open\('archivedBoards'\)/.test(read(rel))) offenders.push(rel);
    }
  }
  assert.deepStrictEqual(offenders, [], 'these still open the archive as a modal');
});

test('every entry point goes to the page', () => {
  // Three menus had the handler, and a fourth button had lost one.
  const entries = [
    ['client/components/boards/boardHeader.js', 'the board menu'],
    ['client/components/users/userHeader.js', 'the member menu'],
    ['client/components/sidebar/sidebar.js', 'the board sidebar'],
    ['client/components/boards/allBoardsSidebar.js', 'the All Boards sidebar'],
  ];
  for (const [file, what] of entries) {
    const src = read(file);
    const at = src.indexOf("'click .js-open-archived-board'");
    assert.notStrictEqual(at, -1, `${what} must handle the click`);
    assert.ok(/FlowRouter\.go\('archive'\)/.test(src.slice(at, at + 300)),
      `${what} must go to the page`);
    // By route NAME, not by a path spelled out again in four places.
    assert.ok(!/FlowRouter\.go\('\/archive'\)/.test(src),
      `${what} must use the route name, not a literal path`);
  }
});

test('the All Boards sidebar row works at all', () => {
  // It had no handler: the one it relied on lived in the header bar's events
  // map and went when that map was rewritten for the sidebar. The button was
  // rendered, and clicking it did nothing.
  const sidebar = read('client/components/boards/allBoardsSidebar.jade');
  assert.ok(/js-open-archived-board/.test(sidebar), 'the row is drawn');
  const sidebarJs = read('client/components/boards/allBoardsSidebar.js');
  assert.ok(/'click \.js-open-archived-board'/.test(sidebarJs), 'and handled');
  // The panel it was clicked in closes: the page it opens replaces the page the
  // panel belongs to.
  const at = sidebarJs.indexOf("'click .js-open-archived-board'");
  assert.ok(/closeAllBoardsSidebar\(\)/.test(sidebarJs.slice(at, at + 300)),
    'and the sidebar closes behind it');
  // ...and the header bar's map, which used to own it, no longer claims to.
  assert.ok(!/js-open-archived-board/.test(read('client/components/boards/boardsList.js')),
    'the header bar must not handle a button it does not draw');
});

test('the page is named once, in the TOP header bar', () => {
  // It has been named three ways in three steps: the modal drew its own `h2`
  // (a modal has no header bar to be named in), then a second header bar of its
  // own, and now the first header bar, which names every page. Each move left
  // the previous one to be removed, or the title printed twice.
  assert.ok(!/template\(name="archivedBoardsHeaderBar"\)/.test(jade),
    'its own header bar is gone');
  const page = jade.slice(jade.indexOf('template(name="archivedBoards")'));
  const body = page.slice(0, page.indexOf('template(name="boardDeletePopup")'));
  assert.ok(!/^\s*h[12]$/m.test(body), 'and the page draws no title of its own');
});

test('it keeps its search and its server-side paging', () => {
  // The point of the page is finding one board among many, so neither may be
  // lost in the move.
  assert.ok(/js-archived-boards-search/.test(jade), 'the search box');
  assert.ok(/js-archived-boards-prev-page/.test(jade) && /js-archived-boards-next-page/.test(jade),
    'and the pager');
  assert.ok(/this\.subscribe\('archivedBoards', searchTerm, ARCHIVED_BOARDS_PER_PAGE, skip\)/.test(js),
    'only the current page is published - a long archive must stay fast');
  assert.ok(/TABLE_PAGE_ROWS_PER_PAGE/.test(js), "and it is the app's one rows-per-page");
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\narchivePage: ${passed} tests passed`);
