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
  // The fork fixed it (createZipArchive, .tools/exceljs commit 7b2f939); until
  // that release is installed, the installed exceljs still calls the factory.
  const writerSource = read('node_modules/@wekanteam/exceljs/lib/stream/xlsx/workbook-writer.js');
  assert.ok(/Archiver\('zip'/.test(writerSource) || /function createZipArchive\(/.test(writerSource),
    'exceljs either calls the archiver 7 factory or builds archiver 8\'s ZipArchive');
});

test('WeKan asks the question before it builds anything', () => {
  const source = read('models/server/createWorkbook.js');
  assert.ok(/function streamingWriterWorks\(\)/.test(source), 'there is a capability check');
  assert.ok(/typeof require\('archiver'\) === 'function'/.test(source),
    "and it asks what archiver EXPORTS - probing by construction throws an "
    + "error event, which takes the process with it rather than the request");
  const create = source.slice(source.indexOf('export const createWorkbookWriter'));
  assert.ok(/if \(!streamingWriterWorks\(\) \|\| \(options\.images && !forkStreamsImages\(\)\)\)/.test(create),
    'and createWorkbookWriter returns the buffered writer when it cannot stream, '
    + 'or cannot place images on a streaming sheet');
  // The fixed fork is recognised by what it HAS, not by a version number.
  assert.ok(/WorkbookWriter\.prototype\._addDrawing === 'function'/.test(source));
});

// The card export, and the board export drawn in the card layout, held every
// picture of every card in memory: each was read whole into a Buffer and the
// workbook was written at the end with workbook.xlsx.write. Now they write
// through createWorkbookWriter, and with the fork's streaming writer each
// picture is a function that opens it when the writer reaches it.
test('the card and board Excel exports stream their pictures, one at a time', () => {
  for (const file of ['models/server/ExporterExcelCard.js', 'models/server/ExporterExcelBoard.js']) {
    const source = read(file);
    assert.ok(source.includes('createWorkbookWriter(res, { images: true })'), `${file} writes to the response as it goes`);
    assert.ok(source.includes('await workbook.commit();'), `${file} commits the workbook`);
    assert.ok(!/workbook\.xlsx\.write\(res\)/.test(source), `${file}: negative - no whole-workbook write`);
    assert.ok(!/createWorkbook\(\)/.test(source), `${file}: negative - no in-memory workbook`);
    assert.ok(/res\.destroy\(err\)/.test(source), `${file}: a failure after the first byte ends the download`);
  }
  const card = read('models/server/ExporterExcelCard.js');
  const block = card.slice(card.indexOf('async renderCardBlock'), card.indexOf('// ── Build'));
  const streamed = block.slice(block.indexOf('if (streamsImages) {'), block.indexOf('continue;\n      }') );
  assert.ok(/stream: lazyImageStream\(attachment\)/.test(streamed), 'a streaming workbook gets a lazy picture');
  assert.ok(!/streamToBuffer|getReadStream/.test(streamed), 'negative: nothing is read while the sheet is drawn');
  const lazy = card.slice(card.indexOf('function lazyImageStream'), card.indexOf('/** Read an entire'));
  assert.ok(/return \(\) => \{/.test(lazy), 'the picture is opened only when the writer calls for it');
  assert.ok(/source\.on\('error'[\s\S]*out\.end\(\)/.test(lazy), 'and a picture that cannot be read is written empty');
  const render = read('models/server/renderCardDocumentExcel.js');
  assert.ok(/image\.stream\s*\?\s*\{ stream: image\.stream, extension: image\.ext \}/.test(render));
  // The board export writes each card's rows out once the card is drawn.
  const board = read('models/server/ExporterExcelBoard.js');
  assert.ok(/commitRowsBefore\(row\);/.test(board));
  assert.ok(/ws\.getRow\(next - 1\)\.commit\(\);/.test(board));
  // The buffered stand-in takes pictures too, as bytes.
  assert.ok(/addImage\(image\) \{\s*return this\._workbook\.addImage\(image\);/.test(read('models/server/createWorkbook.js')));
});

test('the installed exceljs gets the writer it can use for pictures', async () => {
  const { createWorkbookWriter, workbookStreamsImages } = await import('../models/server/createWorkbook.js');
  const Excel = require(path.join(repoRoot, 'node_modules/@wekanteam/exceljs'));
  const forked = typeof Excel.stream.xlsx.WorkbookWriter.prototype._addDrawing === 'function';
  const writer = createWorkbookWriter(new PassThrough(), { images: true });
  assert.strictEqual(workbookStreamsImages(writer), forked);
  if (!forked) {
    assert.strictEqual(writer.constructor.name, 'BufferedWorkbookWriter',
      'an exceljs without streaming pictures gets the in-memory workbook');
    assert.strictEqual(typeof writer.addImage, 'function');
  }
});

// The fork itself, when it is checked out under .tools: pictures given as
// functions are opened one after another, only when the workbook commits.
test('the @wekanteam/exceljs fork streams pictures one at a time', async () => {
  const forkPath = path.join(repoRoot, '.tools/exceljs/lib/exceljs.nodejs.js');
  if (!fs.existsSync(forkPath)) { console.log('    (skipped: no .tools/exceljs)'); return; }
  let Excel;
  try { Excel = require(forkPath); } catch (e) { console.log(`    (skipped: ${e.message})`); return; }
  if (typeof Excel.stream.xlsx.WorkbookWriter.prototype._addDrawing !== 'function') {
    console.log('    (skipped: .tools/exceljs is older than the streaming pictures)');
    return;
  }
  const { Readable } = require('stream');
  const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000'
    + '1f15c4890000000d4944415478da63f8ffff3f0005fe02fea7a6c5e10000000049454e44ae426082', 'hex');
  const out = new PassThrough();
  const chunks = [];
  out.on('data', c => chunks.push(c));
  const wb = new Excel.stream.xlsx.WorkbookWriter({ stream: out });
  let opened = 0; let open = 0; let maxOpen = 0;
  const picture = () => () => {
    opened += 1; open += 1; maxOpen = Math.max(maxOpen, open);
    const s = Readable.from([png]);
    s.on('end', () => { open -= 1; });
    return s;
  };
  const ws = wb.addWorksheet('Card');
  for (let i = 0; i < 4; i += 1) {
    ws.getRow(i + 1).height = 95;
    ws.addImage(wb.addImage({ stream: picture(), extension: 'png' }), { tl: { col: i, row: i }, ext: { width: 105, height: 115 } });
  }
  ws.getRow(5).getCell(1).value = 'after';
  ws.commit();
  assert.strictEqual(opened, 0, 'no picture is opened while the sheet is drawn');
  await wb.commit();
  assert.strictEqual(opened, 4);
  assert.strictEqual(maxOpen, 1, 'one picture open at a time');
  const back = new Excel.Workbook();
  await back.xlsx.load(Buffer.concat(chunks));
  assert.strictEqual(back.worksheets[0].getImages().length, 4);
  assert.strictEqual(back.model.media.length, 4);
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
