'use strict';

// A board, a swimlane and a list export the same way a card does.
// Run: node tests/boardExportScope.test.cjs
//
// wekan/wekan#1173 "Add Feature: Print Board with Params", open since 2017:
// print a board, and be able to choose what goes in it. Two things were missing.
//
// There was no CHOICE: the board's Excel and PDF exports took everything they
// knew how to render and nothing else, while the card export already had a popup
// with a checkbox per section. And they did not LOOK like the card export - the
// board's Excel export was a spreadsheet table, one row per card and eighteen
// columns, which is a data dump rather than a printed board.
//
// So: one selection popup body, used by the board, swimlane and list menus, and
// both exports render every card with the CARD export's own block - the same
// code, so they cannot become two layouts again. A swimlane export and a list
// export are that same export with one more query parameter saying which cards
// are in scope.
//
// Read from the source, like the other exporter suites: these need Meteor, a
// database and a board, and what is worth pinning is which code draws what.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const fields = read('models/lib/exportFields.js');
const pdf = read('models/server/ExporterCardPDF.js');
const excelBoard = read('models/server/ExporterExcelBoard.js');
const excelCard = read('models/server/ExporterExcelCard.js');
const pdfRoute = read('models/exportPDF.js');
const excelRoute = read('models/exportExcel.js');
const scopeJs = read('client/components/boards/exportScope.js');
const scopeJade = read('client/components/boards/exportScope.jade');
const exportNames = read('models/lib/exportFilename.js');
const exportNameHelpers = new Function(
  `${exportNames.replace(/export \{[^}]+\};/, '')}\nreturn { attachmentDisposition, exportFilename };`,
)();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('boardExportScope:');

// ── one layout ──────────────────────────────────────────────────────────────

