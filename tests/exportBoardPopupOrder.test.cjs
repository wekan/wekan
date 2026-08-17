'use strict';

// The export popup: ONE popup, four scopes, grouped and in order.
// Run: node tests/exportBoardPopupOrder.test.cjs
//
// It was two menus. The board popup wrote nineteen formats of its own in
// sidebar.jade under four subheadings; the swimlane, list and card popups wrote
// five in exportScope.jade, in one narrow column with no panes - so "the export
// popup" looked like two different features depending on which menu opened it,
// and a format added to one was missing from the other.
//
// There is one template now (`exportScopeBody`), one helper object, and one
// TABLE of formats (`EXPORT_FORMAT_GROUPS`, exportScope.js), which is where the
// order, the grouping and the scope of every entry live:
//
//   PDF, Excel, HTML(board)
//   Dependencies:  JSON, SVG                              (board)
//   CSV:           (,), (;), TSV                          (board)
//   JSON:          JSON, JSON (without attachments), .zip,
//                  Kanboard, Trello, Jira, NextCloud Deck, OpenProject, GitHub,
//                  GitLab, Gitea, Forgejo, Asana, Zenkit  (board)
//
// so this guard reads the TABLE, not the markup: the markup is one `each` now,
// and there is nothing left in it to get out of order.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const jade = read('client/components/sidebar/sidebar.jade');
const js = read('client/components/sidebar/sidebar.js');
const scopeJade = read('client/components/boards/exportScope.jade');
const scopeJs = read('client/components/boards/exportScope.js');
const css = read('client/components/sidebar/sidebar.css');

// The formats table - the one place an entry, its group and its scope are
// written down - and the body that lays it out.
const table = scopeJs.slice(scopeJs.indexOf("const BOARD_ONLY = ['board'];"),
  scopeJs.indexOf('// Is this popup a whole board'));
const popup = jade.slice(jade.indexOf('template(name="exportBoardPopup")'),
  jade.indexOf('template(name="labelsWidget")'));
