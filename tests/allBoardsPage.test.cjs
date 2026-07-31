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

const bar = jade.slice(jade.indexOf('template(name="boardListHeaderBar")'),
  jade.indexOf('template(name="allBoardsRow")'));
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

test('the controls are in the header bar, styled like the board header', () => {
  for (const control of ['js-open-boards-sort', 'js-board-search-input',
    'js-open-all-boards-view', 'js-multiselection-activate']) {
    assert.ok(bar.includes(control), `${control} must be in the header bar`);
  }
  // The same look as the Swimlanes view's board header: .board-header-btn and the
  // same Font Awesome glyphs, not a set of styles of this page's own.
  for (const icon of ['fa-sort', 'fa-search', 'fa-check-square-o']) {
    assert.ok(bar.includes(icon), `${icon} is the board header's glyph for it`);
  }
  assert.ok((bar.match(/a\.board-header-btn\./g) || []).length >= 4,
    'the controls are board-header buttons');
});

test('and Starred is not one of them - the left menu is where sections live', () => {
  // It was the first button in the bar. Starred is a SECTION, and the left menu
  // already lists it beside Templates and Remaining, counts it, and highlights
  // it when it is the one shown; a second way to reach it one click away is a
  // control that only has to be kept in step with the first.
  assert.ok(!bar.includes('data-type="starred"'), 'no Starred button in the bar');
  assert.ok(!/js-select-menu/.test(bar), 'and no section switch of any kind');
  assert.ok(jade.includes('a.js-select-menu(data-type="starred")'),
    'the left menu still has it');

  // Its handler and its helper were the header bar's, and had no other caller
  // there - the left menu is part of `boardList` and has its own.
  const barJs = js.slice(js.indexOf('Template.boardListHeaderBar.events({'),
    js.indexOf('Template.allBoardsViewPopup'));
  assert.ok(!/js-select-menu/.test(barJs), 'the bar no longer handles a section click');
  assert.ok(!/isSelectedMenu/.test(barJs), 'nor asks which section is selected');
  const pageJs = js.slice(js.indexOf('Template.boardList.events({', js.indexOf('boardsForView')));
  assert.ok(/'click \.js-select-menu'/.test(pageJs),
    'the left menu keeps its own handler, which is the one that was doing the work');
});

