'use strict';

// server/lib/invoiceFiles.js: the PDF and Excel files of an invoice, made by
// the real pdfkit, qrcode-generator and exceljs, with the real fonts.
// Run: node tests/invoiceFiles.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const real = rel => require(path.join(ROOT, rel));

function load() {
  const exportsObj = {};
  const code = fs.readFileSync(path.join(ROOT, 'server/lib/invoiceFiles.js'), 'utf8')
    .replace(/^import[\s\S]*?from '[^']+';$/gm, '')
    .replace(/^export (async )?function /gm, (m, a) => `${a || ''}function `);
  const names = [...fs.readFileSync(path.join(ROOT, 'server/lib/invoiceFiles.js'), 'utf8').matchAll(/^export (?:async )?function (\w+)/gm)].map(m => m[1]);
  const sandbox = {
    PDFDocument: require('pdfkit'), qrcode: require('qrcode-generator'), Buffer, Promise, exportsObj,
    TAPi18n: { __: key => ({ 'billing-invoice': 'Lasku', 'billing-total': 'Yhteensä' }[key] || key) },
    createWorkbook: () => new (require('@wekanteam/exceljs').Workbook)(),
    require: rel => (rel.startsWith('/') ? real(rel.slice(1)) : require(rel)),
  };
  // In this realm, not a vm context: exceljs tells a row from its cells with
  // instanceof Array, which an array of another realm fails.
  const keys = Object.keys(sandbox);
  // eslint-disable-next-line no-new-func
  new Function(...keys, `${code}\n${names.map(n => `exportsObj.${n} = ${n};`).join('\n')}`)(...keys.map(k => sandbox[k]));
  return exportsObj;
}

const F = load();
const fonts = {
  main: fs.readFileSync(path.join(ROOT, 'private/fonts/unifont/unifont-17.0.05.otf')),
  upper: fs.readFileSync(path.join(ROOT, 'private/fonts/unifont/unifont_upper-17.0.05.otf')),
};
const P = require('../models/lib/paymentCodes.js');
const profile = { issuerName: 'Firma Oy', issuerAddress: 'Katu 1\n00100 Helsinki', businessId: '1234567-8', vatId: 'FI12345678',
  penaltyInterestPercent: 11.5, footer: 'Kiitos!',
  paymentMethods: [{ type: 'sepa', name: 'Firma Oy', iban: 'FI2112345600000785' }, { type: 'fi-bank', name: 'Firma Oy', iban: 'FI7944052020036082' }] };
const invoice = { number: 'INV-2027-0001', kind: 'invoice', issueDate: '2027-04-30', dueDate: '2027-05-14', currency: 'EUR',
  customer: 'Äiti & Poika Oy\nTie 2', paymentReference: 'RF18539007547034',
  lines: Array.from({ length: 40 }, (_, i) => ({ title: `Työ ${i + 1} =SUM(A1)`, name: 'Dee', hours: 1.5, rateMinor: 10000, amountMinor: 15000 })),
  netMinor: 600000, vatPercent: 25.5, vatMinor: 153000, totalMinor: 753000, paidMinor: 0, amountDueMinor: 753000 };

