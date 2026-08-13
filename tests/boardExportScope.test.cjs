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
  for (const key of ['labels', 'people', 'board-info', 'dates', 'description',
    'custom-fields', 'checklists', 'subtasks', 'comments', 'attachments', 'voting', 'poker']) {
    assert.ok(new RegExp(`hasField\\('${key}'\\)`).test(base),
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
  assert.ok(/new ExporterExcel\(boardId, language\)/.test(excelRoute),
    'and that exporter is still the streaming one');
  assert.ok(/card-details/.test(scopeJade), 'the popup offers the choice');
  assert.ok(/WHY THIS IS A SEPARATE EXPORTER/.test(excelBoard),
    'and the reason is written where the two meet');
});

console.log(`\nboardExportScope: ${passed} tests passed`);
