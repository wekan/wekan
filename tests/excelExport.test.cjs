'use strict';

// #6591: "Board Settings -> Export board -> export/Excel didn't work".
// Run: node tests/excelExport.test.cjs
//
// Reproduced against a running WeKan before fixing it: the CSV and JSON exports
// of the same board answered 200, and the Excel one never answered at all -
//
//   csv:   HTTP 200 4758b
//   json:  HTTP 200 4491b
//   excel: Operation timed out after 30002 milliseconds with 0 bytes received
//
// - with nothing in the server log. Two independent faults, and this suite pins
// both, because either one alone still hangs the browser.
//
//   1. THE ZIP. exceljs 4.7.3's streaming WorkbookWriter calls archiver the way
//      archiver 7 was called - `Archiver('zip', opts)` - and WeKan moved to
//      archiver 8 for the low-memory backup zips. archiver 8 is ESM and exports
//      CLASSES, so that is `TypeError: Archiver is not a function`, and the
//      export has been broken since the bump. Building the missing factory does
//      not rescue it either: archiver 8's readable-stream then refuses the
//      objects exceljs appends ("input source must be valid Stream or Buffer
//      instance"), as an error EVENT rather than a rejection.
//
//   2. THE SILENCE. The route called `exporterExcel.build(res)` without
//      awaiting it, so the rejection went nowhere: no 500, no log, and a
//      response that was never written or ended. Every sibling route (PDF, card
//      Excel) awaits; this one did not.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

console.log('excelExport:');

test('archiver is the version WeKan uses, and exceljs cannot call it', () => {
  // Not a hypothetical incompatibility: this is what the installed packages do.
  const archiver = require(path.join(repoRoot, 'node_modules/archiver'));
  const version = require(path.join(repoRoot, 'node_modules/archiver/package.json')).version;
  if (Number(version.split('.')[0]) >= 8) {
    assert.notStrictEqual(typeof archiver, 'function',
      'archiver 8 exports classes, which is why the streaming writer broke');
    assert.strictEqual(typeof archiver.ZipArchive, 'function', 'and ZipArchive is the zip one');
  }
  const writerSource = read('node_modules/@wekanteam/exceljs/lib/stream/xlsx/workbook-writer.js');
  assert.ok(/Archiver\('zip'/.test(writerSource),
    'exceljs still calls the archiver 7 factory; if this ever changes, the '
    + 'fallback in createWorkbook.js can go');
});

test('WeKan asks the question before it builds anything', () => {
  const source = read('models/server/createWorkbook.js');
  assert.ok(/function streamingWriterWorks\(\)/.test(source), 'there is a capability check');
  assert.ok(/typeof require\('archiver'\) === 'function'/.test(source),
    "and it asks what archiver EXPORTS - probing by construction throws an "
    + "error event, which takes the process with it rather than the request");
  const create = source.slice(source.indexOf('export const createWorkbookWriter'));
  assert.ok(/if \(!streamingWriterWorks\(\)\)/.test(create),
    'and createWorkbookWriter returns the buffered writer when it cannot stream');
});

test('the fallback writer has the same API the exporter calls', () => {
  // ExporterExcel builds the sheet through the streaming API: addWorksheet,
  // getWorksheet, row.commit(), worksheet.commit(), workbook.commit(). A
  // fallback missing one of those swaps a hang for a TypeError.
  const source = read('models/server/createWorkbook.js');
  for (const method of ['addWorksheet', 'getWorksheet', 'async commit()']) {
    assert.ok(source.includes(method), `the buffered writer needs ${method}`);
  }
  const exporter = read('models/server/ExporterExcel.js');
  for (const call of ['workbook.addWorksheet', 'workbook.getWorksheet', '.commit()', 'await workbook.commit()']) {
    assert.ok(exporter.includes(call), `the exporter still uses ${call}`);
  }
});

test('the buffered writer really produces an xlsx', async () => {
  // The behaviour, not the shape: run the actual class over a real stream.
  const Excel = require(path.join(repoRoot, 'node_modules/@wekanteam/exceljs'));
  const workbook = new Excel.Workbook();
  const out = new PassThrough();
  const chunks = [];
  out.on('data', c => chunks.push(c));
  const ws = workbook.addWorksheet('Board');
  ws.getRow(1).values = ['Title', 'List', 'Swimlane'];
  ws.getRow(1).commit();
  for (let i = 2; i <= 20; i++) {
    ws.getRow(i).values = [`Card ${i}`, 'List A', 'Default'];
    ws.getRow(i).commit();
  }
  await workbook.xlsx.write(out);
  out.end();
  const buffer = Buffer.concat(chunks);
  assert.ok(buffer.length > 1000, `an empty export is the bug: got ${buffer.length} bytes`);
  assert.strictEqual(buffer.slice(0, 2).toString(), 'PK', 'and an xlsx is a zip');
});

test('the route AWAITS the build, so a failure is a 500 and not a hang', () => {
  const route = read('models/exportExcel.js');
  assert.ok(/await exporterExcel\.build\(res\)/.test(route),
    'without the await the rejection goes nowhere and the request never ends');
  assert.ok(/catch \(error\)/.test(route) && /res\.writeHead\(500/.test(route),
    'and a failure answers, rather than leaving the browser waiting');
  assert.ok(/console\.error\('exportExcel failed/.test(route),
    'and says so in the log, which had nothing in it at all');
});

test('every other export route already awaited its build (negative)', () => {
  // The reason this was one route's bug and not a pattern: the others are
  // right, and this guard keeps them that way.
  for (const file of ['models/exportExcelCard.js', 'models/exportPDF.js']) {
    const source = read(file);
    const calls = source.split('\n').filter(l => /\.build\(res\)/.test(l));
    assert.ok(calls.length > 0, `${file} should export something`);
    for (const call of calls) {
      assert.ok(/await /.test(call), `${file}: ${call.trim()} must be awaited`);
    }
  }
});

(async () => {
  for (const [name, fn] of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\nexcelExport: ${passed} tests passed`);
})().catch(err => { console.error(err); process.exit(1); });