(async () => {
  const labels = F.invoiceLabels('fi');
  assert.equal(labels['billing-invoice'], 'Lasku');
  assert.equal(labels['billing-vat'], 'billing-vat', 'a missing translation shows its key, never breaks');

  const instructions = profile.paymentMethods.map(m => P.paymentInstructions(m, invoice));
  assert.ok(instructions[0].qr && instructions[1].barcode);
  const pdf = await F.invoicePdf(invoice, profile, instructions, labels, fonts, 'fi');
  assert.equal(pdf.slice(0, 5).toString(), '%PDF-');
  const pages = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length;
  assert.ok(pages >= 2, `40 lines and the payment codes need more than one page (${pages})`);
  // The QR modules and the barcode bars are drawn as rectangles in the content.
  const streams = [...pdf.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map(m => { try { return zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1'); } catch (e) { return ''; } }).join('\n');
  assert.ok((streams.match(/ re\b/g) || []).length > 500, 'QR modules and bars are vector rectangles');
  console.log('  ok - a PDF of an invoice with 40 lines, QR and bank barcode, in pages');

  const credit = await F.invoicePdf({ ...invoice, kind: 'credit', number: 'CRN-2027-0002', creditOfNumber: 'INV-2027-0001', lines: invoice.lines.slice(0, 2) },
    profile, instructions, labels, fonts, 'fi');
  assert.equal(credit.slice(0, 5).toString(), '%PDF-');
  console.log('  ok - a credit note PDF (no payment codes)');

  const xlsx = await F.invoiceXlsx(invoice, profile, labels);
  const ExcelJS = require('@wekanteam/exceljs');
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(xlsx);
  const sheet = book.worksheets[0];
  assert.equal(sheet.name, 'INV-2027-0001');
  assert.equal(sheet.getCell('A1').value, 'Lasku');
  const titles = [];
  sheet.eachRow(row => titles.push(row.getCell(1).value));
  assert.ok(titles.includes('Työ 1 =SUM(A1)'), 'a title is text');
  let formulas = 0;
  sheet.eachRow(row => row.eachCell(cell => { if (cell.formula) formulas += 1; }));
  assert.equal(formulas, 0, 'negative: nothing in the workbook is a formula');
  let total = null;
  sheet.eachRow(row => { if (row.getCell(4).value === 'Yhteensä') total = row.getCell(5).value; });
  assert.equal(total, 7530);
  console.log('  ok - an Excel workbook of the invoice: lines as text, totals as numbers, no formula');
  const svg = F.invoiceSvg({ ...invoice, customer: 'Äiti & <Poika> Oy\nTie 2', notes: '<script>alert(1)</script>' }, profile, instructions, labels, 'fi');
  const { JSDOM } = require('jsdom');
  const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
  assert.equal(doc.getElementsByTagName('parsererror').length, 0, 'well-formed SVG');
  assert.equal(doc.documentElement.getAttribute('width'), '210mm', 'A4 wide');
  assert.ok(parseFloat(doc.documentElement.getAttribute('height')) > 297, '40 lines make it longer than one A4 page');
  assert.equal(doc.getElementsByTagName('script').length, 0, 'negative: a note is text, never markup');
  assert.match(svg, /Äiti &amp; &lt;Poika&gt; Oy/);
  assert.ok([...doc.getElementsByTagName('text')].some(t => t.textContent === 'Lasku'), 'the title is text');
  assert.ok(doc.getElementsByTagName('path').length >= 2, 'the QR code and the barcode are paths');
  console.log('  ok - an SVG of the invoice: A4 wide, text as text, codes as paths, nothing a user wrote as markup');
  // A quote: its own title and "valid until"; fee and expense lines have no
  // hours or rate; no payment codes and no penalty interest.
  const quote = { ...invoice, kind: 'quote', number: 'QUO-2027-0001', dueDate: '2027-05-30', paymentReference: '',
    lines: [{ title: 'Build', name: 'Dee', hours: 2, rateMinor: 10000, amountMinor: 20000 }, { kind: 'fee', title: 'Launch', amountMinor: 50000 }] };
  const qLabels = { ...labels, 'billing-quote': 'Tarjous', 'billing-valid-until': 'Voimassa' };
  const qSvg = F.invoiceSvg(quote, profile, [], qLabels, 'fi');
  const texts = [...new JSDOM(qSvg, { contentType: 'image/svg+xml' }).window.document.getElementsByTagName('text')].map(t => t.textContent);
  assert.ok(texts.includes('Tarjous') && texts.includes('Voimassa'), 'a quote says so, and until when');
  assert.ok(!texts.includes('Lasku') && !texts.some(t => /billing-penalty-interest/.test(t)), 'not an invoice, no penalty interest');
  assert.ok(!texts.some(t => /NaN|undefined/.test(t)), 'a fee line has empty hours and rate');
  const qPdf = await F.invoicePdf(quote, profile, [], qLabels, fonts, 'fi');
  assert.match(qPdf.slice(0, 8).toString('latin1'), /^%PDF-/);
  const qXlsx = await F.invoiceXlsx(quote, profile, qLabels);
  const qBook = new ExcelJS.Workbook();
  await qBook.xlsx.load(qXlsx);
  const feeRow = qBook.worksheets[0].getRows(1, 30).find(r => r.getCell(1).value === 'Launch');
  assert.ok(!feeRow.getCell(3).value, 'no hours');
  assert.equal(feeRow.getCell(5).value, 500);
  console.log('  ok - a quote: its own title and validity, fee lines without hours, no payment details');
  // Negative: PDFKit is never left to open its built-in Helvetica, which a
  // production bundle does not carry - every PDFDocument here starts with the
  // Unicode font.
  const source = fs.readFileSync(path.join(ROOT, 'server/lib/invoiceFiles.js'), 'utf8');
  const docs = source.match(/new PDFDocument\(\{[\s\S]*?\}\);/g) || [];
  assert.ok(docs.length >= 1 && docs.every(d => /font: Buffer\.from\(fonts\.main\)/.test(d)), 'the PDF starts with the Unicode font');
  console.log('  ok - the PDF starts with its own font, not PDFKit\'s built-in Helvetica');
  console.log('\ninvoiceFiles: 6 tests passed');
})().catch(e => { console.error(e); process.exitCode = 1; });
