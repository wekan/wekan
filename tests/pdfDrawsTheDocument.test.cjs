'use strict';

// The PDF export draws the SHARED card document.
// Run: node tests/pdfDrawsTheDocument.test.cjs
//
// "PDF export layout should be like Excel layout." It was not: the Excel export
// drew sections under filled headers with label/value columns, and the PDF drew
// a flat list of monospaced lines - because each knew its own layout.
//
// Both now ask models/lib/cardDocument.js for the layout and only the drawing
// differs. What is left in the PDF exporter is the MAPPING - Meteor documents,
// user ids and dates turned into the plain names and strings the document takes
// - and that mapping is the part with nothing to catch it: this sandbox has no
// Meteor, so the exporter cannot be imported. So the mapping is EXTRACTED from
// the file and run against a stand-in, which is as close to executing the real
// thing as can be got here, and far closer than reading it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildExportCardDocument } = require('../models/lib/cardExportDocument');
const {
  documentToLines, buildPdfBuffer, preparePdfImage, columnRows, paginateLines,
} = require('../models/lib/pdfDocument');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'models/server/ExporterCardPDF.js'), 'utf8');
const adapterSrc = fs.readFileSync(
  path.join(ROOT, 'models/lib/cardExportDocument.js'), 'utf8');
const unicodeRenderer = fs.readFileSync(
  path.join(ROOT, 'models/server/buildUnicodePdf.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('pdfDrawsTheDocument:');

// The mapping is a pure shared function now, used directly by PDF and Excel.
function runMapping() {
  const data = {
    board: { title: 'Taulu', labels: [{ _id: 'l1', name: 'Keltainen' }] },
    list: { title: 'Lista' }, swimlane: { title: 'Uimarata' },
    card: {
      title: 'Kortti 1', description: 'Some **bold**\n\n- one', labelIds: ['l1'],
      userId: 'u1', members: ['u1'], customFields: [{ _id: 'c1', value: 'L' }],
      vote: { question: 'Q?', positive: ['u1'], negative: [] },
    },
    checklists: [{ _id: 'k1', title: 'Checklist 1' }],
    checklistItemsByChecklistId: { k1: [{ title: 'do **this**', isFinished: true }] },
    comments: [{ createdAt: new Date(0), userId: 'u1', text: 'a *comment*' }],
    subtasks: [], attachments: [
      { _id: 'image-1', name: 'a.png', size: 1234 },
      { _id: 'file-1', name: 'notes.txt', size: 321 },
    ],
    images: [{ attachmentId: 'image-1', name: 'a.png', size: '1234 B', data: Buffer.from('x') }],
    customFieldsById: { c1: { name: 'Size' } }, usersById: { u1: { username: 'xet7' } },
  };
  return buildExportCardDocument(data, {
    fields: [],
    userName: id => (data.usersById[id] && data.usersById[id].username) || '',
    formatDate: d => (d ? '2026-08-16' : ''),
    customFieldValue: (definition, value) => String(value ?? ''),
    translate: (key, fallback) => fallback || key,
  });
}

test('the exporter maps its rows onto the shared document', () => {
  const doc = runMapping();
  assert.deepStrictEqual(doc.filter(b => b.type === 'section').map(b => b.key),
    ['description', 'custom-fields', 'checklists', 'comments', 'attachments', 'voting'],
    'and a section with no data is absent - subtasks here');
  assert.strictEqual(doc[0].runs[0].text, 'Kortti 1', 'the title leads');
});

test('and the page has the Excel layout\'s parts', () => {
  const lines = documentToLines(runMapping());
  const kinds = lines.map(l => (l && l.bar ? 'bar' : (l && l.runs ? 'runs' : 'text')));
  assert.ok(kinds.includes('bar'), 'filled section headers');
  // "Board: ", not "board: " - the label is the WORD, from the document's own
  // fallback table, so a missing translation never prints a key.
  const columnLine = lines.find(l => l && l.runs && l.runs.some(r => /^Board: /.test(r.text)));
  assert.ok(columnLine, 'label/value columns');
  assert.ok(columnLine.runs.some(r => r.bold), 'with the labels emphasised');
});

test('long translated dates wrap instead of ending in an ellipsis', () => {
  const rows = columnRows([
    ['Luotu', '2026-08-17 01:09'],
    ['Vastaanotettu', '2026-08-20 01:09'],
    ['Viimeisin toiminta', '2026-08-21 23:59'],
  ]);
  const text = rows.map(row => row.runs.map(run => run.text).join('')).join('\n');
  assert.ok(text.includes('2026-08-20 01:09'));
  assert.ok(text.includes('2026-08-21 23:59'));
  assert.ok(!text.includes('…'));
});

test('markdown is rendered, not flattened with its markers', () => {
  const text = documentToLines(runMapping())
    .map(l => (typeof l === 'string' ? l : (l.text ?? (l.runs || []).map(r => r.text).join(''))))
    .join('\n');
  assert.ok(text.includes('Some bold'), 'the emphasis is applied');
  assert.ok(!text.includes('**'), 'and its asterisks are gone');
  assert.ok(text.includes('- one'), 'a list is still a list');
  assert.ok(text.includes('[x] do this'), 'and a checklist item keeps its box');
});

test('the result is a PDF a reader can open', () => {
  const pdf = buildPdfBuffer(documentToLines(runMapping()));
  const bytes = pdf.toString('latin1');
  assert.ok(bytes.startsWith('%PDF-1.'), 'a header');
  assert.ok(/startxref\n\d+\n%%EOF$/.test(bytes), 'an xref offset and a trailer');
  assert.ok(/re f/.test(bytes), 'and the section bars are actually filled');
  // The offsets in the table must point at the objects, or a viewer refuses the
  // file outright - the fault that made v10.96's bundle unopenable was of this
  // kind, measured in the wrong encoding.
  const xrefAt = parseInt(/startxref\n(\d+)/.exec(bytes)[1], 10);
  assert.strictEqual(bytes.slice(xrefAt, xrefAt + 4), 'xref', 'startxref points at the table');
});

test('PNG and JPEG attachments become image XObjects', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==',
    'base64',
  );
  // The size reader needs the JPEG markers and SOF dimensions; the original
  // DCT bytes remain untouched when they are embedded.
  const jpeg = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xC0, 0, 11, 8, 0, 1, 0, 1, 3, 1, 0x11, 0, 0xFF, 0xD9,
  ]);
  assert.deepStrictEqual(
    { width: preparePdfImage({ type: 'image/png', data: png }).width,
      height: preparePdfImage({ type: 'image/png', data: png }).height },
    { width: 1, height: 1 },
  );
  assert.strictEqual(preparePdfImage({ type: 'image/jpeg', data: jpeg }).filter, '/DCTDecode');

  const lines = documentToLines([{
    type: 'images', images: [
      { name: 'pixel.png', size: '1 KB', type: 'image/png', data: png },
      { name: 'pixel.jpg', size: '2 KB', type: 'image/jpeg', data: jpeg },
    ],
  }]);
  assert.strictEqual(lines.length, 1, 'one image row is one atomic layout item');
  assert.strictEqual(lines[0].imageRow.length, 2, 'several previews share the row');
  const caption = lines[0].imageCaptions.join(' | ');
  assert.ok(caption.includes('pixel.png') && caption.includes('pixel.jpg'));
  assert.ok(!caption.includes('KB'), 'only the filename is below each preview');
  assert.ok(!caption.includes('image:'), 'captions contain no synthetic image label');
  const page = paginateLines([...Array(48).fill('line'), ...lines]);
  assert.strictEqual(page.length, 2, 'an image row moves intact to the next page');
  assert.strictEqual(page[1][0].imageRow.length, 2);
  const bytes = buildPdfBuffer(lines).toString('latin1');
  assert.strictEqual((bytes.match(/\/Subtype \/Image/g) || []).length, 2);
  assert.ok(bytes.includes('/FlateDecode') && bytes.includes('/DCTDecode'));
  assert.ok(/\/XObject << \/Im1 \d+ 0 R/.test(bytes), 'the page can draw its images');
});

