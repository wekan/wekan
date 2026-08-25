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

test('#1280 board Archived Items opens card/list archives, not archived boards', () => {
  const sidebarJade = read('client/components/sidebar/sidebar.jade');
  const menuAt = sidebarJade.indexOf('template(name="boardMenuPopup")');
  const menu = sidebarJade.slice(menuAt, sidebarJade.indexOf('\ntemplate(', menuAt + 1));
  assert.ok(/a\.js-open-archives[\s\S]*?archived-items/.test(menu),
    'the board menu offers Archived Items');
  assert.ok(!/js-open-archived-board/.test(menu),
    'the board menu must not mislabel the separate archived-boards destination');

  const sidebarJs = read('client/components/sidebar/sidebar.js');
  const at = sidebarJs.indexOf("'click .js-open-archives'");
  assert.notStrictEqual(at, -1, 'Archived Items has a click handler');
  const handler = sidebarJs.slice(at, sidebarJs.indexOf('\n  },', at));
  assert.ok(/Sidebar\.setView\('archives'\)/.test(handler),
    'it opens the current board card/list/swimlane archive');
  assert.ok(!/FlowRouter|SECTION_ARCHIVE|js-open-archived-board/.test(handler),
    'it cannot redirect to the All Boards archive');
});

test('every entry point goes to the SECTION of All Boards', () => {
  // Three menus had the handler, and a fourth button had lost one.
  //
  // They all went to `/archive`, the full-width page. Boards in Archive is a
  // SECTION of All Boards now - a row in its left menu, drawn beside it - so
  // that page is the thing the section replaced: the same list of boards, but
  // with no menu beside it and no way across to Starred or Remaining without
  // going back first. Every entry point reaches the section.
  // xet7: "Member Settings / Archive opens it full width. instead, it should go
  // to /allboards/archive". The other three are the same line in another menu.
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
    assert.ok(/FlowRouter\.go\(allBoardsPath\(SECTION_ARCHIVE, \[\]\)\)/.test(src.slice(at, at + 400)),
      `${what} must go to the All Boards archive section`);
    // Through the URL helper, not a path spelled out again in four places.
    assert.ok(!/FlowRouter\.go\('\/?allboards\/archive'\)/.test(src),
      `${what} must build the path with allBoardsPath(), not by hand`);
    assert.ok(/require\('\/models\/lib\/allBoardsUrls'\)/.test(src),
      `${what} must import that helper`);
  }
  // And the helper really produces the address that was asked for.
  const { allBoardsPath, SECTION_ARCHIVE } = require('../models/lib/allBoardsUrls');
  assert.strictEqual(allBoardsPath(SECTION_ARCHIVE, []), '/allboards/archive');
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
  // The SIDEBAR row closes the panel behind it: the section it opens is another
  // section of the page the panel belongs to, so leaving the panel open over it
  // would cover the list it just went to.
  assert.ok(/js-open-archived-board/.test(read('client/components/boards/allBoardsSidebar.jade')),
    'the sidebar draws it');
  const sidebarJs = read('client/components/boards/allBoardsSidebar.js');
  const at = sidebarJs.indexOf("'click .js-open-archived-board'");
  assert.notStrictEqual(at, -1, 'and handles it');
  assert.ok(/closeAllBoardsSidebar\(\)/.test(sidebarJs.slice(at, at + 300)),
    'and the sidebar closes behind it');
  assert.ok(/FlowRouter\.go\(allBoardsPath\(SECTION_ARCHIVE, \[\]\)\)/.test(sidebarJs.slice(at, at + 400)),
    'and it goes to the archive SECTION of All Boards');

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
  const listJs = read('client/components/boards/boardsList.js');
  const { menuSectionOrder } = require('../models/lib/allBoardsUrls');

  // The four rows are ONE row in the markup, drawn once per section, because
  // their ORDER depends on the user: Starred first when anything is starred,
  // Remaining first when nothing is. Four copies of the markup could not be
  // reordered without moving markup about. So the row's SHAPE is checked here
  // and its CONTENT in the `meta` map that feeds the loop.
  assert.ok(/each menuSections/.test(menu), 'one row, drawn per section');
  const rowStart = menu.indexOf('each menuSections');
  const rowEnd = menu.indexOf('hr.boards-menu-divider', rowStart);
  assert.notStrictEqual(rowEnd, -1, 'the row and what follows it are findable');
  const row = menu.slice(rowStart, rowEnd);
  assert.ok(/li\(class="menu-item /.test(row) && /span\.menu-label/.test(row),
    'drawn as a menu row');
  assert.ok(/data-type="\{\{type\}\}"/.test(row), 'naming its section');
  assert.ok(/isSelectedMenu type/.test(row), 'highlighting when selected');
  assert.ok(/span\.menu-count \{\{sectionCount type\}\}/.test(row), 'and counting');

  // The orders, from the module that decides them. Templates and the Archive
  // never move, and the Archive is always the last row.
  assert.deepStrictEqual(menuSectionOrder(true, false),
    ['starred', 'remaining', 'home', 'templates', 'archive'],
    'with starred boards, Starred is the first row');
  assert.deepStrictEqual(menuSectionOrder(false, false),
    ['remaining', 'starred', 'home', 'templates', 'archive'],
    'with none, Remaining is - an empty first section reads as a broken page');
  for (const starred of [true, false]) {
    for (const home of [true, false]) {
      const order = menuSectionOrder(starred, home);
      assert.strictEqual(order[order.length - 1], 'archive',
        'and the Archive is the last row in every case');
    }
  }

  // The Archive is one of the four, not a stray link below them, and it is the
  // one that carries a second class: its row also refreshes the count.
  const meta = listJs.slice(listJs.indexOf('  menuSections() {'),
    listJs.indexOf('  sectionCount('));
  assert.ok(/archive: \{ icon: 'fa-archive', labelKey: 'archives'/.test(meta),
    'the Archive row has its icon and its name');
  assert.ok(/js-open-archived-board/.test(meta), 'and opens the section');
  for (const type of ['remaining', 'starred', 'templates']) {
    assert.ok(meta.includes(`${type}: {`), `${type} is drawn by the same loop`);
  }
  // Above the workspaces tree - the four board lists are one group.
  const treeAt = menu.indexOf('+workspaceTree');
  assert.ok(treeAt !== -1 && rowStart < treeAt, 'above the workspaces tree');

  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.strictEqual(en.archives, 'Archive', 'which is an existing translation');
  // The Archive's count is the SERVER's, not a count of what this page can see:
  // the page does not subscribe to archived boards unless that section is open.
  assert.ok(/archivedBoardsCount/.test(listJs), 'the Archive count comes from the server');

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
    // Flush on three sides now - the menu starts at the window's left edge,
    // directly under the header, and runs to the bottom - so it keeps a border
    // and a corner only on the side facing the page. A rounded corner on a
    // flush edge shows the grey behind it, which is the gap this removed.
    ['border-inline-start', '0'],
    ['border-top', '0'],
    ['border-bottom', '0'],
    ['border-radius', '0'],
  ]) {
    assert.ok(panel.includes(`${prop}: ${value}`), `the menu is a panel: ${prop}`);
    assert.ok(adminPanel.includes(`${prop}: ${value}`),
      `...the same ${prop} the Admin Panel's menu uses`);
  }
  // Nothing above it, either. The Admin Panel's row carried a top padding that
  // put grey between the header and the menu; the main body carries it now,
  // because content is not meant to be flush against a bar.
  const rowAt = admin.indexOf('.setting-content .content-body {');
  const row = admin.slice(rowAt, admin.indexOf('}', rowAt));
  assert.ok(/padding-top:\s*0/.test(row), 'no grey above the Admin Panel menu');
  assert.ok(/padding-block-start:\s*18px/.test(
    admin.slice(admin.indexOf('.main-body {'), admin.indexOf('.main-body {') + 300)),
    '...and the content it used to space keeps its room');
  // All Boards: a gap is BETWEEN tracks, so it never insets the menu from the
  // window edge - which a `gap` shorthand plus a wrapper padding used to.
  const gridAt = boards.indexOf('.boards-layout {');
  const grid = boards.slice(gridAt, boards.indexOf('}', gridAt));
  assert.ok(/column-gap:\s*16px/.test(grid), 'the gap is between the columns only');
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

  // A selected WORKSPACE is the same kind of selection and gets the same
  // treatment. It was left on the old flat #f0f0f0 when the rows above it were
  // themed, so picking a workspace looked like nothing had been picked.
  const wsAt = boards.indexOf('.workspace-node.active > .workspace-node-content .js-select-space,');
  assert.notStrictEqual(wsAt, -1, 'the selected workspace is styled');
  const ws = boards.slice(wsAt, boards.indexOf('}', wsAt));
  assert.ok(/background: var\(--theme-accent, #2980b9\)/.test(ws),
    'filled with the theme, like the menu row above it');
  assert.ok(/\.workspace-node\.active > \.workspace-node-content:hover/.test(ws),
    'hover listed on the active rule, or the white hover below washes it out');
  assert.ok(/color: #fff/.test(boards.slice(wsAt, wsAt + 900)),
    'and its label and icon go white');
  // Its count is NOT part of that fill, and must not be styled as if it were.
  // The accent covers `.js-select-space` - the icon and the name - while the ⋯
  // menu and the count sit after it on the panel's own light grey. A light pill
  // "for contrast against the fill" was white on light grey, so the selected
  // workspace was the one row whose board count could not be read. It keeps the
  // same grey pill as every other row.
  assert.ok(!/\.workspace-node\.active[^{]*\.workspace-count\s*\{/
    .test(boards.replace(/\/\*[\s\S]*?\*\//g, '')),
    'the active row must not restyle a count that is outside its fill');

  // ...and the class it is styled for is actually applied. `selectedWorkspaceId`
  // is a template ARGUMENT, not a helper, and inside `each nodes` the data
  // context is the node - so a bare lookup found nothing, `$eq` compared an id
  // with undefined, and no workspace ever became `active`. The highlight was
  // styled for a class that never appeared.
  const jade = read('client/components/boards/boardsList.jade');
  const tree = jade.slice(jade.indexOf('template(name="workspaceTree")'));
  const eachAt = tree.indexOf('each nodes');
  const body = tree.slice(eachAt);
  assert.ok(/\$eq id \.\.\/selectedWorkspaceId/.test(body),
    'the active test reaches the PARENT context');
  assert.ok(!/\$eq id selectedWorkspaceId/.test(body),
    'and not the node, which has no such field');
  // The recursion too, or a nested workspace can never highlight.
  assert.ok(/\+workspaceTree\(nodes=children selectedWorkspaceId=\.\.\/selectedWorkspaceId\)/
    .test(body), 'and it is passed down the tree, not lost at the first level');
  // The anchor the highlight paints really carries that class.
  assert.ok(/a\.js-select-workspace\.js-select-space/.test(tree),
    'the row carries the class the CSS names');

  // The ROWS are laid out like the Admin Panel's too, not only coloured like
  // them. A selected row there is a block across the menu; here it was a
  // rounded pill floating inside a padded panel, which is a different-looking
  // menu wearing the same colours.
  const rowAt2 = boards.indexOf('.boards-left-menu .menu-item {');
  const rowMargin = boards.slice(rowAt2, boards.indexOf('}', rowAt2));
  assert.ok(/margin:\s*2px 4px/.test(rowMargin), "the rows use the Admin Panel's margins");
  assert.ok(/li \{\s*\n\s*margin: 2px 4px;/.test(admin),
    '...which is what that menu really uses');
  const anchorAt = boards.indexOf('.boards-left-menu .menu-item a {');
  const anchor = boards.slice(anchorAt, boards.indexOf('}', anchorAt));
  assert.ok(!/border-radius/.test(anchor),
    'and no rounded corners - a selected row is a block, not a pill');
  assert.ok(/padding-block:\s*12px/.test(anchor) && /padding-inline-start:\s*18px/.test(anchor),
    "the same block padding and reading-direction indent the Admin Panel's rows use");
  assert.ok(admin.includes('padding-inline-start: 18px'), '...as that one does');
  // The panel adds no padding of its own, or every row is inset twice.
  assert.ok(/padding:\s*0/.test(panel), 'the panel itself adds no side padding');

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
  const overrideAt = boards.indexOf('#content > .wrapper.all-boards-wrapper {');
  assert.notStrictEqual(overrideAt, -1, 'All Boards opts out of that inset');
  const override = boards.slice(overrideAt, boards.indexOf('}', overrideAt));
  assert.ok(/width:\s*100%/.test(override) && /margin:\s*0/.test(override),
    'edge to edge');
  // The rule it answers sets a margin AND a padding: the margin is the grey
  // above the menu, the padding the grey to its left. Zeroing only the margin
  // left the padding, and the first version of this override did exactly that.
  assert.ok(/padding:\s*0/.test(override), 'and no padding either');
  assert.ok(/#content > \.wrapper \{[^}]*padding:\s*15px/s.test(layouts),
    'the padding this answers is real');
  assert.ok(/#content > \.wrapper \{[^}]*margin-top:\s*10px/s.test(layouts),
    'and so is the margin');
  // ...and it must WIN. `#content > .wrapper` and `#content .all-boards-wrapper`
  // weigh the same, so which applied came down to stylesheet order; the extra
  // class settles it.
  const weight = sel => ((sel.match(/#/g) || []).length) * 100
    + ((sel.match(/\.[a-z-]+/gi) || []).length) * 10;
  assert.ok(weight('#content > .wrapper.all-boards-wrapper') > weight('#content > .wrapper'),
    'the override outweighs the rule it answers rather than relying on order');

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

test('and selecting it does not fall back to Remaining', () => {
  // The tree autorun treats anything that is not a SECTION as a workspace id,
  // and a workspace missing from the tree was deleted - so it resets to
  // Remaining. The three section names were written out by hand there, so
  // `archive` was read as a workspace id, not found, and clicking Boards in
  // Archive highlighted Remaining instead of itself.
  const js = read('client/components/boards/boardsList.js');
  const at = js.indexOf("this.selectedMenu.set('remaining')");
  assert.notStrictEqual(at, -1, 'the fallback still exists');
  const guard = js.slice(js.lastIndexOf('const sel =', at), at);
  assert.ok(/!ALL_BOARDS_SECTIONS\.includes\(sel\)/.test(guard),
    'the sections come from the one list, not from names written out here');
  assert.ok(!/sel !== 'starred'/.test(guard), 'no hand-written section names left');
  // ...and that list really contains archive, so the fix is not just tidier
  // code that fails the same way.
  const { ALL_BOARDS_SECTIONS } = require('../models/lib/allBoardsUrls');
  assert.ok(ALL_BOARDS_SECTIONS.includes('archive'), 'archive is a section');
  for (const s of ['starred', 'templates', 'remaining']) {
    assert.ok(ALL_BOARDS_SECTIONS.includes(s), `${s} is still a section`);
  }
  // The name it reads has to be imported, or it is a ReferenceError at runtime
  // that no unit test would see.
  assert.ok(/import \{[^}]*ALL_BOARDS_SECTIONS[^}]*\} from '\/models\/lib\/allBoardsUrls'/.test(js),
    'ALL_BOARDS_SECTIONS is imported where it is used');
});

test('and the page content clears the window edge', () => {
  // Taking the left menu to the window's LEFT edge dropped the wrapper's inset
  // on both sides, so right-hand content ran to the edge and past it - the
  // archive pager's ">" was half outside, and `#content` is
  // `overflow-x: hidden`, so the half outside was cut off rather than
  // scrollable.
  const css = read('client/components/boards/boardsList.css');
  const at = css.indexOf('.boards-layout > .boards-right-grid {');
  assert.notStrictEqual(at, -1, 'the right column is inset from the window edge');
  const rule = css.slice(at, css.indexOf('}', at));
  // Logical, so a right-to-left layout insets the side that is actually far.
  assert.ok(/padding-inline-end:\s*\d+px/.test(rule), 'with a LOGICAL padding');
  assert.ok(!/padding-right/.test(rule), 'not a physical one');

  // ...and it starts on the same line the menu's first ROW does, rather than
  // flush against the header - the boards, the archive's search field and its
  // pager all began at the very top, so the first tile looked cut off while the
  // highlighted menu row beside it had a clear edge.
  const top = /padding-block-start:\s*(\d+)px/.exec(rule);
  assert.ok(top, 'the column is offset from the header');
  // Read here rather than borrowed: this test has `css`, not the other's names.
  const menuAt = css.indexOf('.boards-left-menu {');
  const menuRule = css.slice(menuAt, css.indexOf('}', menuAt));
  const panelTop = /padding-block-start:\s*(\d+)px/.exec(menuRule);
  const rowAt3 = css.indexOf('.boards-left-menu .menu-item {');
  const rowMargin = /margin:\s*(\d+)px/.exec(css.slice(rowAt3, css.indexOf('}', rowAt3)));
  assert.ok(panelTop && rowMargin, 'the menu\'s own offset is readable');
  assert.strictEqual(Number(top[1]), Number(panelTop[1]) + Number(rowMargin[1]),
    'and it is the menu\'s panel padding plus its row margin, not a number '
    + 'picked to look right once');
  // On the COLUMN, not back on the wrapper: the wrapper holds the menu too, and
  // an inset there would push the menu off the edge it must sit against.
  const wrapAt = css.indexOf('#content > .wrapper.all-boards-wrapper {');
  const wrap = css.slice(wrapAt, css.indexOf('}', wrapAt));
  assert.ok(/margin:\s*0/.test(wrap) && /padding:\s*0/.test(wrap),
    'the wrapper itself stays flush, on every side');
  // ...and the clipping this works around is real.
  assert.ok(/#content \{[^}]*overflow-x:\s*hidden/s
    .test(read('client/components/main/layouts.css')),
    'overflow-x: hidden is why an overflow is invisible rather than scrollable');
});

test('and a disabled pager is dimmed, not erased', () => {
  // 0.4 was chosen when every accent was a deep colour. The colour-slide themes
  // are built on light bases, and at 0.4 an outline in one of those on a
  // near-white page all but disappears - on a one-page list, where BOTH arrows
  // are disabled, the pager read as broken rather than exhausted.
  const css = read('client/components/main/paginationControls.css');
  const at = css.indexOf('.table-page-pagination button.disabled,');
  assert.notStrictEqual(at, -1);
  const rule = css.slice(at, css.indexOf('}', at));
  const opacity = /opacity:\s*([\d.]+)/.exec(rule);
  assert.ok(opacity, 'a disabled pager is dimmed');
  const value = Number(opacity[1]);
  // The button is FILLED with the theme, so dimming is what takes the theme
  // back out of it: at 0.4 the belize blue arrived on the page's grey as a pale
  // wash with no resemblance to the header above. It has to stay recognisably
  // the theme colour and still read as flatter than an enabled button.
  assert.ok(value >= 0.8, `${value} dims the theme colour out of the button`);
  assert.ok(value < 1, `${value} would not read as disabled at all`);
  // It still has to be weaker than an enabled one - that is the rule's job.
  assert.ok(/pointer-events:\s*none/.test(rule), 'and is not clickable');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\narchivePage: ${passed} tests passed`);
