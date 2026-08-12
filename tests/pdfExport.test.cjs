'use strict';

// wekan/wekan#6586 "Board » Export (PDF) Umlauts corrupt and other ideas":
//   - "the umlauts (german, ä, ü, ö,...) are corrupt"
//   - "all the text in this PDF file is markdown formatted - this doesn't make
//      sense in a pdf file, does it?"
//   - "I can't see in which swimlane a card is in that export, no tags"
// Run: node tests/pdfExport.test.cjs
//
// The umlauts were replaced by hand: `.replace(/[^\x20-\x7E\n]/g, '?')` ran over
// every string before it was written, so "Grüße" left the server as "Gr??e". That
// line was a workaround for the real problem - the exporter wrote a PDF with no
// text encoding declared and assembled the file as a UTF-8 string, so anything
// above 127 would have been read through the font's built-in encoding and drawn as
// the wrong glyphs, in the wrong number.
//
// So the font declares /WinAnsiEncoding, the text is encoded to those single bytes,
// and the file is assembled as binary. This suite reads the BYTES that come out,
// because that is what a PDF viewer reads.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const {
  encodeWinAnsi,
  flattenMarkdown,
  normalizePdfText,
  wrapTextBlock,
  line,
  buildPdfBuffer,
} = require('../models/lib/pdfDocument.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('pdfExport:');

// ── encoding ────────────────────────────────────────────────────────────────
test('German umlauts survive as themselves - the reported case', () => {
  const encoded = encodeWinAnsi('Grüße, Übung, Öl, Ärger');
  assert.strictEqual(Buffer.from(encoded, 'latin1').toString('latin1'), encoded);
  // Windows-1252 == Latin-1 in this range, so the bytes are the code points.
  assert.strictEqual(encoded.charCodeAt(2), 0xFC, 'ü is one byte, 0xFC');
  assert.strictEqual(encoded.charCodeAt(3), 0xDF, 'ß is one byte, 0xDF');
  assert.ok(!encoded.includes('?'), 'and nothing is replaced by a question mark');
});

test('the rest of Western Europe too, and the punctuation a card picks up', () => {
  for (const [text, why] of [
    ['Café brûlée à côté', 'French'],
    ['Español: mañana, ¿qué?', 'Spanish'],
    ['Åland, Ærø, Ømål', 'Nordic'],
    ['Työpöytä hyvä ähkyä', 'Finnish'],
  ]) {
    assert.ok(!encodeWinAnsi(text).includes('?') || text.includes('?'),
      `${why} must not come out as question marks`);
  }
  // Smart quotes, dashes and the euro sign live in Windows-1252's own 0x80-0x9F
  // block - Latin-1 has nothing there, which is exactly why the encoding matters.
  assert.strictEqual(encodeWinAnsi('€').charCodeAt(0), 0x80);
  assert.strictEqual(encodeWinAnsi('•').charCodeAt(0), 0x95);
  assert.strictEqual(encodeWinAnsi('–').charCodeAt(0), 0x96);
  assert.strictEqual(encodeWinAnsi('’').charCodeAt(0), 0x92);
});

test('letters Windows-1252 has no room for are transliterated, not dropped', () => {
  assert.strictEqual(encodeWinAnsi('Gdańsk'), 'Gdansk');
  // ó is IN Windows-1252, so it stays; only Ł and ź have to give something up.
  assert.strictEqual(encodeWinAnsi('Łódź'), 'Lódz');
  // Š is one of the few Windows-1252 keeps (0x8A); Č is not, so it loses the caron.
  assert.strictEqual(encodeWinAnsi('Škoda Čech'), '\x8Akoda Cech');
  assert.strictEqual(encodeWinAnsi('İstanbul Şişli'), 'Istanbul Sisli');
  assert.strictEqual(encodeWinAnsi('āēīōū'), 'aeiou');
});

test('a script the base-14 fonts cannot draw falls back to ? (negative)', () => {
  // Not a defeat to hide: the fix for these is an embedded Unicode font, which is
  // a font binary this repository does not carry. What matters is that they cannot
  // corrupt the file - one byte per character, still valid Windows-1252.
  for (const text of ['Привет', 'Ελλάδα', '日本語', 'עברית', '🎉']) {
    const encoded = encodeWinAnsi(text);
    assert.ok(encoded.length > 0);
    for (let i = 0; i < encoded.length; i += 1) {
      assert.ok(encoded.charCodeAt(i) <= 0xFF,
        `${text} produced a code point above one byte, which would corrupt the stream`);
    }
  }
  assert.strictEqual(encodeWinAnsi('日本語'), '???');
});

test('encoding is idempotent where it matters, and never throws (negative)', () => {
  assert.strictEqual(encodeWinAnsi(''), '');
  assert.strictEqual(encodeWinAnsi(null), '');
  assert.strictEqual(encodeWinAnsi(undefined), '');
  assert.strictEqual(encodeWinAnsi(12345), '12345');
  assert.strictEqual(encodeWinAnsi('plain ascii'), 'plain ascii');
  // Newlines are structure, not text: the builder splits on them.
  assert.strictEqual(encodeWinAnsi('a\nb'), 'a\nb');
});

// ── markdown ────────────────────────────────────────────────────────────────
test('markdown is flattened to its words, not printed as syntax', () => {
  assert.strictEqual(flattenMarkdown('**bold** and *italic* and `code`'),
    'bold and italic and code');
  assert.strictEqual(flattenMarkdown('## Heading'), 'Heading');
  assert.strictEqual(flattenMarkdown('~~gone~~'), 'gone');
  assert.strictEqual(flattenMarkdown('> quoted'), 'quoted');
  assert.strictEqual(flattenMarkdown('* one\n+ two\n- three'), '- one\n- two\n- three');
  assert.strictEqual(flattenMarkdown('[WeKan](https://wekan.fi)'), 'WeKan (https://wekan.fi)');
  assert.strictEqual(flattenMarkdown('![shot](https://wekan.fi/a.png)'), 'shot (https://wekan.fi/a.png)');
  assert.strictEqual(flattenMarkdown('___both___'), 'both');
});

test('flattening keeps text that only looks like markdown (negative)', () => {
  // A price, a variable name and a multiplication are not emphasis.
  assert.strictEqual(flattenMarkdown('2 * 3 * 4'), '2 * 3 * 4');
  assert.strictEqual(flattenMarkdown('a_b_c'), 'a_b_c');
  assert.strictEqual(flattenMarkdown('C:\\path\\file'), 'C:\\path\\file');
  assert.strictEqual(flattenMarkdown(''), '');
  assert.strictEqual(flattenMarkdown(null), '');
});

test('HTML in a description is removed by normalizePdfText, which does not encode', () => {
  assert.strictEqual(normalizePdfText('<b>Grüße</b>').trim(), 'Grüße',
    'encoding happens once, in the builder - doing it here as well would put an '
    + 'encoded byte through the encoder a second time');
});

// ── the file ────────────────────────────────────────────────────────────────
function xrefOffsets(pdf) {
  const text = pdf.toString('latin1');
  // The TABLE, not the `startxref` line that names its offset.
  const at = text.indexOf('\nxref\n');
  const rows = text.slice(at + 1).split('\n').slice(2);
  return rows
    .filter(r => /^\d{10} \d{5} [nf]/.test(r))
    .map(r => Number(r.slice(0, 10)));
}

test('the PDF declares WinAnsiEncoding and carries the bytes for the umlauts', () => {
  const pdf = buildPdfBuffer([line('Grüße', true), 'Übung: 5 €']);
  const text = pdf.toString('latin1');
  assert.ok(text.includes('/BaseFont /Courier /Encoding /WinAnsiEncoding'),
    'without the encoding the viewer reads those bytes through StandardEncoding');
  assert.ok(text.includes('/BaseFont /Courier-Bold'), 'and a bold font for headings');
  assert.ok(text.includes('(Gr\xFC\xDFe)'), 'ü and ß are single Windows-1252 bytes');
  assert.ok(text.includes('\x80'), 'the euro sign is 0x80, which Latin-1 does not have');
  assert.ok(!text.includes('Gr??e'), 'and nothing became a question mark');
});

test('the xref offsets are byte offsets, not UTF-8 character counts', () => {
  // This is what makes an accented export a VALID file rather than one some
  // viewers refuse: measure the assembled file as UTF-8 and every offset after the
  // first non-ASCII byte is wrong.
  const pdf = buildPdfBuffer(['Grüße über alles', 'Ärger']);
  const offsets = xrefOffsets(pdf);
  assert.ok(offsets.length >= 5, 'one row per object');
  const text = pdf.toString('latin1');
  offsets.forEach((offset, index) => {
    if (index === 0) return;   // the free entry
    assert.strictEqual(text.slice(offset, offset + String(index).length + 6),
      `${index} 0 obj`,
      `object ${index} does not start where the xref table says it does`);
  });
  assert.strictEqual(pdf.slice(0, 5).toString('latin1'), '%PDF-', 'still a PDF');
  assert.ok(text.trimEnd().endsWith('%%EOF'));
});

test('the bold font is selected only for the lines that ask for it', () => {
  const pdf = buildPdfBuffer([line('Heading', true), 'body', line('Another', true)]);
  const text = pdf.toString('latin1');
  assert.strictEqual((text.match(/\/F2 10 Tf/g) || []).length, 2, 'two bold lines');
  assert.ok(/\/F1 10 Tf/.test(text), 'and it switches back for the body');
});

test('an empty export is still a readable PDF (negative)', () => {
  const pdf = buildPdfBuffer([]);
  const text = pdf.toString('latin1');
  assert.ok(text.includes('(No data)'), 'rather than a file with no pages, which will not open');
  assert.ok(text.includes('/Count 1'));
});

test('wrapping counts the indent, so an indented line still fits the page', () => {
  const long = 'w'.repeat(200);
  for (const l of wrapTextBlock(long, '    ')) {
    assert.ok(l.length <= 90, `a wrapped line is ${l.length} characters wide`);
    assert.ok(l.startsWith('    '), 'and keeps its indent');
  }
});

// ── what the exports say ────────────────────────────────────────────────────
test('the exporter uses the shared document, and no longer erases non-ASCII', () => {
  const exporter = read('models/server/ExporterCardPDF.js');
  assert.ok(/from '\/models\/lib\/pdfDocument'/.test(exporter),
    'one PDF builder, so the card and board exports cannot drift apart');
  assert.ok(!/\[\^\\x20-\\x7E\\n\]/.test(exporter),
    'the question-mark replacement is the bug; it must not survive anywhere');
});

test('the board export names swimlanes and labels, and prints no markdown', () => {
  const exporter = read('models/server/ExporterCardPDF.js');
  const board = exporter.slice(exporter.indexOf('class ExporterBoardPDF'));
  assert.ok(/getSwimlanes/.test(board),
    '"I can\'t see in which swimlane a card is in that export"');
  assert.ok(/Labels: /.test(board) && /labelsById/.test(board), 'and "no tags"');
  assert.ok(/Members: /.test(board) && /Assignees: /.test(board));
  assert.ok(/due \$\{formatDateValue\(card\.dueAt\)\}/.test(board), 'and the dates');
  assert.ok(!/`## \$\{/.test(board) && !/'## '/.test(board),
    'a "##" in a PDF is two hash marks - the structure is drawn with the bold font');
  assert.ok(/line\(`\$\{list\.title \|\| 'List'\} \(\$\{listCards\.length\}\)`, true\)/.test(board),
    'so a list heading is a heading rather than a markdown line');
});

test('a board with one swimlane does not talk about swimlanes (negative)', () => {
  const exporter = read('models/server/ExporterCardPDF.js');
  const board = exporter.slice(exporter.indexOf('class ExporterBoardPDF'));
  assert.ok(/named\.length > 1/.test(board),
    'every board has a Default swimlane nobody thinks about; naming it in every '
    + 'export is noise, not information');
  assert.ok(/type !== 'template-swimlane'/.test(board),
    'and a template swimlane is not a place a card lives');
});

console.log(`\npdfExport: ${passed} tests passed`);
