'use strict';

// One card, two exports, the same card.
// Run: node tests/cardExportParity.test.cjs
//
// wekan/wekan#6586, reopened. The PDF export of a card had grown separately from
// the Excel export of the same card, and everything the reporter came back with
// was a symptom of that:
//
//   "Assignee, Labels, due,... these titels should be in the user set language"
//   "There is 'Assignee: ', 'Labels:' and then 'due' (lowercase letter and no `:`)"
//   "I think all those other things we set in a card should be also present in
//    the pdf? Location, Voting, Checklists, Subtasks, Custom Fields,
//    Attachments, Comments,...?"
//   "the time is not in the user set timezone (-2h wrong for Europe/Berlin)"
//
// A label that is English in one export and translated in the other, a section
// that exists in one and not the other, or a due date that reads 14:00 in one
// and 12:00 in the other, are all the same failure: two answers to "what is on
// this card". So the two exports now share the FIELD LIST, the i18n KEYS, the
// DATE FORMATTER and the locale the request carries, and this suite pins that
// they still do.
//
// Read from the source: an exporter needs Meteor, a database and a card, and
// what is worth pinning here is which fields the code emits and where the labels
// and the dates come from - the same approach tests/exportBoardSections.test.cjs
// takes for the JSON and Excel exports.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const pdf = read('models/server/ExporterCardPDF.js');
const excel = read('models/server/ExporterExcelCard.js');
const pdfRoute = read('models/exportPDF.js');
const excelRoute = read('models/exportExcelCard.js');
const boardExcelRoute = read('models/exportExcel.js');
const cardDetails = read('client/components/cards/cardDetails.js');
const exportLocale = read('client/lib/exportLocale.js');
const dateUtils = read('imports/lib/dateUtils.js');
const exportFields = read('models/lib/exportFields.js');
const exportDocument = read('models/lib/cardExportDocument.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardExportParity:');

// ── the same fields ─────────────────────────────────────────────────────────

// Every section a card can have, as the i18n key both exports label it with.
const SECTIONS = [
  'labels', 'creator', 'assignees', 'members',
  'board', 'swimlane', 'list',
  'card-number', 'requested-by', 'assigned-by',
  'createdAt', 'card-received', 'card-start', 'card-due', 'card-end',
  'last-activity', 'card-spent',
  'description', 'custom-fields', 'checklists', 'comments', 'attachments',
];

test('the PDF card export carries every field', () => {
  // The PDF draws the SHARED card document now (models/lib/cardDocument.js), so
  // a field is carried by the pair: the exporter maps it, the document places
  // it. Reading only the exporter would say a field was lost when it had merely
  // moved to where BOTH formats read it from.
  const document = read('models/lib/cardDocument.js');
  const carried = `${pdf}\n${document}\n${exportDocument}`;
  for (const key of SECTIONS) {
    assert.ok(carried.includes(`'${key}'`), `the PDF export has no ${key}`);
  }
  // The two the report named that neither export had a section for at all.
  assert.ok(/voting: /.test(exportDocument) && /'voting'/.test(carried), 'and the vote');
  assert.ok(/poker: /.test(exportDocument) && /'poker-question'/.test(carried), 'and the poker');
  assert.ok(/export-card-subtasks/.test(carried), 'and the subtasks');
});

