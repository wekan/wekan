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
const cardDetails = read('client/components/cards/cardDetails.js');
const exportLocale = read('client/lib/exportLocale.js');
const dateUtils = read('imports/lib/dateUtils.js');

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
  for (const key of SECTIONS) {
    assert.ok(pdf.includes(`'${key}'`), `the PDF export has no ${key}`);
  }
  // The two the report named that neither export had a section for at all.
  assert.ok(/_voteLines/.test(pdf) && /'voting'/.test(pdf), 'and the vote');
  assert.ok(/_pokerLines/.test(pdf) && /'poker-question'/.test(pdf), 'and the poker');
  assert.ok(/export-card-subtasks/.test(pdf), 'and the subtasks');
});

test('the Excel card export carries every field', () => {
  for (const key of SECTIONS) {
    assert.ok(excel.includes(`'${key}'`), `the Excel export has no ${key}`);
  }
  assert.ok(/needsVoting/.test(excel) && /'voting'/.test(excel), 'and the vote');
  assert.ok(/needsPoker/.test(excel) && /'poker-question'/.test(excel), 'and the poker');
  assert.ok(/needsCustomFields/.test(excel), 'and the custom fields');
});

test('the new sections are selectable, and the client offers them', () => {
  // ?fields= names them, and the popup's checkboxes must offer the same list -
  // a section the server can build and the UI cannot ask for is a section
  // nobody sees.
  for (const field of ['custom-fields', 'voting', 'poker']) {
    assert.ok(new RegExp(`^\\s*'${field}',`, 'm').test(excel),
      `${field} is in ALL_FIELDS`);
    assert.ok(new RegExp(`field: '${field}'`).test(cardDetails),
      `${field} is a checkbox in the export popup`);
  }
});

test('the fields were APPENDED to ALL_FIELDS, not inserted (negative)', () => {
  // ?fields=labels,people,... is a URL people have saved. Reordering the list
  // would not change what such a link asks for, but the reason it is safe should
  // be written down rather than rediscovered.
  const list = excel.slice(excel.indexOf('const ALL_FIELDS'), excel.indexOf('];'));
  const order = [...list.matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
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
  const fields = [...pdf.matchAll(/this\.field\('([a-z-]+)', '([^']+)'/g)];
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
  assert.ok(/TAPi18n\.getLanguage\(\)/.test(exportLocale), 'and the language');
});

test('every export link carries them - PDF card, PDF board and Excel', () => {
  const sidebar = read('client/components/sidebar/sidebar.js');
  const links = (cardDetails.match(/exportLocaleParams\(\)/g) || []).length;
  assert.ok(links >= 2, `both card export links send them, found ${links}`);
  assert.ok(/exportLocaleParams\(\)/.test(sidebar), 'and the board PDF link');
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
