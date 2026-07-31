'use strict';

// All Boards: one row of controls, in the header bar, and two views.
// Run: node tests/allBoardsPage.test.cjs
//
// The page used to carry its OWN controls row above the board icons -
// Multi-Selection with its archive and duplicate actions, Sort, the search box -
// inside `.boards-path-header`, while the second top header bar above it held
// only the title. Two rows of controls on one page, one styled like the board
// header of the Swimlanes view and one not.
//
// Design: docs/Design/Page/All-Boards.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/boards/boardsList.jade');
const js = read('client/components/boards/boardsList.js');
const design = read('docs/Design/Page/All-Boards.md');
// The All Boards sidebar: Search and Multi-Selection open it, and the actions on
// a selection live in it.
const sidebar = read('client/components/boards/allBoardsSidebar.jade');
const sidebarJs = read('client/components/boards/allBoardsSidebar.js');

const page = jade.slice(0, jade.indexOf('template(name="boardsSortPopup")'));
const row = jade.slice(jade.indexOf('template(name="allBoardsRow")'),
  jade.indexOf('template(name="allBoardsViewPopup")'));

// The PURE half: which views exist and which is the default. The ReactiveVars and
// localStorage that carry the choice are Meteor and cannot be loaded here, which
// is why the two are separate modules.
const {
  VIEWS, VIEW_LISTS, VIEW_TABLE, DEFAULT_VIEW,
  normalizeAllBoardsView, resolveAllBoardsView,
} = require('../models/lib/allBoardsView');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('allBoardsPage:');

// ── the controls, and where they are ────────────────────────────────────────

