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
  inlineRuns,
  normalizePdfText,
  wrapTextBlock,
  wrapRichTextBlock,
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

test('the board export draws its cards with the CARD export\'s own block', () => {
  const exporter = read('models/server/ExporterCardPDF.js');
  const board = exporter.slice(exporter.indexOf('class ExporterBoardPDF'));
  assert.ok(/getSwimlanes/.test(board),
    '"I can\'t see in which swimlane a card is in that export"');
  // #1173: the board export used to render a thinner version of each card, which
  // is how it ended up saying "due" where the card export said "Due:" and
  // leaving out most of what a card holds. It now calls cardBlockLines - the
  // card export's own block - so the labels, the dates and the sections cannot
  // be two different things again.
  assert.ok(/this\.cardBlockLines\(/.test(board),
    'every card is drawn by the card export block');
  const shared = exporter.slice(exporter.indexOf('class PDFExporterBase'),
    exporter.indexOf('class ExporterCardPDF'));
  const adapter = read('models/lib/cardExportDocument.js');
  // The block draws the SHARED document now (models/lib/cardDocument.js), so
  // the labels and the dates are pinned where they went: the exporter maps
  // them, and the document puts them in the header. The reported symptoms are
  // unchanged - "no tags" and a card whose swimlane cannot be seen.
  assert.ok(/labelsById/.test(adapter) && /labels: \(card\.labelIds/.test(adapter),
    'and "no tags" - the exporter maps a card\'s labels onto the document');
  const document = read('models/lib/cardDocument.js');
  assert.ok(/add\('labels'/.test(document), 'which puts them in the header');
  assert.ok(/dueAt: date\(card\.dueAt\)/.test(adapter)
    && /add\('card-due', data\.dueAt\)/.test(document),
    'and the dates, under the same i18n keys the card export gives them');
  assert.ok(!/dates\.push\(`due /.test(exporter),
    'the lowercase colon-less "due" is what was reported; it must not come back');
  assert.ok(!/`## \$\{/.test(board) && !/'## '/.test(board),
    'a "##" in a PDF is two hash marks - the structure is drawn with the bold font');
  assert.ok(/this\.field\('list', 'List', `\$\{list\.title/.test(board),
    'so a list heading is a heading rather than a markdown line');
});

test('a board names even its only swimlane before its lists', () => {
  const exporter = read('models/server/ExporterCardPDF.js');
  const board = exporter.slice(exporter.indexOf('class ExporterBoardPDF'));
  assert.ok(/named\.map\(swimlane/.test(board),
    'the hierarchy does not erase a single swimlane');
  assert.ok(/type !== 'template-swimlane'/.test(board),
    'and a template swimlane is not a place a card lives');
});

// ── markdown as formatting, not as words (the reopened #6586) ───────────────
// "Would it make sense to support markdown formated text in description? (so it
// gets transformed correct in the pdf output with bold, underline,....)"

test('bold, italic and both become runs, and lose their markers', () => {
  assert.deepStrictEqual(inlineRuns('a **b** c'), [
    { text: 'a ', bold: false, italic: false },
    { text: 'b', bold: true, italic: false },
    { text: ' c', bold: false, italic: false },
  ]);
  assert.deepStrictEqual(inlineRuns('*i*'), [{ text: 'i', bold: false, italic: true }]);
  assert.deepStrictEqual(inlineRuns('***both***'), [{ text: 'both', bold: true, italic: true }]);
  // Nested, because a description writes it: the inner style is kept too.
  assert.deepStrictEqual(inlineRuns('**b *i* b**'), [
    { text: 'b ', bold: true, italic: false },
    { text: 'i', bold: true, italic: true },
    { text: ' b', bold: true, italic: false },
  ]);
});

test('what has no face keeps its words and loses its markers', () => {
  // There is no strike and no fifth Courier, so `~~` and `` ` `` are not invented.
  assert.deepStrictEqual(inlineRuns('~~gone~~'), [{ text: 'gone', bold: false, italic: false }]);
  assert.deepStrictEqual(inlineRuns('`code`'), [{ text: 'code', bold: false, italic: false }]);
});

test('an underscore inside a word is an identifier, not emphasis (negative)', () => {
  // The rule flattenMarkdown already applied: turning half of snake_case italic
  // rewrites the text the card actually holds.
  assert.deepStrictEqual(inlineRuns('file_name_here'),
    [{ text: 'file_name_here', bold: false, italic: false }]);
  assert.deepStrictEqual(inlineRuns('a _i_ b'), [
    { text: 'a ', bold: false, italic: false },
    { text: 'i', bold: false, italic: true },
    { text: ' b', bold: false, italic: false },
  ]);
});

test('an unclosed marker is text, not a style that runs to the end', () => {
  assert.deepStrictEqual(inlineRuns('2 ** 3'), [{ text: '2 ** 3', bold: false, italic: false }]);
  assert.deepStrictEqual(inlineRuns('a * b'), [{ text: 'a * b', bold: false, italic: false }]);
});

test('a wrapped rich line still fits the page, and keeps its indent', () => {
  // No space just inside the markers: `** x **` is not emphasis in markdown
  // either, and inlineRuns follows that rule.
  const long = `**${'bold '.repeat(30).trim()}** and ${'plain '.repeat(30)}`;
  const lines = wrapRichTextBlock(long, '    ');
  assert.ok(lines.length > 1, 'it wrapped');
  for (const item of lines) {
    const text = item.runs.map(run => run.text).join('');
    assert.ok(text.length <= 90, `a wrapped line is ${text.length} characters wide`);
    assert.ok(text.startsWith('    '), 'and keeps its indent');
  }
  assert.ok(lines.some(item => item.runs.some(run => run.bold)),
    'and the emphasis survived the wrap');
});

test('block markdown is still flattened around the runs', () => {
  const lines = wrapRichTextBlock('## Heading\n- item **b**');
  const texts = lines.map(item => item.runs.map(run => run.text).join(''));
  assert.ok(texts.includes('Heading'), 'a "##" is two hash marks in a PDF');
  assert.ok(texts.some(t => t.startsWith('- item')), 'a bullet keeps one shape');
  assert.ok(!texts.some(t => t.includes('**')), 'and no marker is printed');
});

test('the PDF declares all four Courier faces and switches between them', () => {
  const pdf = buildPdfBuffer([
    ...wrapRichTextBlock('plain **bold** *italic* ***both***'),
  ]).toString('latin1');
  for (const face of ['Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique']) {
    assert.ok(pdf.includes(`/BaseFont /${face} `), `${face} is declared`);
  }
  for (const id of ['/F1', '/F2', '/F3', '/F4']) {
    assert.ok(pdf.includes(`${id} `), `${id} is in the page resources`);
  }
  // Runs are drawn as consecutive Tj with a font switch between them - which is
  // what makes them line up without measuring a single glyph.
  assert.ok(/\(plain \) Tj\n\/F2 10 Tf\n\(bold\) Tj/.test(pdf),
    'a bold run follows the plain one on the same line');
});

console.log(`\npdfExport: ${passed} tests passed`);