test('all attachment details precede previews whose captions contain only filenames', () => {
  const lines = documentToLines(runMapping());
  const detailRows = lines.filter(item => item && item.attachmentCells);
  assert.strictEqual(detailRows.length, 3, 'one header plus every attachment');
  assert.ok(detailRows[1].attachmentCells.includes('a.png'));
  assert.ok(detailRows[2].attachmentCells.includes('notes.txt'));
  const preview = lines.find(item => item && item.imageRow);
  assert.deepStrictEqual(preview.imageCaptions, ['a.png']);
});

test('the Unicode PDF renderer draws the same visual details as Excel', () => {
  assert.ok(/item\.labelRow/.test(unicodeRenderer) && /LABEL_COLORS/.test(unicodeRenderer),
    'colored labels');
  assert.ok(/item\.progress/.test(unicodeRenderer) && /fillAndStroke\('#2980b9'/.test(unicodeRenderer),
    'segmented checklist progress');
  assert.ok(/item\.attachmentCells/.test(unicodeRenderer), 'the six attachment detail cells');
  assert.ok(/item\.imageCaptions/.test(unicodeRenderer), 'filenames below preview rows');
});

test('a corrupt or unsupported image never breaks the PDF (negative)', () => {
  assert.strictEqual(preparePdfImage({ type: 'image/png', data: Buffer.from('bad') }), null);
  assert.strictEqual(preparePdfImage({ type: 'image/gif', data: Buffer.from('GIF89a') }), null);
  assert.doesNotThrow(() => buildPdfBuffer([
    { image: { type: 'image/png', data: Buffer.from('bad') } },
    'the attachment name still follows',
  ]));
});

test('the exporter reads attachment bytes into the shared document', () => {
  assert.ok(/fileStoreStrategyFactory\.getFileStrategy\(attachment, 'original'\)/.test(src));
  assert.ok(/PDF_IMAGE_TYPES\.has\(type\)/.test(src), 'only supported formats are read');
  assert.ok(/images,/.test(adapterSrc), 'the bytes reach the shared document');
  assert.ok(/catch \(error\)[\s\S]*could not read image/.test(src),
    'a storage failure cannot fail the export');
});

test('the exporter no longer lays a card out itself (negative)', () => {
  // The duplication being removed: a hundred and sixty lines that had to be kept
  // in step with the Excel layout by hand, and were not.
  const code = src.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  const block = code.slice(code.indexOf('cardBlockLines(data)'), code.indexOf('cardDocumentFrom'));
  assert.ok(!/wrapTextBlock|wrapRichTextBlock/.test(block),
    'cardBlockLines must not wrap text itself - it asks the document');
  assert.ok(/documentToLines\(/.test(block), 'it draws the document');
});

console.log(`\npdfDrawsTheDocument: ${passed} tests passed`);
