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
  for (const control of ['js-open-boards-sort', 'js-all-boards-sidebar-search',
    'js-all-boards-sidebar-multiselection', 'js-open-archived-board']) {
    assert.ok(sidebar.includes(control), `${control} must be a sidebar row`);
  }
  // ...except the VIEW menu, which is in the first top header bar: a view menu
  // says what you are looking AT, so it belongs beside the page's name rather
  // than behind a panel you have to open first.
  assert.ok(!sidebar.includes('js-open-all-boards-view'), 'the view menu is not a row');
  assert.ok(/template\(name="allBoardsViewMenu"\)/.test(jade), 'it is its own template');
  const header = read('client/components/main/header.jade');
  assert.ok(/if isAllBoardsPage\n\s+\+allBoardsViewMenu/.test(header),
    'which the first header bar renders on All Boards');
  // Sort still says whether a sort is on, which was the point of its emphasis.
  assert.ok(/js-open-boards-sort\(class="\{\{#unless isBoardsSort 'custom'\}\}emphasis/.test(sidebar),
    'and Sort still shows when a sort other than the custom order is active');

});

test('and there is no second header bar left', () => {
  assert.ok(!/template\(name="boardListHeaderBar"\)/.test(jade), 'the bar is gone');
  const router = read('config/router.js');
  assert.ok(!/boardListHeaderBar/.test(router), 'and no route names it');
  // Its two handlers moved with their markup: a Blaze event map only sees
  // events inside its OWN template.
  // Scoped to the BLOCK rather than to a character count: a character window
  // has to be widened every time a comment is added inside the map, and it is
  // the map that matters, not how long its first entry's comment is.
  const sortMapAt = js.indexOf('Template.allBoardsHomeSidebar.events({');
  assert.notStrictEqual(sortMapAt, -1, 'the home sidebar has an event map here');
  const sortMap = js.slice(sortMapAt, js.indexOf('\n});', sortMapAt));
  assert.ok(sortMap.includes('js-open-boards-sort'),
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
  assert.ok(/DEFAULT_GLOBAL_THEME_COLOR/.test(sidebarJs)
    && /board-color-\$\{DEFAULT_GLOBAL_THEME_COLOR\}/.test(sidebarJs),
  'the default theme outside a board comes from the shared app default');
  // Which must be a theme that really styles a sidebar button.
  const colors = read('client/components/boards/boardColors.css');
  const config = read('config/const.js');
  assert.ok(/DEFAULT_GLOBAL_THEME_COLOR\s*=\s*'appleglasspastel'/.test(config),
    'the shared app default is Apple Glass Pastel');
  const rule = /\.board-color-appleglasspastel (\.sidebar \.sidebar-content \.sidebar-btn) \{/.exec(colors);
  assert.ok(rule, 'board-color-appleglasspastel must define a sidebar button');

  // On an ANCESTOR, never on the sidebar itself. Every themed sidebar rule is a
  // DESCENDANT selector - `.board-color-appleglasspastel .sidebar .sidebar-content
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
  // desktop-only. (boardsList.css does name board-color-* elsewhere: those are
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
  // In the left menu's one row, drawn once per section, whose sections come
  // from menuSectionOrder(): client/components/boards/boardsList.js.
  assert.ok(jade.includes('each menuSections')
    && jade.includes('a.js-select-menu(class="{{extraClass}}" data-type="{{type}}")'),
    'the left menu still draws the section rows');
  const { menuSectionOrder } = require('../models/lib/allBoardsUrls');
  assert.ok(menuSectionOrder(true).includes('starred'), 'and Starred is one of them');
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

test('the view menu names the current view, not itself', () => {
  // The board header says "Swimlanes" or "Lists", never "Board View"; this
  // matches it. It is in the first header bar now, not the sidebar.
  const menu = jade.slice(jade.indexOf('template(name="allBoardsViewMenu")'));
  assert.ok(!/board-view'\}\}/.test(menu.replace(/title="[^"]*"/g, '')),
    'the label must not be the words "Board View"');
  assert.ok(/if isAllBoardsView 'table'[\s\S]{0,160}board-view-table/.test(menu),
    'it says Table when the Table view is on');
  assert.ok(/\{\{_ 'lists'\}\}/.test(menu), 'and Lists otherwise');
  // Its handler followed it out of the sidebar. The event map is read to its
  // closing line rather than the first 160 characters after it: a comment
  // explaining one handler is not a reason for this to fail.
  const mapAt = js.indexOf('Template.allBoardsViewMenu.events({');
  assert.notStrictEqual(mapAt, -1, 'the menu has an event map where it is drawn');
  const map = js.slice(mapAt, js.indexOf('\n});', mapAt));
  assert.ok(/js-open-all-boards-view/.test(map), 'and it is handled where it is drawn');
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

test('the right pane opens with a heading, the Admin Panel\'s own', () => {
  // xet7: "there should be title at top, like there is at Admin Panel /
  // Version right page title Version, with same font color and size".
  //
  // The SAME template and the SAME class, not a copy of the styling: two
  // headings written twice are two headings that drift apart, and the size and
  // colour are exactly what was asked to match.
  const jade = read('client/components/boards/boardsList.jade');
  assert.ok(/\+paneTitle\(allBoardsPaneTitle\)/.test(jade),
    "the pane title is the Admin Panel's own template");
  const paneTitle = read('client/components/settings/leftMenu.jade');
  assert.ok(/template\(name="paneTitle"\)/.test(paneTitle), 'which exists');
  assert.ok(/h1\.admin-pane-title/.test(paneTitle), 'and carries the one heading class');
  // Size and colour live in ONE place, and it is not this page.
  const adminCss = read('client/components/settings/settingBody.css');
  const rule = adminCss.slice(adminCss.indexOf('.admin-pane-title {'),
    adminCss.indexOf('}', adminCss.indexOf('.admin-pane-title {')));
  assert.ok(/font-size:/.test(rule) && /color:/.test(rule),
    'the shared class is what sets the size and the colour');
  const boardsCss = read('client/components/boards/boardsList.css');
  const own = boardsCss.slice(boardsCss.indexOf('.boards-right-grid > .admin-pane-title {'));
  const ownBody = own.slice(0, own.indexOf('}'));
  assert.ok(!/font-size|font-weight|(^|[^-])\bcolor:/.test(ownBody),
    'this page sets only the spacing - restating the size or colour here is how '
    + 'the two headings would drift apart');
  assert.ok(/margin-bottom/.test(ownBody),
    "...and it must set that, because the Admin Panel's own gap rule is scoped "
    + 'to its main-body and does not reach this page');

  // ONE title, above the view branch: the board icons and the Table are two
  // ways of showing the same section, not two sections.
  const grid = jade.slice(jade.indexOf('.boards-right-grid'), jade.indexOf('each boards'));
  assert.ok(grid.indexOf('+paneTitle') < grid.indexOf("if isAllBoardsView 'table'"),
    'drawn once, whichever view is on');
  assert.strictEqual((jade.match(/\+paneTitle/g) || []).length, 1, 'and only once');
});

test('...and every section of the page has a title to show', () => {
  const { ALL_BOARDS_SECTIONS, sectionTitleKey } =
    require('../models/lib/allBoardsUrls');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  // Every section, not just the ones that had a heading before: the request was
  // "update this at all right pages at All Boards page".
  for (const section of ALL_BOARDS_SECTIONS) {
    const key = sectionTitleKey(section);
    assert.ok(key, `${section} must have a title key`);
    assert.ok(en[key], `${section}: ${key} must be translated`);
  }
  // The heading, the first header bar and the highlighted menu row all read the
  // SAME key, so a section is never named two ways on one screen.
  const js = read('client/components/boards/boardsList.js');
  const helper = js.slice(js.indexOf('  allBoardsPaneTitle() {'),
    js.indexOf('  // The bookmarks, drawn as tiles'));
  assert.ok(/sectionTitleKey\(sel\)/.test(helper), 'the heading reads that key');
  // A WORKSPACE is named by what somebody typed, so it must not be translated -
  // a workspace called "starred" is not the Starred section.
  assert.ok(/label: node\.name/.test(helper), 'a workspace shows its own name');
  assert.ok(/titleKey: sectionTitleKey\(SECTION_WORKSPACES\)/.test(helper),
    'and a workspace that is gone, or a tree that has not arrived, still names '
    + 'the pane rather than leaving it blank');
});

test('the selected workspace still shows its board count', () => {
  // xet7: "selected workspace should have count of boards at right side of
  // workspace menu button."
  //
  // It was there and invisible. The accent fills `.js-select-space` - the icon
  // and the name - and the ⋯ menu and the count sit AFTER it, on the panel's
  // own light grey. A rule gave the count a white pill with white text "for
  // contrast against the filled row", but the count is not on the filled row:
  // white on light grey, on the one row where you have just asked which boards
  // are in it.
  const tree = jade.slice(jade.indexOf('template(name="workspaceTree")'));
  const node = tree.slice(0, tree.indexOf('\n\n//-'));
  // Order: the name's anchor, then the menu, then the count at the end.
  const nameAt = node.indexOf('a.js-select-workspace');
  const menuAt = node.indexOf('a.js-open-workspace-menu');
  const countAt = node.indexOf('span.workspace-count');
  assert.ok(nameAt !== -1 && menuAt !== -1 && countAt !== -1,
    'the row draws a name, a menu and a count');
  assert.ok(nameAt < menuAt && menuAt < countAt,
    'the count is at the END of the row, after the menu button');

  const css = read('client/components/boards/boardsList.css');
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // No white-on-light rule for the active row's count. The accent does not
  // reach it, so there is nothing for a light pill to contrast with.
  assert.ok(!/\.workspace-node\.active[^{]*\.workspace-count\s*\{/.test(code),
    'the active row must not restyle a count that is outside its fill');
  // It keeps the pill every other row has.
  const at = code.indexOf('.workspace-node .workspace-count {');
  assert.notStrictEqual(at, -1, 'the count has its own rule');
  const rule = code.slice(at, code.indexOf('}', at));
  assert.ok(/background: #ddd;/.test(rule), 'a grey pill, selected or not');

  // ...and it cannot be squeezed off the row by a long workspace name: the
  // name's anchor is flex: 1, so its two neighbours have to hold their size.
  assert.ok(/flex: 0 0 auto;/.test(rule), 'the count keeps its width');
  const menuRule = code.slice(code.indexOf('.workspace-node .js-open-workspace-menu {'));
  assert.ok(/flex: 0 0 auto;/.test(menuRule.slice(0, menuRule.indexOf('}'))),
    'and so does the menu button beside it');
  const anchor = code.slice(code.indexOf('.workspace-node .js-select-space {'));
  assert.ok(/min-width: 0;/.test(anchor.slice(0, anchor.indexOf('}'))),
    'so the NAME is what shrinks, which is what min-width: 0 allows');
});

for (const [name, fn] of tests) {
  try { fn(); passed++; console.log('  ok -', name); }
  catch (err) { console.error(`  FAIL - ${name}\n    ${err.message}`); process.exitCode = 1; }
}
console.log(`\nallBoardsPage: ${passed} tests passed`);