test('the board PDF draws each card with the card export block', () => {
  const board = pdf.slice(pdf.indexOf('class ExporterBoardPDF'));
  assert.ok(/this\.cardBlockLines\(/.test(board), 'the card block, not a second rendering');
  // The block lives on the shared base, which is what lets both classes call it.
  const base = pdf.slice(pdf.indexOf('class PDFExporterBase'), pdf.indexOf('class ExporterCardPDF'));
  assert.ok(/cardBlockLines\(data\) \{/.test(base), 'and it is defined once, on the base');
});

test('the board Excel draws each card with the card export block', () => {
  assert.ok(/renderCardBlock\(ws, workbook, row, \{/.test(excelBoard),
    'the board sheet calls the card exporter to draw a card');
  assert.ok(/async renderCardBlock\(ws, workbook, startRow, data\)/.test(excelCard),
    'which the card exporter exposes for exactly that');
  assert.ok(/ExporterExcelCard/.test(excelBoard), 'and it is the card exporter, not a copy');
});

test('the board route keeps the card-layout selector sent by the popup', () => {
  assert.ok(
    /const BOARD_EXPORT_FIELD_KEYS = \[\s*'card-details',/.test(fields),
    'field validation must not strip card-details before choosing an exporter',
  );
  assert.ok(
    /fields && !fields\.includes\('card-details'\)/.test(excelRoute),
    'the validated selector chooses between the detailed and streaming layouts',
  );
});

test('the detailed board export passes attachment images to the card renderer', () => {
  assert.ok(/attachmentsByCard: group\(attachments, 'meta\.cardId'\)/.test(excelBoard),
    'board attachments are grouped by card');
  assert.ok(/attachments: data\.attachmentsByCard\[card\._id\] \|\| \[\]/.test(excelBoard),
    'each card block receives its attachments');
  assert.ok(/imageAttachments\.push\(\{/.test(excelCard),
    'the reused card renderer embeds image attachment bytes');
});

test('the card block is given its data, never left to fetch per card', () => {
  // The card export reads one card's checklists, comments and attachments per
  // card. Done per card on a board of three hundred, that is fifteen hundred
  // round trips - so the board exporters read each collection once and hand the
  // slices in.
  assert.ok(/Everything it needs is passed in rather than fetched/.test(excelCard),
    'the method says so');
  for (const [name, source] of [['PDF', pdf], ['Excel', excelBoard]]) {
    assert.ok(/\$in: cardIds/.test(source),
      `the ${name} board export reads each collection once for the whole board`);
  }
});

test('detailed exports keep Board -> Swimlane -> List -> Card order', () => {
  for (const [name, source] of [['PDF', pdf], ['Excel', excelBoard]]) {
    const boardHeader = source.indexOf("hasField('board-header')");
    const swimlane = source.indexOf("this.__('swimlane'", boardHeader);
    const list = source.indexOf("this.__('list'", swimlane);
    const card = name === 'PDF'
      ? source.indexOf('this.cardBlockLines(', list)
      : source.indexOf('renderer.renderCardBlock(', list);
    assert.ok(boardHeader !== -1 && swimlane > boardHeader && list > swimlane && card > list,
      `${name} renders each hierarchy level before its children`);
  }
  assert.ok(/this\._listId \|\| this\._swimlaneId/.test(pdf),
    'a scoped PDF starts at its selected level instead of repeating board metadata');
  assert.ok(/!this\._listId && !this\._swimlaneId/.test(excelBoard),
    'and detailed Excel follows the same scoped-header rule');
});

test('smaller exports begin at Swimlane -> List -> Card or List -> Card', () => {
  for (const source of [pdf, excelBoard]) {
    assert.ok(/this\._listId[\s\S]*this\._swimlaneId/.test(source),
      'scope heading chooses List before Swimlane before Board');
    assert.ok(/const groups = this\._listId[\s\S]*swimlane/.test(source),
      'a list export has no extra swimlane group');
    assert.ok(/group\.title && !this\._swimlaneId/.test(source),
      'a swimlane export does not repeat its own heading');
    assert.ok(/if \(!this\._listId\)/.test(source),
      'a list export does not repeat its own list heading');
  }
});

// ── one selection ───────────────────────────────────────────────────────────

test('there is ONE field list, and everything imports it', () => {
  assert.ok(/const CARD_EXPORT_FIELDS = \[/.test(fields), 'the card sections');
  assert.ok(/const BOARD_EXPORT_FIELDS = \[/.test(fields), 'and the board ones around them');
  assert.ok(/\.\.\.CARD_EXPORT_FIELDS/.test(fields),
    'a board is its own header plus the card sections, not a second list of them');
  assert.ok(/CARD_EXPORT_FIELD_KEYS/.test(excelCard), 'the Excel card exporter imports it');
  assert.ok(/BOARD_EXPORT_FIELD_KEYS/.test(pdf), 'the PDF exporters import it');
  assert.ok(/BOARD_EXPORT_FIELDS/.test(scopeJs), 'and so does the popup');
});

test('both formats gate the same sections by the same keys', () => {
  const base = pdf.slice(pdf.indexOf('class PDFExporterBase'), pdf.indexOf('class ExporterCardPDF'));
  // The PDF gates them in the SHARED document now - `wanted(selection, key)` in
  // models/lib/cardDocument.js - which is what makes a popup checkbox mean the
  // same thing in both formats instead of being two lists that can differ.
  const document = read('models/lib/cardDocument.js');
  for (const key of ['labels', 'people', 'board-info', 'dates', 'description',
    'custom-fields', 'checklists', 'subtasks', 'comments', 'attachments', 'voting', 'poker']) {
    assert.ok(new RegExp(`hasField\\('${key}'\\)`).test(base)
      || new RegExp(`wanted\\(fields, '${key}'\\)|wanted\\(selection, '${key}'\\)`).test(document),
      `the PDF block gates ${key}`);
    assert.ok(new RegExp(`hasField\\('${key}'\\)`).test(excelCard),
      `the Excel block gates ${key}`);
  }
});

test('no selection means everything, in every exporter (negative)', () => {
  // An export with no `?fields=` must not be an empty file.
  assert.ok(/fields && fields\.length > 0/.test(pdf), 'PDF');
  assert.ok(/fields && fields\.length > 0/.test(excelCard), 'Excel card');
  assert.ok(/this\._fields === null \|\| this\._fields\.has\(key\)/.test(excelBoard),
    'Excel board');
  assert.ok(/return kept\.length > 0 \? kept : null/.test(fields),
    'and an unrecognised ?fields= is "everything", not "nothing"');
});

// ── one popup, three scopes ─────────────────────────────────────────────────

test('the popup body is shared by the card, board, swimlane and list menus', () => {
  assert.ok(/template\(name="exportScopeBody"\)/.test(scopeJade), 'one body');
  assert.ok(/template\(name="exportSwimlanePopup"\)/.test(scopeJade)
    && /template\(name="exportListPopup"\)/.test(scopeJade),
    'and the two new popups are that body with a scope');
  const sidebar = read('client/components/sidebar/sidebar.jade');
  assert.ok(/\+exportScopeBody/.test(sidebar), 'the board popup uses it too');
  // The card popup was its own template with its own field list and its own url
  // builder - which is how its checkboxes drove the Excel download and not the
  // PDF. It is the shared body now, with the card as its scope.
  const cardJade = read('client/components/cards/cardDetails.jade');
  assert.ok(/template\(name="exportCardPopup"\)\n  \+exportScopeBody/.test(cardJade),
    'and so does the card popup');
  assert.ok(!/js-excel-field-toggle/.test(read('client/components/cards/cardDetails.js')),
    'with no second copy of the toggle left behind');
  assert.ok(/swimlaneId=_id/.test(scopeJade) && /listId=_id/.test(scopeJade),
    'the scope is the one thing that differs');
});

test('the menus offer it, above the rows that need write permission', () => {
  // Exporting is READING - the same reason "Copy link" sits where it does.
  const swimlane = read('client/components/swimlanes/swimlaneHeader.jade');
  const list = read('client/components/lists/listHeader.jade');
  assert.ok(/js-export-swimlane/.test(swimlane), 'the swimlane menu');
  assert.ok(/js-export-list/.test(list), 'the list menu');
  for (const [name, source, marker] of [
    ['swimlane', swimlane, 'js-export-swimlane'],
    ['list', list, 'js-export-list'],
  ]) {
    const before = source.slice(0, source.indexOf(marker));
    assert.ok(!/unless currentUser.isReadOnly/.test(before.slice(before.lastIndexOf('hr'))),
      `the ${name} export is not behind an edit permission`);
  }
  assert.ok(/'click \.js-export-swimlane': Popup\.open\('exportSwimlane'\)/
    .test(read('client/components/swimlanes/swimlaneHeader.js')), 'and it opens');
  assert.ok(/'click \.js-export-list': Popup\.open\('exportList'\)/
    .test(read('client/components/lists/listHeader.js')), 'and so does the other');
});

test('every export route reads the scope through ONE parser', () => {
  // The routes used to pick `swimlaneId` and `listId` out of the query
  // themselves, which is three places for a fifth scope to be added to and two
  // for it to be forgotten in. They all call parseExportScope now.
  const jsonRoute = read('models/export.js');
  for (const [name, source] of [['PDF', pdfRoute], ['Excel', excelRoute], ['JSON/zip', jsonRoute]]) {
    assert.ok(/parseExportScope\(req\.query\)/.test(source),
      `the ${name} route reads the scope through the shared parser`);
    assert.ok(/parseExportFields/.test(source),
      `and the ${name} route validates the field list rather than trusting it`);
  }
  assert.ok(/EXPORT_SCOPE_KEYS = \['swimlaneId', 'listId', 'cardId', 'checklistId'\]/.test(fields),
    'and the four scopes are named once');
  assert.ok(/A Mongo id is/.test(fields),
    'a query parameter is validated as an id, not trusted as one');
});

test('PDF and Excel use one localized, scope-aware download-name helper', () => {
  for (const [name, source] of [
    ['PDF', pdf], ['Excel board', excelBoard], ['Excel card', excelCard],
    ['streaming Excel board', read('models/server/ExporterExcel.js')],
  ]) {
    assert.ok(/exportFilename/.test(source), `${name} names the exported object`);
    assert.ok(/attachmentDisposition/.test(source), `${name} sends its UTF-8 name`);
  }
  assert.ok(/filename\*=UTF-8''/.test(exportNames),
    'localized scripts are carried in the standards-based filename parameter');
  assert.ok(/listNumber/.test(pdf) && /swimlaneNumber/.test(pdf), 'PDF numbers its scope');
  assert.ok(/listNumber/.test(excelBoard) && /swimlaneNumber/.test(excelBoard),
    'Excel numbers the same scope');
  assert.ok(/card\.cardNumber \|\| 1/.test(pdf) && /card\.cardNumber \|\| 1/.test(excelCard),
    'a card is named Card-number in both formats');
  assert.ok(/a\(href="\{\{url\}\}" download\)/.test(scopeJade),
    'the browser accepts the localized server filename instead of overriding it');
  assert.strictEqual(exportNameHelpers.exportFilename(
    'swimlane', key => ({ swimlane: 'Swimlane' })[key], 1, 'pdf'), 'Swimlane-1.pdf');
  assert.strictEqual(exportNameHelpers.exportFilename(
    'swimlane', key => ({ swimlane: 'Uimarata' })[key], 1, 'xlsx'), 'Uimarata-1.xlsx');
  assert.match(exportNameHelpers.attachmentDisposition('游泳道-1.pdf'),
    /filename\*=UTF-8''%E6%B8%B8%E6%B3%B3%E9%81%93-1\.pdf/);
});

test('saved profile language wins and browser language is the fallback', () => {
  for (const route of [pdfRoute, excelRoute, read('models/exportExcelCard.js')]) {
    assert.ok(/user[^\n]*profile[^\n]*language|profile\.language/.test(route),
      'the route reads the saved profile language');
    assert.ok(/req\.query[^\n]*lang/.test(route),
      'and accepts the browser language when the profile has none');
  }
});

test('JSON and .zip are the same export in two shapes', () => {
  const zip = read('models/server/ExporterZip.js');
  const exporter = read('models/exporter.js');
  assert.ok(/exporter\.buildStream\(jsonStream\)/.test(zip),
    'the .zip document is written by the JSON exporter, not by a second one');
  assert.ok(/excludeAttachments: true/.test(zip),
    'and it carries no base64 file data, because the files are beside it');
  assert.ok(/archive\.append\(stream, \{ name: `attachments\//.test(zip),
    'each attachment is piped into the archive as the file it is');
  assert.ok(/getReadStream\(\)/.test(zip) && !/streamToBuffer/.test(zip),
    'piped, never buffered - that is the point of the .zip on a large board');
  assert.ok(/An unselected section is an EMPTY array/.test(exporter),
    'an unselected section keeps the format importable');
});

test('a scoped JSON export still carries what its cards need', () => {
  const exporter = read('models/exporter.js');
  assert.ok(/carries the lists and swimlanes ITS cards refer to/.test(exporter),
    'a card without its list imports into nothing');
  assert.ok(/_scopedCardSelector/.test(exporter), 'and the scope decides which cards');
  assert.ok(/checklist \? checklist\.cardId/.test(exporter),
    'a checklist scope exports the card that holds it');
  assert.ok(/scoped \? \{ _id: '__none__' \} : \{ boardId \}/.test(exporter),
    'and a swimlane export carries no board-wide rules');
});

// ── the streaming exporter is still reachable ───────────────────────────────

test('a board too big for the card layout can still be exported', () => {
  // models/server/ExporterExcel.js streams: flat memory for thousands of cards.
  // The card layout cannot stream - it merges and styles cells and returns to
  // earlier rows - so unticking "card details" is what gets the streaming table,
  // and that is a checkbox rather than a silent fallback.
  assert.ok(/if \(fields && !fields\.includes\('card-details'\)\) \{/.test(excelRoute),
    'the route picks the streaming exporter when card details are not wanted');
  assert.ok(/new ExporterExcel\(boardId, language, scope\)/.test(excelRoute),
    'and that exporter is still the streaming one');
  assert.ok(/card-details/.test(scopeJade), 'the popup offers the choice');
  assert.ok(/WHY THIS IS A SEPARATE EXPORTER/.test(excelBoard),
    'and the reason is written where the two meet');
});

// ── the checkbox list can actually be changed (#6586) ──────────────────────

test('the toggle is bound ONCE, on the document', () => {
  // #6586 comment 5308548585: "I can't select/deselect those arrows here", then
  // "clicking a checked option, like labels, does not uncheck it".
  //
  // A `Template.exportScopeBody.events` map did not deliver the click, and
  // adding the same map to `exportScopeSelect` - the template that draws the
  // rows - did not either: that fix was built and shipped in both bundles and
  // the list still could not be changed. The list is drawn inside five popups,
  // each rendered into its own Blaze view tree, so the toggle is bound where
  // nothing in that chain can drop it - one delegated handler on the document,
  // the mechanism escapeActions.js already uses for clicks inside popups.
  const js = read('client/components/boards/exportScope.js');
  const jade = read('client/components/boards/exportScope.jade');

  const selectTpl = /template\(name="exportScopeSelect"\)([\s\S]*?)\n\ntemplate/.exec(jade);
  assert.ok(selectTpl, 'exportScopeSelect must exist');
  for (const cls of ['js-export-field-toggle', 'js-export-card-details-toggle']) {
    assert.ok(selectTpl[1].includes(cls), `${cls} is drawn by exportScopeSelect`);
    // ONE binding each. Two would toggle twice and cancel out, which is the
    // same "nothing happens" arriving from the other direction.
    const bindings = [...js.matchAll(new RegExp(`\\.${cls}[,'"]`, 'g'))].length;
    assert.strictEqual(bindings, 1, `${cls} must be bound exactly once, found ${bindings}`);
  }
  // Native, and in the CAPTURE phase: it runs on the way DOWN to the row, so a
  // stopPropagation() between the row and the document cannot eat it - and a
  // `window.jQuery` that turned out to be undefined would fail silently, which
  // is indistinguishable from the bug.
  assert.ok(/document\.addEventListener\('click'/.test(js),
    'the toggle must be a native document listener');
  assert.ok(/\}, true\);/.test(js), 'and it must listen in the capture phase');
  // The CODE, not the comment that explains why jQuery is not used.
  const code = js.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  assert.ok(!/window\.jQuery/.test(code), 'without depending on jQuery being there');
  assert.ok(!/Template\.\w+\.events\(selectToggles\)/.test(js),
    'and the template event maps for these two are gone, or a click toggles twice');
});

test('an unchecked box is square, whatever the label beside it', () => {
  // "Kortin tiedot (jokainen kortti kuten kortin viennissa)" squeezed the
  // unchecked square into a thin vertical sliver while "Taulu" beside it stayed
  // square: the row is a flex container and a flex item shrinks.
  //
  // The fix is NOT here. It is in the rule that defines the checkbox, so that
  // no flex row anywhere can do it to any of the 90 of them -
  // tests/checkboxesAreSquare.test.cjs owns that invariant. What this popup
  // adds is alignment only, and it must add nothing else: a local `box-sizing`
  // here once made these boxes 13px including their border while every other
  // checkbox in WeKan is 13px plus 2px.
  const forms = read('client/components/forms/forms.css');
  const base = /\n\.materialCheckBox \{([\s\S]*?)\n\}/.exec(forms);
  assert.ok(base && /flex:\s*none/.test(base[1]),
    'forms.css must make the checkbox unshrinkable, for every row that holds one');

  const css = read('client/components/main/popup.css');
  const rule = /\.export-scope-select a > \.materialCheckBox \{([\s\S]*?)\}/.exec(css);
  assert.ok(rule, 'the export row aligns the box to the first line of its label');
  // The declarations, not the comment above them explaining what must not be
  // here - which of course names the very properties this is looking for.
  const declarations = rule[1].replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/box-sizing|width:|height:/.test(declarations),
    'and sizes nothing itself - that belongs to forms.css, for all of them');
});

test('a row shows whether it is ticked, in the Admin Panel\'s own checkbox', () => {
  // The list used an unconditional `i.fa.fa-check` on a `li.active`, which is
  // popup.css's OTHER convention: that tick is hidden by
  // `.pop-over-list .pop-over-list.checkable .fa-check` and shown only for an
  // active row - so it needs a NESTED list carrying `checkable`, and this list
  // was neither. Every row therefore looked ticked whatever it was.
  const jade = read('client/components/boards/exportScope.jade');
  const selectTpl = /template\(name="exportScopeSelect"\)([\s\S]*?)\n\ntemplate/.exec(jade)[1];
  assert.ok(/\.materialCheckBox\(class="\{\{#if cardDetailsChecked\}\}is-checked/.test(selectTpl),
    'card details must draw a materialCheckBox that reflects its state');
  assert.ok(/\.materialCheckBox\(class="\{\{#if checked\}\}is-checked/.test(selectTpl),
    'and so must every field row');
  assert.ok(!/^\s*i\.fa\.fa-check\s*$/m.test(selectTpl),
    'no unconditional tick: it is the same mark whether the row is on or off');
});

test('and no list anywhere ticks unconditionally on an li.active (negative)', () => {
  // The shape, not the one file: `li.active` + a bare `i.fa.fa-check` only
  // works inside a NESTED `ul.pop-over-list.checkable`, and anywhere else it
  // draws a permanent tick that means nothing.
  const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, out);
      else if (e.name.endsWith('.jade')) out.push(full);
    }
    return out;
  };
  const offenders = [];
  for (const file of walk(path.join(repoRoot, 'client'))) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!/class="\{\{#if [\w\s']+\}\}active\{\{\/if\}\}"/.test(line)) return;
      if (!/^\s*i\.fa\.fa-check\s*$/m.test(lines.slice(i, i + 4).join('\n'))) return;
      const ul = [...lines.slice(0, i + 1)].reverse().find(l => /^\s*ul[.#\w-]*/.test(l)) || '';
      if (!ul.includes('checkable')) {
        offenders.push(`${path.relative(repoRoot, file)}:${i + 1}`);
      }
    });
  }
  assert.deepStrictEqual(offenders, [],
    `these draw a tick that is always visible: ${offenders.join(', ')}`);
});

// ── what is ticked is what the file contains ───────────────────────────────

test('every downloadable format carries the selection, and the server reads it', () => {
  // The whole point of the checkbox list: an unticked section must be missing
  // from the Excel, the JSON, the CSV, the PDF and every other file the popup
  // offers. Two halves, and either one silently drops the choice.
  const js = read('client/components/boards/exportScope.js');

  // 1. The URL. Every entry with a `path` is turned into a link by one line,
  //    and that line goes through exportUrl - which always appends
  //    `fields=<the ticked ones>`.
  assert.ok(/fields: selectedFields\(\)\.join\(','\)/.test(js),
    'exportUrl must put the selection in the query string');
  assert.ok(/url: entry\.path \? exportUrl\(`\/api\/boards\/:boardId\/\$\{entry\.path\}`/.test(js),
    'and every format entry must build its URL with it - not one of them by hand');

  // 2. The routes. Read the paths the popup offers straight out of the format
  //    table, so a format added later is checked without editing this test.
  const paths = [...js.matchAll(/path: '([\w/]+)'/g)].map(m => m[1]);
  assert.ok(paths.length >= 8, `expected the format table, found ${paths.length} paths`);
  const server = ['models/export.js', 'models/exportExcel.js', 'models/exportPDF.js']
    .map(read).join('\n');
  const unread = [...new Set(paths)].filter(p => {
    // The route that serves this path must parse `fields`. The external-tool
    // exports share one handler (serveExternalExport), which does.
    const route = `'/api/boards/:boardId/${p}'`;
    if (!server.includes(route) && !/^export\/(trello|jira|deck|openproject|github|gitlab|gitea|forgejo|asana|zenkit)$/.test(p)) {
      return true;
    }
    return false;
  });
  assert.deepStrictEqual(unread, [],
    `the popup offers these formats and no route serves them: ${unread.join(', ')}`);

  // Each exporter entry point parses the selection rather than exporting
  // everything: parseExportFields is the one place that reads the parameter.
  for (const file of ['models/export.js', 'models/exportExcel.js', 'models/exportPDF.js']) {
    assert.ok(/parseExportFields\(req\.query && req\.query\.fields/.test(read(file)),
      `${file} must read the selection from the query`);
  }
  assert.ok(/parseExportFields\(req\.query && req\.query\.fields, BOARD_EXPORT_FIELD_KEYS\)\) \}\)/
    .test(read('models/export.js')),
    'and the external-tool exports (Trello, Jira, GitHub, ...) must read it too');
});

test('RouteBleed: route lookup treats regex metacharacters and backslashes literally (#434)', () => {
  // This is the distinction the old dynamically-built RegExp lost. Exact text
  // needs no sanitizer, and a near-match must not pass merely because `.`,
  // brackets or a backslash acquired pattern meaning.
  const pathWithMetacharacters = String.raw`export/a.b\\c[0](x)+?`;
  const route = `'/api/boards/:boardId/${pathWithMetacharacters}'`;
  const exactServer = `Router.route(${route}, { where: 'server' });`;
  const nearMatch = exactServer.replace('a.b', 'aXb');
  assert.strictEqual(exactServer.includes(route), true, 'the exact literal is found');
  assert.strictEqual(nearMatch.includes(route), false,
    'negative: regex-like characters cannot make a different route match');
});

console.log(`\nboardExportScope: ${passed} tests passed`);
