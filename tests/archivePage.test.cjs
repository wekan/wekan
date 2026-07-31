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
  // Drawn and handled in BOTH places it exists. It is a button of the first
  // top header bar now (boardsList.jade / .js) and still a row of the sidebar's
  // home view (allBoardsSidebar.jade / .js) - a Blaze event map only sees
  // events inside its own template, so each copy needs its own handler, and a
  // copy with markup but no map is a button that silently does nothing. That
  // is exactly what happened to this one once already.
  // The SIDEBAR row still leaves for the page and closes the panel behind it:
  // the page it opens replaces the page the panel belongs to.
  assert.ok(/js-open-archived-board/.test(read('client/components/boards/allBoardsSidebar.jade')),
    'the sidebar draws it');
  const sidebarJs = read('client/components/boards/allBoardsSidebar.js');
  const at = sidebarJs.indexOf("'click .js-open-archived-board'");
  assert.notStrictEqual(at, -1, 'and handles it');
  assert.ok(/closeAllBoardsSidebar\(\)/.test(sidebarJs.slice(at, at + 300)),
    'and the sidebar closes behind it');
  assert.ok(/FlowRouter\.go\('archive'\)/.test(sidebarJs.slice(at, at + 300)),
    'and it goes to the page');

  // The LEFT MENU row does not navigate at all - it selects a section of the
  // All Boards page, drawn beside the menu. A menu row that throws its own menu
  // away is not a menu row.
  const listJs = read('client/components/boards/boardsList.js');
  const listAt = listJs.indexOf("'click .js-open-archived-board'");
  assert.notStrictEqual(listAt, -1, 'the left-menu row is handled');
  const listHandler = listJs.slice(listAt, listJs.indexOf('\n  },', listAt));
  assert.ok(!/FlowRouter\.go/.test(listHandler),
    'the left-menu row must not leave the page it is a menu of');
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