const body = scopeJade.slice(scopeJade.indexOf('template(name="exportScopeBody")'),
  scopeJade.indexOf('template(name="exportSwimlanePopup")'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('exportBoardPopupOrder:');

test('the formats appear in the order asked for', () => {
  const order = [
    // The three that render a board as a document to LOOK at sit together on
    // the first row; the groups under the headings are data to reimport.
    "key: 'pdf'", "key: 'excel'", "key: 'html'",
    "key: 'dep-json'", "key: 'dep-svg'",
    "key: 'csv'", "key: 'scsv'", "key: 'tsv'",
    "key: 'json'", "key: 'json-no-attachments'", "key: 'zip'",
    "key: 'kanboard'", "'trello'", "'jira'", "'deck'", "'openproject'",
    "'github'", "'gitlab'", "'gitea'", "'forgejo'", "'asana'", "'zenkit'",
  ];
  let previous = -1;
  for (const entry of order) {
    const at = table.indexOf(entry);
    assert.ok(at !== -1, `${entry} is in the table`);
    assert.ok(at > previous, `${entry} comes after the one before it`);
    previous = at;
  }
});

test('a rule sits above every subheading', () => {
  // The heading names a family; the rule says where the family before it ended.
  // One `if heading` in the template draws both, so it cannot be forgotten for
  // one group the way nineteen hand-written entries could.
  const at = body.indexOf('each formatGroups');
  assert.ok(at !== -1, 'the formats are drawn from the table');
  const lines = body.slice(at).split('\n').slice(0, 4).map(l => l.trim());
  assert.deepStrictEqual(lines,
    ['each formatGroups', 'if heading', 'hr', 'h4.pop-over-list-subheading {{heading}}'],
    'a heading brings its rule with it');
  assert.ok(/\.pop-over-list-subheading \{/.test(css), 'and they are styled as headings');
});

test('three subheadings name the three families', () => {
  const headings = [...table.matchAll(/heading(?:Key)?: '([^']+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(headings, ['card-dependencies', 'CSV', 'JSON'],
    'Dependencies, CSV and JSON - in that order');
});

test('an entry under a subheading says only what it is', () => {
  // "Export / CSV (,)" under a "CSV" heading says CSV twice and Export once
  // more than the menu it is already in.
  assert.ok(!/label: '[^']*[Ee]xport \//.test(table), 'no entry repeats the menu it is in');
  assert.ok(/label: '\(,\)'/.test(table) && /label: '\(;\)'/.test(table)
    && /label: 'TSV'/.test(table), 'the CSV entries are just their separators');
  assert.ok(/'Trello'/.test(table) && /'Zenkit'/.test(table),
    'and the JSON dialects are just their names');
});

test('every export popup is the same template, with a scope', () => {
  // What one popup means: the board menu is now the same include the other
  // three are, and has no format markup of its own left to drift.
  assert.ok(/\+exportScopeBody\(title=boardTitle\)/.test(popup),
    'the board popup is the shared body');
  assert.ok(!/export-board-pane-formats/.test(popup),
    'with no formats of its own');
  assert.ok(scopeJade.includes('+exportScopeBody(swimlaneId=_id title=title)'),
    'the swimlane popup is the same body');
  assert.ok(scopeJade.includes('+exportScopeBody(listId=_id title=title)'),
    'and the list popup');
  const cardJade = read('client/components/cards/cardDetails.jade');
  assert.ok(/\+exportScopeBody\(cardId=_id listId=listId title=title\)/.test(cardJade),
    'and the card popup');

  // One url builder, so a menu cannot send a different selection than the one
  // on screen - and the board popup has no builder of its own any more.
  assert.ok(/function exportUrl\(path, extra = \{\}\)/.test(scopeJs), 'one url builder');
  assert.ok(!/boardScopeUrl/.test(js), 'the board popup no longer builds its own urls');
  assert.ok(/const scopeHelpers = \{/.test(scopeJs)
    && /Template\.exportScopeBody\.helpers\(scopeHelpers\)/.test(scopeJs)
    && /Template\.exportScopeSelect\.helpers\(scopeHelpers\)/.test(scopeJs),
    'and one helper object serves both halves of it');
});

test('a board-only format is offered on a board and nowhere else', () => {
  // A swimlane has no HTML archive and no dependency graph; a card has no CSV
  // columns. The table says so once, per entry, instead of two markups
  // disagreeing about it.
  assert.ok(/const BOARD_ONLY = \['board'\];/.test(table), 'the marker exists');
  for (const boardOnly of ["key: 'html'", "key: 'kanboard'"]) {
    const at = table.indexOf(boardOnly);
    const entry = table.slice(at, table.indexOf('\n', at));
    assert.ok(/scopes: BOARD_ONLY/.test(entry), `${boardOnly} is board-only`);
  }
  assert.ok(/scopes: BOARD_ONLY,\n\s*entries: \[\n\s*\{ key: 'dep-json'/.test(table),
    'and a whole group can be board-only, heading and all');
  assert.ok(/function isBoardScope\(\)/.test(scopeJs)
    && /!data\.swimlaneId && !data\.listId && !data\.cardId && !data\.checklistId/.test(scopeJs),
    'which scope a popup is, is asked in one place - and every scope is named,'
    + ' or an unnamed one would be read as a whole board');
});

test('the .zip sits with the JSON it is a container for', () => {
  const jsonHeading = table.indexOf("heading: 'JSON'");
  const zip = table.indexOf("key: 'zip'");
  const kanboard = table.indexOf("key: 'kanboard'");
  assert.ok(jsonHeading < zip && zip < kanboard,
    'after the two JSON entries and before the dialects');
});

test('every format that existed before is still offered (negative)', () => {
  // Combining two menus must not lose an entry. These are the ones the board
  // menu had.
  for (const kept of ["key: 'csv'", "key: 'scsv'", "key: 'tsv'", "key: 'kanboard'",
    'html-export-board', 'js-export-dependencies-json', 'js-export-dependencies-svg']) {
    assert.ok(table.includes(kept), `${kept} survived the combining`);
  }
  for (const dialect of ['trello', 'jira', 'deck', 'openproject', 'github', 'gitlab',
    'gitea', 'forgejo', 'asana', 'zenkit']) {
    assert.ok(table.includes(`'${dialect}'`), `${dialect} is still exported`);
  }
  // ...and the five the other three menus had are still theirs, because they
  // carry no scope marker at all.
  for (const shared of ["key: 'pdf'", "key: 'excel'", "key: 'json'",
    "key: 'json-no-attachments'", "key: 'zip'"]) {
    const at = table.indexOf(shared);
    const entry = table.slice(at, table.indexOf('},', at));
    assert.ok(!/scopes:/.test(entry), `${shared} is offered in every scope`);
  }
});

test('every export link is built by the one url helper', () => {
  // The four that took the selection used to be the only ones; CSV, TSV,
  // Kanboard and the eleven dialects built their own query strings and could
  // not carry it. Every entry is `path` + optional `query` now, resolved in one
  // place, so `fields` rides along with all of them.
  assert.ok(/url: entry\.path \? exportUrl\(`\/api\/boards\/:boardId\/\$\{entry\.path\}`, entry\.query \|\| \{\}\) : ''/
    .test(scopeJs), 'one builder for every entry');
  assert.ok(/fields: selectedFields\(\)\.join\(','\)/.test(scopeJs),
    'and the selection is part of what it builds');
  assert.ok(/response supplies its localized, scope-aware filename/.test(scopeJs),
    'the response, not a duplicate client guess, names each download');
});

test('a CSV honours the selection as COLUMNS', () => {
  // A CSV has no comments to leave out; what it has is columns, and unticking
  // People removes five of them.
  const fields = read('models/lib/exportFields.js');
  assert.ok(/CSV_COLUMN_PARTS/.test(fields), 'each column knows which part it belongs to');
  assert.ok(/csvColumnMask/.test(fields), 'and a mask is built from the selection');
  const exporter = read('models/exporter.js');
  assert.ok(/applyMask\(columnHeaders, columnMask\)/.test(exporter), 'the header is filtered');
  assert.ok(/applyMask\(buildCsvCardRow\([^)]*\), columnMask\)/.test(exporter),
    'and every row is filtered by the SAME mask, so the two cannot drift');
});

test('a format only drops what it actually has (negative)', () => {
  // A Trello or Jira export carries a title, a description, a due date and
  // labels. Pretending the selection removes comments from it would be a lie in
  // the UI; gating what is there is the honest half.
  const external = read('models/lib/externalExporters.js');
  assert.ok(/a format drops what it has/.test(external), 'the reason is written down');
  assert.ok(/wanted\.has\('description'\)/.test(external)
    && /wanted\.has\('labels'\)/.test(external)
    && /wanted\.has\('dates'\)/.test(external),
    'the three parts these formats carry are gated');
  assert.ok(!/comments|checklists|attachments/.test(
    external.slice(external.indexOf('function gateItem'), external.indexOf('async function collect'))),
    'and nothing pretends to gate what is not there');
});

// ── the popup is big when there is room ────────────────────────────────────

test('a wide window puts the selection and the formats side by side', () => {
  // What to include on one side, what to export to on the other, so the whole
  // menu is visible at once rather than being a column to scroll - in EVERY
  // export popup, which is what "they should look like Export board" means.
  assert.ok(/\.export-board-panes/.test(body), 'the body has two panes');
  assert.ok(/\.export-board-pane\.export-board-pane-select/.test(body)
    && /\.export-board-pane\.export-board-pane-formats/.test(body),
    'one for the selection, one for the formats');
  assert.ok(body.indexOf('export-board-pane-select') < body.indexOf('export-board-pane-formats'),
    'selection first in the markup, which is the left in a left-to-right page');

  const popupCss = read('client/components/main/popup.css');
  const rule = popupCss.slice(popupCss.indexOf("data-popup='exportBoardPopup'"));
  assert.ok(/width: calc\(100vw - 20px\)/.test(rule.slice(0, 1200)),
    'the whole width of the window, less the gutter every popup keeps');
  for (const name of ['exportSwimlanePopup', 'exportListPopup', 'exportCardPopup']) {
    assert.ok(popupCss.includes(`data-popup='${name}'`), `${name} is the same panel`);
  }
  assert.ok(/\.pop-over \.export-board-panes \{/.test(popupCss),
    'and the panes are styled by their class, not by one popup name');
  assert.ok(/grid-template-columns: minmax\(260px, 0\.8fr\) minmax\(340px, 1\.2fr\)/.test(popupCss),
    'laid out as two grid columns');
  assert.ok(/grid-template-columns: repeat\(auto-fill, minmax\(190px, 1fr\)\)/.test(popupCss),
    'and each pane still fills its own width with as many columns as fit');
  assert.ok(/min-width: 801px/.test(popupCss.slice(
    popupCss.lastIndexOf('@media', popupCss.indexOf("data-popup='exportBoardPopup'")))),
    'desktop only - below 800px every popup is a full-screen sheet and they stack');

  // Pinned to the viewport instead of hanging off its button - for all four, or
  // the ones left behind would open half off the screen.
  const offset = read('client/lib/popupOffset.js');
  const list = offset.slice(offset.indexOf('const FULL_WIDTH_POPUPS'), offset.indexOf('const wide ='));
  for (const name of ['exportBoardPopup', 'exportSwimlanePopup', 'exportListPopup',
    'exportCardPopup']) {
    assert.ok(list.includes(`'${name}'`), `${name} is pinned to the viewport`);
  }
});

console.log(`\nexportBoardPopupOrder: ${passed} tests passed`);