test('every control of this page is in its right sidebar', () => {
  // They have moved twice. First from a row of the page's own above the board
  // icons into the second header bar; now out of that bar, which is gone - the
  // first header bar names the page, and a page keeps its controls in a sidebar.
  for (const control of ['js-open-boards-sort', 'js-open-all-boards-view',
    'js-all-boards-sidebar-search', 'js-all-boards-sidebar-multiselection',
    'js-open-archived-board']) {
    assert.ok(sidebar.includes(control), `${control} must be a sidebar row`);
  }
  // Sort still says whether a sort is on, which was the point of its emphasis.
  assert.ok(/js-open-boards-sort\(class="\{\{#unless isBoardsSort 'custom'\}\}emphasis/.test(sidebar),
    'and Sort still shows when a sort other than the custom order is active');
  // The view menu still names the CURRENT view rather than itself.
  assert.ok(/if isAllBoardsView 'table'[\s\S]{0,120}board-view-table/.test(sidebar),
    'the view row says Table when Table is on');
  assert.ok(/\{\{_ 'lists'\}\}/.test(sidebar), 'and Lists otherwise');
});

test('and there is no second header bar left', () => {
  assert.ok(!/template\(name="boardListHeaderBar"\)/.test(jade), 'the bar is gone');
  const router = read('config/router.js');
  assert.ok(!/boardListHeaderBar/.test(router), 'and no route names it');
  // Its two handlers moved with their markup: a Blaze event map only sees
  // events inside its OWN template.
  assert.ok(/Template\.allBoardsHomeSidebar\.events\(\{[\s\S]{0,200}js-open-boards-sort/.test(js),
    'Sort is handled where it is drawn');
  assert.ok(/js-open-all-boards-view/.test(js.slice(js.indexOf('Template.allBoardsHomeSidebar.events({'))),
    'and so is the view menu');
  assert.ok(!/Template\.boardListHeaderBar\./.test(js),
    'nothing may still be registered on the bar that is gone');
});

test('and the page has no second controls row at all', () => {
  // This first landed with the actions ON a selection left behind in the page,
  // beside the boards they act on. They are in the SIDEBAR now, which is where
  // a board keeps them too, so neither the page nor the bar has them.
  for (const moved of ['js-open-boards-sort', 'js-board-search-input',
    'js-multiselection-activate', 'multiselection-group', 'js-multiselection-reset',
    'js-archive-selected-boards', 'js-duplicate-selected-boards',
    'js-star-selected', 'js-home-selected', 'path-right']) {
    assert.ok(!page.includes(moved), `${moved} must not be in the page body`);
  }
  for (const inSidebar of ['js-archive-selected-boards', 'js-duplicate-selected-boards',
    'js-star-selected', 'js-home-selected']) {
    assert.ok(sidebar.includes(inSidebar), `${inSidebar} must be in the sidebar`);
  }
});

test('and no bar above the boards at all', () => {
  // Emptying the bar of its controls left a white strip above "+ Add Board"
  // carrying the current section's Font Awesome icon - which the left menu
  // already highlights and the header bar already names.
  assert.ok(!jade.includes('boards-path-header'), 'the bar is gone from the template');
  for (const part of ['path-left', 'path-title', 'path-icon', 'path-text', 'currentMenuPath']) {
    assert.ok(!jade.includes(part), `${part} went with it`);
  }
  assert.ok(!/currentMenuPath\(\)/.test(js), 'the helper that fed it is gone too');

  // On the RULES, not the comments: the rules that replaced these explain
  // themselves by naming the selector they used to have.
  const css = read('client/components/boards/boardsList.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/boards-path-header/.test(css), 'and every rule that styled it');
  // Its "look at me" hint animation had no other user.
  assert.ok(!/@keyframes pulse/.test(css), 'including the hint animation that only it used');
});

// ── Search and Multi-Selection: the same controls a board has ───────────────

test('Search is a sidebar row, and the field is a view of the sidebar', () => {
  // It has been three things: a FIELD in the header bar, then the shared button
  // the board header has, and now a row of the sidebar - because the bar it was
  // a button in is gone. It still opens the same search view.
  assert.ok(/js-all-boards-sidebar-search/.test(sidebar), 'Search is a row');
  assert.ok(/input\.js-board-search-input/.test(sidebar), 'and the field is a view');
  assert.ok(/aria-label="\{\{_ 'search-boards'\}\}"/.test(sidebar), 'named for screen readers');
  const events = sidebarJs.slice(sidebarJs.indexOf('Template.allBoardsSearchSidebar.events({'));
  const map = events.slice(0, events.indexOf('\n});'));
  assert.ok(/'input \.js-board-search-input'/.test(map), 'filters on input');
  assert.ok(/allBoardsSearchVar\.set/.test(map),
    "and into the page's own term, so the board list behind it narrows");
});

test('and the rows open the sidebar on their own view', () => {
  const map = sidebarJs.slice(sidebarJs.indexOf('Template.allBoardsHomeSidebar.events({'));
  const events = map.slice(0, map.indexOf('\n});'));
  assert.ok(/openAllBoardsSidebar\(SIDEBAR_SEARCH\)/.test(events), 'Search opens its view');
  assert.ok(/openAllBoardsSidebar\(SIDEBAR_MULTISELECTION\)/.test(events),
    'Multi-Selection opens its own');
});

test('the sidebar borrows the board sidebar shell, not its contents', () => {
  // The board sidebar is built around a board - members, labels, activities,
  // settings - and All Boards has no board. Same shell, own views.
  assert.ok(/\.board-sidebar\.sidebar\.all-boards-sidebar/.test(sidebar),
    'the same shell classes, so it looks like the one on a board');
  assert.ok(/\{\{#if isSidebarOpen\}\}is-open\{\{\/if\}\}/.test(sidebar),
    'opened the same way');
  assert.ok(/\.sidebar-content/.test(sidebar) && /sidebar-xmark/.test(sidebar),
    'with the same content area and close button');
  for (const view of ['allBoardsHomeSidebar', 'allBoardsSearchSidebar',
    'allBoardsMultiSelectionSidebar']) {
    assert.ok(sidebar.includes(`template(name="${view}")`), `${view} must exist`);
  }
});

test('it is painted with a theme, or its buttons are unreadable', () => {
  // `.sidebar .sidebar-content .sidebar-btn` is a light grey box whose text is
  // WHITE. What makes that readable on a board is a `.board-color-*` ancestor
  // replacing the grey with a themed colour - and this page has no board, so
  // without a class here every button was white on light grey. It shipped that
  // way and xet7 reported it.
  assert.ok(/themeClass\(\) \{[\s\S]{0,120}'board-color-belize'/.test(sidebarJs),
    'the default theme outside a board');
  // Which must be a theme that really styles a sidebar button.
  const colors = read('client/components/boards/boardColors.css');
  const rule = /\.board-color-belize (\.sidebar \.sidebar-content \.sidebar-btn) \{/.exec(colors);
  assert.ok(rule, 'board-color-belize must define a sidebar button');

  // On an ANCESTOR, never on the sidebar itself. Every themed sidebar rule is a
  // DESCENDANT selector - `.board-color-belize .sidebar .sidebar-content
  // .sidebar-btn` - so a class on the `.sidebar` element matches nothing at all.
  // The first version of this put it there, and the buttons stayed white on
  // light grey; the guard passed, because it only asked whether the class was
  // somewhere in the file.
  const shell = /\.board-sidebar\.sidebar\.all-boards-sidebar\(class="([^"]*)"\)/.exec(sidebar);
  assert.ok(shell, 'the shell element must be findable');
  assert.ok(!/themeClass/.test(shell[1]),
    'the theme class on the sidebar element itself would match nothing');
  const wrapper = /\.all-boards-sidebar-theme\(class="\{\{themeClass\}\}"\)\n(\s+)\.board-sidebar\.sidebar\.all-boards-sidebar/
    .exec(sidebar);
  assert.ok(wrapper, 'it goes on a wrapper that CONTAINS the sidebar');
  // The SAME theme at every width. It is a class on the element, in the
  // template, so no media query can take it away - only the panel's GEOMETRY is
  // desktop-only. (boardsList.css does name board-color-belize elsewhere: it is
  // one of the seventeen colours a board TILE can be, which is unrelated.)
  const css = read('client/components/boards/boardsList.css');
  const desktop = css.slice(css.indexOf('@media screen and (min-width: 801px)'));
  assert.ok(!/board-color/.test(desktop.slice(0, desktop.indexOf('\n}\n'))),
    'the desktop-only block must not be where the theme comes from');
});

test('and it is pinned to the viewport, below the header, on a desktop', () => {
  // It first inherited `position: absolute` from the board sidebar, which
  // resolves against the nearest positioned ancestor. On a board that is the
  // board container - below the header, down to the window bottom. This page
  // has no such container, so the panel floated in the middle of the page, over
  // the board icons, ending as soon as its content did.
  const css = read('client/components/boards/boardsList.css');
  // The rule is shared with the page sidebar now - same shell, same need to be
  // pinned below the header - so it is a selector LIST, not one selector.
  const at = css.indexOf('.all-boards-sidebar.sidebar,');
  assert.notStrictEqual(at, -1, 'the panel must place itself');
  assert.ok(/\.all-boards-sidebar\.sidebar,\n\s+\.page-sidebar\.sidebar \{/.test(css),
    'and the shared page sidebar is placed the same way');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(/position: fixed;/.test(rule), 'pinned to the viewport');
  assert.ok(/top: var\(--wekan-header-height, 0px\);/.test(rule),
    'below the header, at the height the header MEASURES - it is not a constant');
  assert.ok(/bottom: 0;/.test(rule), 'and down to the window bottom');
  // That variable has to be something the app actually publishes.
  assert.ok(/--wekan-header-height/.test(read('client/lib/utils.js')),
    'and utils.js must keep --wekan-header-height current');

  // Desktop only. On a phone the sidebar is full width, which sidebar.css
  // already does for `.board-sidebar.sidebar` below 800px - this element
  // carries that class, so it is covered.
  const media = css.slice(0, at).lastIndexOf('@media');
  assert.ok(media !== -1 && /min-width: 801px/.test(css.slice(media, at)),
    'these rules must be desktop-only');
});

test('and the boards move left instead of hiding under it', () => {
  const css = read('client/components/boards/boardsList.css');
  assert.ok(/\.all-boards-wrapper\.sidebar-open \.boards-layout \{[^}]*margin-inline-end: 420px;/.test(css),
    'the layout gives the panel its width back');
  assert.ok(/\.wrapper\.all-boards-wrapper\(class="\{\{#if isSidebarOpen\}\}sidebar-open\{\{\/if\}\}"\)/.test(jade),
    'and the page says when the panel is open');
  // 420px is the sidebar's own width, not a number of its own.
  assert.ok(/\.board-sidebar \{[^}]*width: 420px;/.test(read('client/components/sidebar/sidebar.css')),
    'which is what the sidebar is wide');
});

test('and the views the sidebar has are the ones it draws', () => {
  const {
    SIDEBAR_VIEWS, DEFAULT_SIDEBAR_VIEW, SIDEBAR_HOME,
    normalizeSidebarView, resolveSidebarView, sidebarViewTemplate, sidebarViewTitleKey,
  } = require('../models/lib/allBoardsSidebar');
  assert.deepStrictEqual(SIDEBAR_VIEWS, ['home', 'search', 'multiselection']);
  assert.strictEqual(DEFAULT_SIDEBAR_VIEW, SIDEBAR_HOME,
    'the hamburger opens home, as it does on a board');

  // Every view resolves to a template that exists.
  for (const view of SIDEBAR_VIEWS) {
    assert.ok(sidebar.includes(`template(name="${sidebarViewTemplate(view)}")`),
      `${view} must have a template`);
  }
  // Junk falls back rather than rendering nothing.
  for (const junk of [null, undefined, '', 'nonsense', 7]) {
    assert.strictEqual(normalizeSidebarView(junk), null, 'not a view');
    assert.strictEqual(resolveSidebarView(junk), SIDEBAR_HOME, 'falls back to home');
  }
  // Home shows no title and no back arrow: there is nothing behind it.
  assert.strictEqual(sidebarViewTitleKey(SIDEBAR_HOME), null);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const view of ['search', 'multiselection']) {
    assert.ok(sidebarViewTitleKey(view) in en, `${view} has a translated title`);
  }
});

test('and Starred is not a control - the left menu is where sections live', () => {
  // It was the first button in the header bar. Starred is a SECTION, and the
  // left menu already lists it beside Templates and Remaining, counts it, and
  // highlights it when it is the one shown.
  assert.ok(!sidebar.includes("data-type=\"starred\""), 'not a sidebar row either');
  assert.ok(!/js-select-menu/.test(sidebar), 'and no section switch in the panel');
  assert.ok(jade.includes('a.js-select-menu(data-type="starred")'),
    'the left menu still has it');
});

test('the two templates share one search term and one selected section', () => {
  // boardListHeaderBar and boardList are separate Blaze instances - the bar is
  // rendered into the layout's headerBar region - so a ReactiveVar on either is
  // invisible to the other, and the search field would filter nothing.
  assert.ok(/this\.selectedMenu = allBoardsMenuVar;/.test(js),
    'the page uses the shared section var');
  assert.ok(/this\.boardSearchVar = allBoardsSearchVar;/.test(js),
    'and the shared search var');
  assert.ok(!/this\.boardSearchVar = new ReactiveVar/.test(js),
    'not an instance var of its own');
});

// ── the view menu ───────────────────────────────────────────────────────────

test('the view row names the current view, not itself', () => {
  // The board header says "Swimlanes" or "Lists", never "Board View"; this
  // matches it, now as a sidebar row rather than a header button.
  assert.ok(!/board-view'\}\}/.test(sidebar.replace(/title="[^"]*"/g, '')),
    'the row label must not be the words "Board View"');
  assert.ok(/if isAllBoardsView 'table'[\s\S]{0,160}board-view-table/.test(sidebar),
    'it says Table when the Table view is on');
  assert.ok(/\{\{_ 'lists'\}\}/.test(sidebar), 'and Lists otherwise');
});

test('two views, and Lists is the default', () => {
  assert.deepStrictEqual(VIEWS, [VIEW_LISTS, VIEW_TABLE], 'exactly Lists and Table');
  assert.strictEqual(VIEW_LISTS, 'lists');
  assert.strictEqual(DEFAULT_VIEW, VIEW_LISTS, 'Lists is the default');

  // Never chosen, and anything a future version (or a user) might leave behind:
  // the page renders Lists rather than nothing.
  for (const stored of [null, undefined, '', 'nonsense', 'swimlanes', 0]) {
    assert.strictEqual(resolveAllBoardsView(stored), VIEW_LISTS,
      `${JSON.stringify(stored)} must fall back to Lists`);
  }
  assert.strictEqual(resolveAllBoardsView(VIEW_TABLE), VIEW_TABLE,
    'and a real choice is kept');

  // null, not the default, so a caller can tell "never chosen" from "chose Lists".
  assert.strictEqual(normalizeAllBoardsView('nonsense'), null);
  assert.strictEqual(normalizeAllBoardsView(VIEW_LISTS), VIEW_LISTS);
});

test('the client half stores the choice per browser, not on the profile', () => {
  const client = read('client/lib/allBoardsView.js');
  assert.ok(/localStorage\.setItem\(STORAGE_KEY/.test(client), 'kept in localStorage');
  // On the CODE: the comment there explains the choice by naming the profile, and
  // a guard that reads its own explanation fails on it.
  const code = client.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/profile/.test(code), 'not on the user document');
  // Storage can throw (private mode); the choice must still apply for the session.
  assert.ok(/catch \(e\) \{/.test(client), 'and a refusing storage is survivable');
});

test('the popup offers exactly those two, with the current one checked', () => {
  const popup = jade.slice(jade.indexOf('template(name="allBoardsViewPopup")'));
  const entries = popup.slice(0, popup.indexOf('template(name="workspaceTree")'));
  assert.ok(/js-all-boards-view-lists/.test(entries) && /js-all-boards-view-table/.test(entries));
  assert.strictEqual((entries.match(/fa-check/g) || []).length, 2,
    'each entry shows a check when it is the current one');
  assert.ok(!/gantt|calendar|swimlanes|stats/i.test(entries),
    'and no other view - this page has two');
});

// ── the Table view ──────────────────────────────────────────────────────────

test('the Table view is the shared table page', () => {
  assert.ok(/if isAllBoardsView 'table'\n\s+\+tablePage\(tablePageData\)/.test(jade),
    'Table renders the shared table page');
  assert.ok(/else\n/.test(jade), 'and Lists is the other branch');
  assert.ok(/rowTemplate: 'allBoardsRow'/.test(js), 'with its own row template');
});

test('its columns are Edit, Board title, Board description', () => {
  const at = js.indexOf('const ALL_BOARDS_COLUMNS = [');
  const spec = js.slice(at, js.indexOf('];', at));
  const keys = [...spec.matchAll(/labelKey: '([\w-]+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(keys, ['edit', 'title', 'description']);

  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const k of keys) assert.ok(k in en, `${k} must be a translation key`);

  const cells = (row.match(/^\s{4}td\./gm) || []).length;
  assert.strictEqual(cells, keys.length, 'one cell per column, or the table is shifted');
});

test('Edit opens the SAME popup the Swimlanes view opens', () => {
  assert.ok(/'click \.js-edit-board-title-row': Popup\.open\('boardChangeTitle'\)/.test(js),
    'the row opens boardChangeTitle');
  const header = read('client/components/boards/boardHeader.js');
  assert.ok(/'click \.js-edit-board-title': Popup\.open\('boardChangeTitle'\)/.test(header),
    'which is the one the board header opens');

  // It took one change to make that true: the submit read Utils.getCurrentBoard(),
  // and on All Boards there is no current board.
  const submit = header.slice(header.indexOf('Template.boardChangeTitlePopup.events({'));
  const body = submit.slice(0, submit.indexOf('\n});'));
  assert.ok(/Template\.currentData\(\)/.test(body),
    'the popup must take the board from its data context when it has one');
  assert.ok(/Utils\.getCurrentBoard\(\)/.test(body),
    'and still fall back to the current board, so the board header is unchanged');
});

test('the Table draws the same boards as the Lists view', () => {
  // Two copies of "which boards am I looking at" would be two answers to it.
  assert.ok(/function boardsForView\(tpl\)/.test(js), 'the set is computed once');
  assert.ok(/const all = boardsForView\(tpl\);/.test(js), 'the Table uses it');
  assert.ok(/return boardsForView\(Template\.instance\(\)\);/.test(js),
    'and so does the Lists view');
});

test('ten rows a page', () => {
  assert.ok(/TABLE_PAGE_ROWS_PER_PAGE/.test(js), 'the shared rows-per-page');
  assert.ok(/TABLE_PAGE_ROWS_PER_PAGE = 10/.test(read('models/lib/tablePage.js')),
    'which is ten');
});

// ── a helper belongs to ONE template ────────────────────────────────────────

test('every template registers the helpers it uses', () => {
  // `boardList` chooses between the board icons and the Table with
  // {{isAllBoardsView 'table'}}, but the helper was registered only on
  // `boardListHeaderBar` and `allBoardsViewPopup`. A Blaze helper belongs to
  // the template it is registered on, so the page threw "No such function:
  // isAllBoardsView" the moment it rendered - and nothing here noticed,
  // because the jade and the js were each checked on their own.
  //
  // Only helpers THIS file defines are checked: a name it registers nowhere is
  // a model helper on the data context (`colorClass` on a board) or a global,
  // and this test cannot tell those apart from a typo.
  const registered = {};
  const re = /Template\.(\w+)\.helpers\(\{/g;
  let m;
  while ((m = re.exec(js))) {
    const start = m.index + m[0].length;
    let depth = 1;
    let i = start;
    while (i < js.length && depth > 0) {
      const c = js[i];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      i++;
    }
    registered[m[1]] = registered[m[1]] || new Set();
    for (const h of js.slice(start, i - 1).matchAll(/^ {2}([A-Za-z_$][\w$]*)\s*[(:]/gm)) {
      registered[m[1]].add(h[1]);
    }
  }
  const defined = new Set(Object.values(registered).flatMap(s => [...s]));
  assert.ok(defined.has('isAllBoardsView'), 'the helper this test was written for');

  const parts = jade.split(/^template\(name="(\w+)"\)$/m);
  const missing = [];
  for (let i = 1; i < parts.length; i += 2) {
    const [name, tmplBody] = [parts[i], parts[i + 1]];
    const used = new Set();
    for (const u of tmplBody.matchAll(/\{\{[#/]?\s*([A-Za-z_$][\w$]*)/g)) used.add(u[1]);
    for (const u of tmplBody.matchAll(/^\s*(?:if|unless|each|with)\s+([A-Za-z_$][\w$]*)/gm)) used.add(u[1]);
    for (const u of tmplBody.matchAll(/^\s*\+\w+\(([A-Za-z_$][\w$]*)\)/gm)) used.add(u[1]);
    for (const h of used) {
      if (defined.has(h) && !(registered[name] && registered[name].has(h))) {
        missing.push(`${name} uses ${h} but does not register it`);
      }
    }
  }
  assert.deepStrictEqual(missing, [], missing.join('; '));
});

// ── the design doc ──────────────────────────────────────────────────────────

test('the design doc says what is different and links to the shared one', () => {
  assert.ok(/Table\.md/.test(design), 'it links to the Table page design');
  for (const section of ['## The controls live in the header bar', '## The right sidebar',
    '## The view menu', '## The Table view']) {
    assert.ok(design.includes(section), `${section} must be described`);
  }
  // Search and Multi-Selection are shared with the board header, so what they
  // are is written once, in their own designs, and this one links to them.
  // (This used to assert "Search is a field" - it is a button now, and the
  // field is a view of the sidebar. docs/Design/Page/Search.md.)
  for (const shared of ['Search.md', 'Multi-Selection.md']) {
    assert.ok(design.includes(shared), `it links to ${shared}`);
    assert.ok(fs.existsSync(path.join(ROOT, 'docs/Design/Page', shared)), `${shared} must exist`);
  }
  assert.ok(!/Search is a field/i.test(design), 'and does not still call Search a field');

  // Every file any of the three names must exist.
  for (const doc of [design, read('docs/Design/Page/Search.md'),
    read('docs/Design/Page/Multi-Selection.md')]) {
    for (const m of doc.matchAll(/`([\w.-]+\/[\w./-]+\.(?:jade|js|css|cjs))`/g)) {
      assert.ok(fs.existsSync(path.join(ROOT, m[1])),
        `a design doc names ${m[1]}, which does not exist`);
    }
  }
  const table = read('docs/Design/Page/Table.md');
  assert.ok(/All-Boards\.md/.test(table),
    'Table.md must list the All Boards table among the pages that use it');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nallBoardsPage: ${passed} tests passed`);
