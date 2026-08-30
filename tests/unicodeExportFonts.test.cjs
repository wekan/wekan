'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const root = path.resolve(__dirname, '..');
const mainFont = path.join(root, 'private/fonts/unifont/unifont-17.0.05.otf');
const upperFont = path.join(root, 'private/fonts/unifont/unifont_upper-17.0.05.otf');
const pdfExporter = fs.readFileSync(path.join(root, 'models/server/ExporterCardPDF.js'), 'utf8');
const pdfRenderer = fs.readFileSync(path.join(root, 'models/server/buildUnicodePdf.js'), 'utf8');
const excelRoute = fs.readFileSync(path.join(root, 'models/exportExcelCard.js'), 'utf8');

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
console.log('unicodeExportFonts:');

await test('the distributable carries both Unicode-plane fonts and their license', () => {
  assert.ok(fs.statSync(mainFont).size > 5_000_000, 'the BMP font is present');
  assert.ok(fs.statSync(upperFont).size > 5_000_000, 'the supplementary-plane font is present');
  const license = fs.readFileSync(path.join(root, 'private/fonts/unifont/LICENSE.txt'), 'utf8');
  assert.match(license, /SIL OPEN FONT LICENSE/i);
});

await test('PDF export loads and embeds the bundled fonts', () => {
  assert.match(pdfExporter, /Assets\.getBinaryAsync\('fonts\/unifont\/unifont-17\.0\.05\.otf'\)/);
  assert.match(pdfExporter, /await buildUnicodePdf/);
  assert.match(pdfRenderer, /registerFont\(MAIN_FONT/);
  assert.match(pdfRenderer, /registerFont\(UPPER_FONT/);
  assert.match(pdfRenderer, /codePointAt\(0\) > 0xffff/);
  assert.match(pdfRenderer, /new PDFDocument\([\s\S]*font: mainFont/,
    'the constructor must not initialize Helvetica from an external AFM file');
});

await test('the cross-built server bundle selects PDFKit at runtime', () => {
  assert.match(pdfRenderer, /Npm\.require\('pdfkit'\)/,
    'runtime CommonJS resolution uses the deployed platform path');
  assert.doesNotMatch(pdfRenderer, /import PDFDocument from 'pdfkit'/,
    'an ESM import would preserve the Linux build-time import.meta.url');
  const esm = fs.readFileSync(require.resolve('pdfkit'), 'utf8');
  assert.doesNotMatch(esm, /createRequire\(import\.meta\.url\)/,
    'the selected CommonJS PDFKit entry must not depend on an ESM build URL');
});

await test('PDFKit starts directly with the bundled font, without Helvetica', async () => {
  const chunks = [];
  const doc = new PDFDocument({ font: fs.readFileSync(mainFont) });
  doc.on('data', chunk => chunks.push(chunk));
  const ended = new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });
  doc.text('Suomi Ελληνικά العربية 中文');
  doc.end();
  await ended;
  const bytes = Buffer.concat(chunks).toString('latin1');
  assert.match(bytes, /\/ToUnicode/);
  assert.doesNotMatch(bytes, /Helvetica/);
});

await test('PDFKit can parse and subset both shipped fonts', async () => {
  const chunks = [];
  const doc = new PDFDocument();
  doc.on('data', chunk => chunks.push(chunk));
  const ended = new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
  });
  doc.registerFont('bmp', mainFont).registerFont('upper', upperFont);
  doc.font('bmp').text('Suomi Ελληνικά Кириллица العربية 中文 हिन्दी');
  doc.font('upper').text('😀');
  doc.end();
  await ended;
  const bytes = Buffer.concat(chunks).toString('latin1');
  assert.match(bytes, /\/ToUnicode/);
  assert.match(bytes, /\/FontFile3/);
});

await test('Excel preserves Unicode but does not claim to embed a font', () => {
  assert.doesNotMatch(excelRoute, /embedFont|fontData|fontBuffer/);
});

await test('the shared Excel renderer retains metadata and wraps colored labels', async () => {
  const { Workbook } = require('@wekanteam/exceljs');
  const { renderCardDocumentExcel } = await import(
    '../models/server/renderCardDocumentExcel.js'
  );
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Card');
  const labels = Array.from({ length: 7 }, (_, index) => ({
    name: `Label ${index + 1}`, color: 'blue',
  }));
  const result = await renderCardDocumentExcel(sheet, workbook, 1, [{
    type: 'meta',
    pairs: [['Board', 'Unicode board'], ['Labels', labels.map(label => label.name).join(', ')]],
    labelTitle: 'Labels',
    labelDetails: labels,
  }]);
  assert.strictEqual(sheet.getCell('B1').value, 'Unicode board');
  assert.strictEqual(sheet.getCell('B2').value, 'Label 1');
  assert.strictEqual(sheet.getCell('B3').value, 'Label 6');
  assert.strictEqual(result.row, 4);
});

await test('Excel places six image previews per row with filenames below', async () => {
  const { Workbook } = require('@wekanteam/exceljs');
  const { renderCardDocumentExcel } = await import(
    '../models/server/renderCardDocumentExcel.js'
  );
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==',
    'base64',
  );
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Images');
  const images = Array.from({ length: 7 }, (_, index) => ({
    name: `image-${index + 1}.png`, ext: 'png', data: png,
  }));
  const result = await renderCardDocumentExcel(sheet, workbook, 1,
    [{ type: 'images', images }]);
  const placements = sheet.getImages();
  assert.strictEqual(placements.length, 7);
  assert.deepStrictEqual(placements.slice(0, 6).map(image => image.range.tl.row),
    [0, 0, 0, 0, 0, 0]);
  assert.strictEqual(placements[6].range.tl.row, 2, 'the seventh image starts the next row');
  assert.strictEqual(sheet.getCell('A2').value, 'image-1.png');
  assert.strictEqual(sheet.getCell('B2').value, 'image-2.png');
  assert.strictEqual(sheet.getCell('F2').value, 'image-6.png');
  assert.strictEqual(sheet.getCell('A4').value, 'image-7.png');
  assert.strictEqual(result.row, 5);
});

console.log(`\nunicodeExportFonts: ${passed} tests passed`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
