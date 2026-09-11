'use strict';

// Regression guard: reported directly (with a LibreOffice screenshot) - the
// Frappe Gantt view's Excel export showed its Start/Due/End dates as ISO text
// strings ("2026-09-23T09:00:00.000Z"): models/server/ExporterChartExcel.js
// wrote `cell.toISOString()` into the cell. A date must be a real date cell
// with a date number format, so the spreadsheet shows it in its date format,
// sorts it as a date and can do arithmetic on it. Every chart export (Gantt,
// Time, the report charts) shares this exporter.
//
// The exporter needs Meteor (ReactiveCache, TAPi18n), so this drives the same
// row-writing logic against a stand-in worksheet and pins the source.
//
// Run: node tests/chartExcelDateCells.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'models/server/ExporterChartExcel.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('chartExcelDateCells:');

test('a Date is written as a date cell with a date number format, not as ISO text', () => {
  assert.ok(/if \(cell instanceof Date\) \{\s*\n[\s\S]*?sheetCell\.value = cell;\s*\n\s*sheetCell\.numFmt = 'yyyy-mm-dd hh:mm';/.test(src));
  assert.ok(!/cell instanceof Date \? cell\.toISOString\(\)/.test(src), 'the ISO-string conversion must be gone (negative)');
});

test('the row-writing logic, run against a stand-in worksheet, keeps Date values as Dates', () => {
  // The exact branch from the exporter, extracted by its text so the test and
  // the source cannot drift apart silently.
  const branch = /row\.forEach\(\(cell, cellIndex\) => \{([\s\S]*?)\n\s*\}\);/.exec(src);
  assert.ok(branch, 'the per-cell loop body must still exist');
  const cells = {};
  const sheetRow = { getCell: i => (cells[i] = cells[i] || {}) };
  const run = new Function('row', 'sheetRow', `row.forEach((cell, cellIndex) => {${branch[1]}\n});`);
  const start = new Date(Date.UTC(2026, 8, 23, 9, 0, 0));
  run(['Card title', start, '-', 7], sheetRow);
  assert.strictEqual(cells[1].value, 'Card title');
  assert.ok(cells[2].value instanceof Date && cells[2].value.getTime() === start.getTime());
  assert.strictEqual(cells[2].numFmt, 'yyyy-mm-dd hh:mm');
  assert.strictEqual(cells[3].value, '-', 'an unset date stays the "-" placeholder text');
  assert.strictEqual(cells[3].numFmt, undefined);
  assert.strictEqual(cells[4].value, 7, 'numbers stay numbers');
});

// The follow-up ask: every OTHER Excel export too. The board/card exports
// draw the shared card document, whose meta pairs were pre-formatted text
// (fmtDate) - so their Created/Received/Start/Due/End/Last-activity cells
// were text as well. A date pair now also carries the raw Date as a third
// element, which the Excel renderer writes as a real date cell; the PDF keeps
// printing the text. The board's own Created/Modified lines likewise.
test('the shared card document carries the raw Date beside a date pair\'s text', () => {
  const document = fs.readFileSync(path.join(ROOT, 'models/lib/cardDocument.js'), 'utf8');
  assert.ok(/if \(rawDate instanceof Date && !Number\.isNaN\(rawDate\.getTime\(\)\)\) pair\.push\(rawDate\);/.test(document));
  for (const [key, field] of [['createdAt', 'createdAt'], ['card-received', 'receivedAt'], ['card-start', 'startAt'],
    ['card-due', 'dueAt'], ['card-end', 'endAt'], ['last-activity', 'modifiedAt']]) {
    assert.ok(document.includes(`add('${key}', data.${field}, card.${field});`), `${key} passes card.${field}`);
  }
});

test('the card Excel renderer and the board Excel export write those as date cells', () => {
  const renderer = fs.readFileSync(path.join(ROOT, 'models/server/renderCardDocumentExcel.js'), 'utf8');
  assert.ok(/const value = \(ref, content, rawDate\) => \{[\s\S]*?if \(rawDate instanceof Date\) \{[\s\S]*?cell\.value = rawDate;\s*\n\s*cell\.numFmt = 'yyyy-mm-dd hh:mm';/.test(renderer));
  assert.strictEqual((renderer.match(/value\(`\$\{[^`]*\}`, pair\[1\], pair\[2\]\);/g) || []).length, 2,
    'both meta-pair call sites pass the raw Date through');
  const board = fs.readFileSync(path.join(ROOT, 'models/server/ExporterExcelBoard.js'), 'utf8');
  assert.ok(/const labelValue = \(label, value, rawDate\) => \{[\s\S]*?vc\.value = rawDate;\s*\n\s*vc\.numFmt = 'yyyy-mm-dd hh:mm';/.test(board));
  assert.ok(board.includes("labelValue(this.__('createdAt'), this.fmtDate(board.createdAt), board.createdAt);"));
  assert.ok(board.includes("labelValue(this.__('modifiedAt'), this.fmtDate(board.modifiedAt), board.modifiedAt);"));
});

test('the legacy board Excel export already writes Date values into numFmt columns (nothing to fix there)', () => {
  const legacy = fs.readFileSync(path.join(ROOT, 'models/server/ExporterExcel.js'), 'utf8');
  assert.ok((legacy.match(/numFmt: 'yyyy\/mm\/dd hh:mm:ss'/g) || []).length >= 6);
  assert.ok(/addTZhours\(jcard\.dueAt\)/.test(legacy));
  assert.ok(!/toISOString\(\)/.test(legacy));
});

console.log(`\nchartExcelDateCells: ${passed} tests passed`);
