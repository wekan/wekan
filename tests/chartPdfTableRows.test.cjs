'use strict';

// Regression guard: reported directly - in the Frappe Gantt view's PDF export
// a row's text was not on one line: each row was written as ONE text line
// ("title  |  start  |  due  |  end") with no width limit, so a long card
// title pushed the dates off the page edge in the Unicode PDF, and past the
// line in the base-font fallback; the columns never lined up from row to row
// either. Chart rows are now models/lib/pdfDocument.js tableRow()s: fixed
// column widths (the name column twice the others), a cell that does not fit
// clipped with an ellipsis, one line per row - drawn with measured widths by
// buildUnicodePdf and as padded monospaced runs by the fallback.
//
// Run: node tests/chartPdfTableRows.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  const { tableRow, tableColumnWeights, TEXT_WIDTH } = await import('../models/lib/pdfDocument.js');

  console.log('chartPdfTableRows:');

  test('a row is one line: its padded fallback runs never exceed the text width', () => {
    const long = 'A card title so long that, joined with three dates and separators, it used to run past the page edge and break the row';
    const row = tableRow([long, '2026-09-10', '2026-09-20', '-']);
    const text = row.runs.map(run => run.text).join('');
    assert.ok(text.length <= TEXT_WIDTH, `${text.length} > ${TEXT_WIDTH}`);
    assert.ok(!text.includes('\n'));
    assert.strictEqual(row.tableCells.length, 4, 'the Unicode builder gets the raw cells');
    assert.ok(row.runs[0].text.endsWith('…'), 'the long title is clipped, not wrapped');
    assert.ok(text.includes('2026-09-10') && text.includes('2026-09-20'), 'the dates stay on the row');
  });

  test('columns line up from row to row (same widths regardless of content)', () => {
    const a = tableRow(['x', '2026-01-01', '-', '-']);
    const b = tableRow(['a much longer title here', '2026-01-02', '-', '-']);
    const startOf = row => row.runs.map(run => run.text).join('').indexOf('2026');
    assert.strictEqual(startOf(a), startOf(b));
  });

  test('the name column is twice the others, and the header is a bold bar', () => {
    assert.deepStrictEqual(tableColumnWeights(4), [2, 1, 1, 1]);
    const header = tableRow(['Card', 'Start', 'Due', 'End'], { header: true });
    assert.strictEqual(header.bar, true);
    assert.strictEqual(header.tableHeader, true);
    assert.ok(header.runs.every(run => run.text.trim() === '' || run.bold));
    assert.strictEqual(tableRow(['only']).tableCells.length, 1);
    assert.strictEqual(tableRow([]).text, '');
  });

  test('the chart PDF exporter builds its header and rows as table rows (negative on the old join)', () => {
    const src = fs.readFileSync(path.join(ROOT, 'models/server/ExporterChartPDF.js'), 'utf8');
    assert.ok(/tableRow\(headers, \{ header: true \}\)/.test(src));
    assert.ok(/lines\.push\(tableRow\(row\.map\(/.test(src));
    assert.ok(!src.includes("join('  |  ')"), 'rows must not be joined into one unbounded text line');
    const unicode = fs.readFileSync(path.join(ROOT, 'models/server/buildUnicodePdf.js'), 'utf8');
    assert.ok(/if \(item && item\.tableCells\)/.test(unicode) && /ellipsis: !!options\.width/.test(unicode),
      'the Unicode builder draws table cells with a width (and so an ellipsis)');
  });

  console.log(`\nchartPdfTableRows: ${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