test('and All Boards reaches it from the left menu, not the header bar', () => {
  // It was a button in the first header bar beside Sort, Search and
  // Multi-Selection. Those three act on the boards in front of you; this one is
  // a PLACE you go instead, so it belongs with the other places.
  const jade = read('client/components/boards/boardsList.jade');
  const menu = jade.slice(jade.indexOf('.boards-left-menu'),
    jade.indexOf('ul.AllBoardTeamsOrgs'));
  const rowAt = menu.indexOf('js-open-archived-board');
  assert.notStrictEqual(rowAt, -1, 'the row is in the left menu');
  // Under REMAINING, in the same group as the other three board lists - it is
  // another list of boards, which is what those rows are. It was below the
  // workspaces tree first; xet7 moved it up.
  const remainingAt = menu.indexOf("data-type=\"remaining\"");
  const treeAt = menu.indexOf('+workspaceTree');
  assert.ok(remainingAt !== -1 && rowAt > remainingAt, 'below Remaining');
  assert.ok(treeAt !== -1 && rowAt < treeAt, 'and above the workspaces tree');
  // Shaped like the menu's other rows, so it does not read as a stray link.
  const row = menu.slice(rowAt - 160, rowAt + 260);
  assert.ok(/li\(class="menu-item /.test(row) && /span\.menu-label/.test(row),
    'and drawn as a menu row like Starred, Templates and Remaining');
  assert.ok(/fa-archive/.test(row) && /\{\{_ 'archived-boards'\}\}/.test(row),
    'with its icon and its name');
  // ...including the selected state and the count, which the other three have.
  assert.ok(/isSelectedMenu 'archive'/.test(row), 'and highlights when selected');
  assert.ok(/span\.menu-count \{\{archivedBoardsCount\}\}/.test(row),
    'and carries a count like Starred, Templates and Remaining');

  // A rule above and below the Workspaces section: the menu is three kinds of
  // thing in one column and the tree ran into its neighbours without them.
  const dividers = (menu.match(/hr\.boards-menu-divider/g) || []).length;
  assert.strictEqual(dividers, 2, 'one rule above the section and one below');
  const headerAt = menu.indexOf('.workspaces-header');
  const firstHr = menu.indexOf('hr.boards-menu-divider');
  const secondHr = menu.indexOf('hr.boards-menu-divider', firstHr + 1);
  assert.ok(firstHr < headerAt, 'the first is above the section');
  assert.ok(secondHr > treeAt, 'the second is below the tree');
  // Styled, and not left as the browser default - a default hr is a beveled
  // 2px ridge that reads heavier than the menu's own border beside it.
  const css = read('client/components/boards/boardsList.css');
  const at = css.indexOf('.boards-left-menu hr.boards-menu-divider {');
  assert.notStrictEqual(at, -1, 'the rule is styled');
  const rule = css.slice(at, css.indexOf('}', at));
  // DARK grey. The first version was a #e0e0e0 hairline - the same grey as the
  // menu's own right edge - and it was too faint to separate anything. A light
  // grey needs area to be seen, and area is what turns a divider into something
  // that reads as a row; a dark one is legible as a line, so it stays a line.
  assert.ok(/border:\s*0/.test(rule), 'no default hr bevel drawing through it');
  assert.ok(/background:\s*#888/.test(rule), 'dark grey, not a near-white hairline');
  assert.ok(/height:\s*2px/.test(rule),
    '2px: at 1px a rule can land on a half-pixel boundary and be drawn as two '
    + 'lighter rows on a fractional-scale display, which is the faintness this fixes');
  // ...and it is a grey this stylesheet already uses, rather than a new one.
  assert.ok((css.match(/#888/g) || []).length > 1,
    '#888 is already part of this menu\'s palette');

  // The handler moved WITH the markup. A Blaze event map only sees events
  // inside its own template, so one left behind in allBoardsHeaderButtons would
  // never fire - which is what happened to this very button once before.
  const js = read('client/components/boards/boardsList.js');
  const headerMapAt = js.indexOf('Template.allBoardsHeaderButtons.events({');
  const headerMap = js.slice(headerMapAt, js.indexOf('\n});', headerMapAt));
  assert.ok(!headerMap.includes('js-open-archived-board'),
    'no handler left behind in the header buttons');
  const listMapAt = js.lastIndexOf('Template.boardList.events({');
  const listMap = js.slice(listMapAt);
  assert.ok(listMap.includes("'click .js-open-archived-board'"),
    'the template that draws it handles it');
});

test('and the All Boards menu is styled like the Admin Panel one', () => {
  // WeKan has one kind of left menu and it should look like one kind of left
  // menu. This was a bare column separated from the page by a hairline while
  // the Admin Panel's was a panel with a themed selected row.
  const boards = read('client/components/boards/boardsList.css');
  const admin = read('client/components/settings/settingBody.css');

  const panelAt = boards.indexOf('.boards-left-menu {');
  const panel = boards.slice(panelAt, boards.indexOf('}', panelAt));
  const adminPanelAt = admin.indexOf('.setting-content .content-body .side-menu {');
  const adminPanel = admin.slice(adminPanelAt, admin.indexOf('}', adminPanelAt));
  for (const [prop, value] of [
    ['background-color', '#f7f7f7'],
    ['border', '1px solid #f0f0f0'],
    ['border-radius', '7px'],
  ]) {
    assert.ok(panel.includes(`${prop}: ${value}`), `the menu is a panel: ${prop}`);
    assert.ok(adminPanel.includes(`${prop}: ${value}`),
      `...the same ${prop} the Admin Panel's menu uses`);
  }
  // An inset shadow with NO x offset: an offset one is a physical direction and
  // does not mirror under dir=rtl, which is how the Admin Panel's came to shade
  // the wrong inner edge.
  assert.ok(/box-shadow:\s*inset 0 -2px 4px/.test(panel), 'and the same inset shadow');
  assert.ok(!/box-shadow:\s*inset -?\d+px \d/.test(panel), 'with no sideways offset');
  // A long menu scrolls inside the panel rather than spilling past its corner.
  assert.ok(/overflow-y:\s*auto/.test(panel) && /min-height:\s*0/.test(panel),
    'and scrolls inside itself, as the Problems menu had to be taught to');

  // The selected row is the theme accent with white text, in both menus.
  const activeAt = boards.indexOf('.boards-left-menu .menu-item.active a,');
  const active = boards.slice(activeAt, boards.indexOf('}', activeAt));
  assert.ok(/background:\s*var\(--theme-accent, #2980b9\)/.test(active),
    'the selected row is the per-user accent, falling back to the header blue');
  assert.ok(admin.includes('background: var(--theme-accent, #2980b9)'),
    "...which is what the Admin Panel's selected row uses");
  assert.ok(/\.menu-item\.active a:hover/.test(active),
    'hover is listed on the active rule too, or the white hover below washes '
    + 'the selected row out as soon as the pointer crosses it');
  assert.ok(/color: #fff/.test(boards.slice(activeAt, activeAt + 900)),
    'and its label and icon go white');

  // ...and the panel reaches the window's edges, as the Admin Panel's does.
  // That one is `position: absolute; width: 100%; height: 100%` and sits
  // OUTSIDE `.wrapper`, so its menu is against the left and bottom edges. All
  // Boards is in normal flow inside `.wrapper`, which is
  // `width: calc(100% - 28px); margin: 0 auto` - so without an override the
  // menu floated 14px in from an edge it is supposed to look attached to.
  // Checked across the file rather than inside one rule's braces: `.wrapper`
  // is declared more than once in layouts.css, and taking the first block found
  // read a rule that only carries the comment explaining the sizes.
  const layouts = read('client/components/main/layouts.css');
  assert.ok(/\.wrapper \{[^}]*width:\s*calc\(100% - 28px\)/.test(layouts),
    'the generic wrapper really does inset the page');
  const overrideAt = boards.indexOf('#content .all-boards-wrapper {');
  assert.notStrictEqual(overrideAt, -1, 'All Boards opts out of that inset');
  const override = boards.slice(overrideAt, boards.indexOf('}', overrideAt));
  assert.ok(/width:\s*100%/.test(override) && /margin:\s*0/.test(override),
    'edge to edge');

  const layoutAt = boards.indexOf('.boards-layout {');
  const layout = boards.slice(layoutAt, boards.indexOf('}', layoutAt));
  // Down to the bottom: measured from the header, because the bar wraps and is
  // not one fixed height. A MINIMUM, so more boards than fit still grow past it.
  assert.ok(/min-height:\s*calc\(100vh - var\(--wekan-header-height, 0px\)\)/.test(layout),
    'and down to the bottom of the window, measured from the header it sits under');
  assert.ok(!/[^-]height:\s*calc\(100vh/.test(layout),
    'a minimum, not a fixed height - a long page must still be able to grow');
  const adminBodyAt = admin.indexOf('.setting-content .content-body {');
  assert.ok(/height:\s*100%/.test(admin.slice(adminBodyAt, admin.indexOf('}', adminBodyAt))),
    "...which is what the Admin Panel's row does with its own full-height box");
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\narchivePage: ${passed} tests passed`);