test('and the page has no second controls row at all', () => {
  // This first landed with the actions ON a selection left behind in the page,
  // beside the boards they act on. xet7 asked for ALL of them in the header
  // bar: one bar of controls, not one bar and a strip. So the page body keeps
  // nothing but the section title, and `.path-right` is gone with the rest.
  for (const moved of ['js-open-boards-sort', 'js-board-search-input',
    'js-multiselection-activate', 'multiselection-group', 'js-multiselection-reset',
    'js-archive-selected-boards', 'js-duplicate-selected-boards',
    'js-star-selected', 'js-home-selected', 'path-right']) {
    assert.ok(!page.includes(moved), `${moved} must not be in the page body`);
  }

  for (const control of ['js-archive-selected-boards', 'js-duplicate-selected-boards',
    'js-star-selected', 'js-home-selected']) {
    assert.ok(bar.includes(control), `${control} must be in the header bar`);
  }
  // They act on a selection, so they appear only while there IS one - four
  // buttons that would do nothing are worse than no buttons.
  assert.ok(/if hasBoardsSelected\n\s+a\.board-header-btn\.js-archive-selected-boards/.test(bar),
    'and only while something is selected');

  // Archive and duplicate were `button.js-…` with the class hung off the end;
  // in the bar they are `a.board-header-btn.js-…` like every other control, and
  // star and home stop being `.selected-action`, which no stylesheet has now.
  assert.ok(!/button\.js-(archive|duplicate)-selected-boards/.test(bar),
    'the selection actions take the header bar button style');
  assert.ok(!/selected-action\b/.test(bar), 'and not the page row’s own style');
  assert.strictEqual((bar.match(/\.js-star-selected/g) || []).length, 1);

  // "Selected:" still names the two icon-only buttons after it. It is a label,
  // not a control, so it must NOT be dressed up as a button.
  assert.ok(/span\.selected-label \{\{_ 'selected-label'\}\}/.test(bar),
    'the "Selected:" label comes with them');
  assert.ok(!/\.board-header-btn\.selected-label/.test(bar), 'as a label, not a button');
  const css = read('client/components/boards/boardsList.css');
  assert.ok(/\.all-boards-controls \.selected-label \{/.test(css),
    'and is styled where it now lives');
});

test('and no bar above the boards at all', () => {
  // Emptying the bar of its controls left a white strip above "+ Add Board"
  // carrying the current section's Font Awesome icon - which the left menu
  // already highlights and the header bar already names. The boards start at
  // the top of the column now.
  assert.ok(!jade.includes('boards-path-header'), 'the bar is gone from the template');
  for (const part of ['path-left', 'path-title', 'path-icon', 'path-text', 'currentMenuPath']) {
    assert.ok(!jade.includes(part), `${part} went with it`);
  }
  // And its helper, which nothing else called - 64 lines of resolving a
  // workspace path to an icon and a name for a strip nobody sees.
  assert.ok(!/currentMenuPath\(\)/.test(js), 'the helper that fed it is gone too');

  // On the RULES, not the comments: the rules that replaced these explain
  // themselves by naming the selector they used to have, and a guard that greps
  // the whole stylesheet reads that explanation and fails on correct CSS.
  const css = read('client/components/boards/boardsList.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/boards-path-header/.test(css), 'and every rule that styled it');
  // Its "look at me" hint animation had no other user.
  assert.ok(!/@keyframes pulse/.test(css) && !/multiselection-hint/.test(css),
    'including the hint animation that only it used');
});

test('Search is a field, not a button', () => {
  // On a board, Search opens a search view over cards; here it filters the list
  // it sits above, and a filter belongs in the bar it filters.
  assert.ok(/input\.js-board-search-input\(type="text"/.test(bar),
    'the header bar carries the input itself');
  assert.ok(bar.includes('js-board-search-clear'), 'with a clear button');
  assert.ok(!/js-open-search-view/.test(bar), 'and no search-view button');

  // It filters as you type, and Escape clears it - the old right-pane behaviour.
  const events = js.slice(js.indexOf('Template.boardListHeaderBar.events({'));
  const map = events.slice(0, events.indexOf('\n});'));
  assert.ok(/'input \.js-board-search-input'/.test(map), 'filters on input');
  assert.ok(/'keydown \.js-board-search-input'/.test(map) && /Escape/.test(map),
    'and Escape clears it');
});

test('and the field is styled where it actually lives', () => {
  // Its rules said `.boards-path-header .board-search` - the bar it used to be
  // in - so from the moment the controls moved to the header bar they matched
  // nothing and the box rendered at the browser's default input size, unstyled.
  // Comments stripped, for the same reason as above: these rules say in prose
  // which selector they replaced.
  const css = read('client/components/boards/boardsList.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const at = css.indexOf('.all-boards-controls .board-search {');
  assert.ok(at !== -1, 'the box must be styled under the bar it is in');
  assert.ok(!/\.boards-path-header \.board-search/.test(css), 'and not under one that is gone');
  assert.ok(/width: 150px;/.test(css.slice(at, css.indexOf('}', at))),
    'half of the 300px it was designed at');

  // The box is white on a themed bar, so everything inside it needs its own
  // colour: inheriting the bar's light-on-dark puts white text in a white box.
  const input = css.indexOf('.all-boards-controls .board-search input {');
  assert.ok(/color: #333;/.test(css.slice(input, css.indexOf('}', input))),
    'the typed text must be dark, not the bar’s colour');
  assert.ok(/\.all-boards-controls \.board-search \.emoji-icon,/.test(css),
    'and so must the magnifier and the clear button');
});

// ── the shared state ────────────────────────────────────────────────────────

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
  // matches it.
  assert.ok(!/board-view'\}\}/.test(bar.replace(/title="[^"]*"/g, '')),
    'the button label must not be the words "Board View"');
  assert.ok(/if isAllBoardsView 'table'[\s\S]{0,200}board-view-table/.test(bar),
    'it says Table when the Table view is on');
  assert.ok(/else[\s\S]{0,120}\{\{_ 'lists'\}\}/.test(bar),
    'and Lists otherwise');
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
  for (const section of ['## The controls live in the header bar', '## The view menu',
    '## The Table view']) {
    assert.ok(design.includes(section), `${section} must be described`);
  }
  assert.ok(/Search is a field/i.test(design), 'including that Search is a field');
  for (const m of design.matchAll(/`([\w.-]+\/[\w./-]+\.(?:jade|js|css|cjs))`/g)) {
    assert.ok(fs.existsSync(path.join(ROOT, m[1])),
      `the design doc names ${m[1]}, which does not exist`);
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