test('the Excel card export carries every field', () => {
  const document = read('models/lib/cardDocument.js');
  const renderer = read('models/server/renderCardDocumentExcel.js');
  const carried = `${excel}\n${document}\n${exportDocument}\n${renderer}`;
  for (const key of SECTIONS) {
    assert.ok(carried.includes(`'${key}'`), `the Excel export has no ${key}`);
  }
  assert.ok(/voting: vote\.question/.test(exportDocument) && /'voting'/.test(document),
    'and the vote');
  assert.ok(/poker: \(poker\.question/.test(exportDocument) && /'poker-question'/.test(document),
    'and the poker');
  assert.ok(/customFields:/.test(exportDocument) && /'custom-fields'/.test(document),
    'and the custom fields');
  assert.ok(/buildExportCardDocument\(/.test(excel), 'Excel uses the shared data adapter');
  assert.ok(/buildExportCardDocument\(/.test(pdf), 'PDF uses the shared data adapter');
});

test('the new sections are selectable, and the client offers them', () => {
  // ?fields= names them, and the popup's checkboxes must offer the same list -
  // a section the server can build and the UI cannot ask for is a section
  // nobody sees.
  // #1173: the server's ALL_FIELDS and the popup's list are now the SAME list,
  // imported from models/lib/exportFields.js by both - a "must match" comment is
  // not a mechanism, and a section added on one side used to be a checkbox that
  // did nothing or a section nobody could turn off.
  for (const field of [
    'custom-fields', 'voting', 'poker', 'stickers', 'locations', 'dependencies', 'sort',
  ]) {
    assert.ok(new RegExp(`field: '${field}'`).test(exportFields),
      `${field} is in the shared field list`);
  }
  assert.ok(/ALL_FIELDS = CARD_EXPORT_FIELD_KEYS/.test(excel),
    'the Excel exporter takes its list from there');
  // The card popup is the shared export body now (#1173), so its list is the
  // shared list by construction rather than by a second assignment.
  const scopeJs = read('client/components/boards/exportScope.js');
  assert.ok(/BOARD_EXPORT_FIELDS/.test(scopeJs), 'and so does the popup');
});

test('the fields were APPENDED to ALL_FIELDS, not inserted (negative)', () => {
  // ?fields=labels,people,... is a URL people have saved. Reordering the list
  // would not change what such a link asks for, but the reason it is safe should
  // be written down rather than rediscovered.
  const list = exportFields.slice(exportFields.indexOf('const CARD_EXPORT_FIELDS'),
    exportFields.indexOf('];', exportFields.indexOf('const CARD_EXPORT_FIELDS')));
  const order = [...list.matchAll(/field: '([a-z-]+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(order.slice(0, 5),
    ['labels', 'people', 'board-info', 'dates', 'description'],
    'the original five keep their places');
});

// ── the same words ──────────────────────────────────────────────────────────

test('both exports translate their labels, from the same keys', () => {
  assert.ok(/TAPi18n/.test(pdf), 'the PDF export translates at all');
  assert.ok(/__\(key, ''?, this\.userLanguage\)/.test(pdf.replace(/\s+/g, ' '))
    || /TAPi18n\.__\(key, '', this\.userLanguage\)/.test(pdf),
    'in the language the request carries');
  // The card export and the board export inside the same file share one field()
  // helper, which is what makes "due" and "Due:" impossible to have at once.
  assert.ok(/field\(key, fallback, value\)/.test(pdf),
    'one label+colon helper for every field');
  assert.ok(/class ExporterCardPDF extends PDFExporterBase/.test(pdf)
    && /class ExporterBoardPDF extends PDFExporterBase/.test(pdf),
    'and both PDF exporters use it');
});

test('every label has an English fallback, so a key is never printed', () => {
  // A missing translation must show the word, not "card-due".
  // The labels live in the shared document now, with an English fallback each -
  // one table, so a PDF cannot say "Due" where a spreadsheet says "Due date".
  const document = read('models/lib/cardDocument.js');
  const table = /const FALLBACKS = \{([\s\S]*?)\n\};/.exec(document);
  assert.ok(table, 'the document must carry the English words');
  const fields = [...table[1].matchAll(/'?([\w-]+)'?:\s*'([^']+)'/g)];
  assert.ok(fields.length > 15, `expected the card's fields, found ${fields.length}`);
  for (const [, key, fallback] of fields) {
    assert.notStrictEqual(key, fallback, `${key} falls back to its own key`);
  }
});

// ── the same dates ──────────────────────────────────────────────────────────

test('both exports use ONE date formatter', () => {
  for (const [name, source] of [['PDF', pdf], ['Excel', excel]]) {
    assert.ok(/formatDateByUserPreference/.test(source),
      `the ${name} export formats dates with the shared helper`);
  }
  assert.ok(!/toISOString\(\)/.test(pdf),
    'the PDF export no longer prints a raw ISO string of its own');
});

test('the formatter can render in a given zone, and defaults to the local one', () => {
  assert.ok(/timeZone = ''/.test(dateUtils), 'the parameter is optional');
  assert.ok(/dateParcelsIn/.test(dateUtils), 'and an explicit zone is resolved through Intl');
  // The client-side callers - the card view itself - must keep rendering in the
  // browser's own zone, which is what omitting the parameter does.
  assert.ok(/timeZone \? dateParcelsIn\(d, timeZone\) : null/.test(dateUtils),
    'no zone means the process zone, as every existing caller expects');
});

test('a server-built export never silently prints the SERVER zone', () => {
  for (const [name, source] of [['PDF', pdf], ['Excel', excel]]) {
    // The PDF's formatter is a free function and the Excel's is a method, so the
    // receiver differs; the fallback is what matters and it is the same.
    assert.ok(/(this\.)?timezone \|\| 'UTC'/.test(source),
      `the ${name} export falls back to UTC, not to however the server was started`);
    assert.ok(/\$\{formatted\} UTC/.test(source),
      `and the ${name} export says UTC when that is what the reader is getting`);
  }
});

// ── the same request ────────────────────────────────────────────────────────

test('the client sends zone, language and the card\'s own date format', () => {
  assert.ok(/resolvedOptions\(\)\.timeZone/.test(exportLocale), 'the IANA zone');
  assert.ok(/getDateFormat\(\)/.test(exportLocale)
    && /localStorage\.getItem\('dateFormat'\)/.test(exportLocale),
    'the date format the opened card is showing - including the localStorage '
    + 'fallback a logged-out reader has, which no server-side lookup can reach');
  assert.ok(/TAPi18n\.getLanguage\(\)/.test(exportLocale), 'and the active UI language');
  assert.ok(/navigator\.languages/.test(exportLocale) && /navigator\.language/.test(exportLocale),
    'falling back to the browser language when the UI has not selected one');
});

test('a saved user language wins, otherwise the browser language wins', () => {
  for (const [name, source] of [
    ['PDF', pdfRoute], ['card Excel', excelRoute], ['board Excel', boardExcelRoute],
  ]) {
    const compact = source.replace(/\s+/g, ' ');
    const profile = compact.indexOf('user && user.profile && user.profile.language');
    const query = compact.indexOf('req.query && req.query.lang', profile);
    assert.ok(profile >= 0 && query > profile,
      `${name} must prefer profile.language to the browser's ?lang=`);
  }
  assert.ok(/publicLanguage = \(req\.query && req\.query\.lang\) \|\| 'en'/.test(
    excelRoute.replace(/\s+/g, ' ')),
  'a logged-out public card Excel export still uses the browser language');
});

test('every export link carries them - card, board, swimlane and list', () => {
  // #1173: the board, swimlane and list downloads are ONE shared popup body now,
  // so there is one place that builds those URLs instead of three.
  const scope = read('client/components/boards/exportScope.js');
  assert.ok(/exportLocaleParams\(\)/.test(scope),
    'and the shared board/swimlane/list export body');
  assert.ok(/exportPDF/.test(scope) && /exportExcel/.test(scope),
    'which is what both of its downloads are built from');
});

test('the routes validate the date format instead of trusting the query', () => {
  for (const [name, source] of [['PDF', pdfRoute], ['Excel', excelRoute]]) {
    assert.ok(/DATE_FORMATS/.test(source) && /\.includes\(/.test(source),
      `the ${name} route accepts only the formats the formatter understands`);
    assert.ok(/profile && [a-z.]*\.profile\.dateFormat/.test(source.replace(/\n/g, ' '))
      || /profile\.dateFormat/.test(source),
      `and falls back to the ${name} reader's profile`);
  }
  assert.ok(/req\.query\.tz\.length <= 64/.test(pdfRoute)
    && /req\.query\.tz\.length <= 64/.test(excelRoute),
    'a zone name is bounded - it is a request parameter, not a free-text field');
});

console.log(`\ncardExportParity: ${passed} tests passed`);
