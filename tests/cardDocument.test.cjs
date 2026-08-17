'use strict';

// One card layout, described once, for both exporters.
// Run: node tests/cardDocument.test.cjs
//
// The rule: the same functions, layouts and templates for every PDF and Excel
// export, so that there is no duplicated code
// (docs/Features/ImportExport/One-Card-Layout.md).
//
// The layout is the one "Export card to Excel" already draws - it is the one
// that was designed. What was missing is that only ONE exporter could draw it:
// the Excel code knew the layout AND how to write a worksheet, so the PDF could
// not use it without becoming a worksheet, and grew its own instead - a list of
// monospaced lines with none of the structure.
//
// models/lib/cardDocument.js is that layout as data: blocks that name no colour,
// no column letter and no font size. This suite is about the properties a
// renderer depends on, and it runs as arithmetic - no Meteor, no database, no
// ExcelJS.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  buildCardDocument, documentSections, hasSectionData, sectionsWithData, wanted,
} = require('../models/lib/cardDocument');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const CARD = {
  title: 'Kortti 1', description: 'Some **bold** text\n\n- one\n- two', sort: 42,
  stickers: [{ icon: 'flag', name: 'Urgent', color: 'red' }],
  locations: [{
    _id: 'loc1', name: 'Office', address: 'Main Street 1',
    latitude: 60.1699, longitude: 24.9384,
  }],
  cardDependencies: [{ cardId: 'other', type: 'blocks', icon: 'link', color: '#f00' }],
};
const DATA = {
  boardTitle: 'Taulu', listTitle: 'Lista', createdBy: 'xet7',
  labels: ['Keltainen', 'Punainen'],
  checklists: [{ title: 'Checklist 1', items: [{ title: 'do **this**', isFinished: true }] }],
  comments: [{ date: '2026-08-16', author: 'xet7', text: 'a *comment*' }],
  attachments: [{ name: 'a.png', size: '12 kB' }],
  images: [{ name: 'a.png', ext: 'png', data: Buffer.from('x') }],
};

console.log('cardDocument:');

test('the sections are the Excel layout\'s sections, in its order', () => {
  // Not a new layout - the one that exists, described. If these ever stop
  // matching what the Excel exporter draws, the two have started to drift,
  // which is the thing being removed. The fixture has no custom fields and no
  // subtasks, and those sections are therefore absent: only fields that have
  // data are added.
  assert.deepStrictEqual(documentSections(buildCardDocument(CARD, DATA, [], k => k)), [
    'stickers', 'locations', 'dependencies',
    'description', 'checklists', 'comments', 'attachments',
  ]);
});

test('every opened-card field missing from the old export is in the shared document', () => {
  const doc = buildCardDocument(CARD, DATA, [], k => k);
  const allText = JSON.stringify(doc);
  for (const value of [
    'Urgent', 'flag', 'red', 'Office', 'Main Street 1', '60.1699', '24.9384',
    'other', 'blocks', '#f00', '42',
  ]) assert.ok(allText.includes(value), `${value} is exported`);

  const legacy = buildCardDocument({
    locationName: 'Legacy place', locationAddress: 'Old road',
    locationLatitude: 1.25, locationLongitude: 2.5,
  }, {}, [], k => k);
  const legacyText = JSON.stringify(legacy);
  for (const value of ['Legacy place', 'Old road', '1.25', '2.5']) {
    assert.ok(legacyText.includes(value), `legacy ${value} is exported`);
  }
});

test('ONLY the fields that have data are added', () => {
  // An export should not carry a Comments heading with nothing under it, or a
  // Custom fields section for a card that has none. "Empty" is a judgement - a
  // checklist with no items is empty, a checklist whose items are all unticked
  // is not - so it is answered once, here, and both exporters ask this function.
  assert.deepStrictEqual(documentSections(buildCardDocument({}, {}, [], k => k)), [],
    'a card with nothing in it exports no sections at all');

  assert.strictEqual(hasSectionData('description', { description: '   ' }), false,
    'whitespace is not a description');
  assert.strictEqual(hasSectionData('comments', {}, { comments: [{ text: '' }] }), false,
    'a comment with no text is not a comment');
  assert.strictEqual(hasSectionData('custom-fields', {},
    { customFields: [{ name: 'Size', value: '' }] }), false,
    'a field with no value is not data - most cards carry definitions with nothing in them');
  assert.strictEqual(hasSectionData('custom-fields', {},
    { customFields: [{ name: 'Size', value: 'L' }] }), true);
  assert.strictEqual(hasSectionData('checklists', {},
    { checklists: [{ title: 'Steps', items: [] }] }), true,
    'a named checklist with no items yet is still something the card says');
  assert.strictEqual(hasSectionData('attachments', {}, { attachments: [], images: [] }), false);

  // And the two questions stay separate: the popup's selection says what the
  // reader ASKED for, the data says what there is to give them.
  assert.deepStrictEqual(sectionsWithData(CARD, DATA, ['comments']), ['comments'],
    'a selection narrows it further, and never widens it');
});

test('a title and its meta pairs come first, three to a row', () => {
  const doc = buildCardDocument(CARD, DATA, [], k => k);
  assert.strictEqual(doc[0].type, 'title');
  assert.strictEqual(doc[0].runs[0].text, 'Kortti 1');
  const metas = doc.filter(b => b.type === 'meta');
  assert.ok(metas.length >= 1, 'the header has meta rows');
  for (const meta of metas) {
    assert.ok(meta.pairs.length <= 3,
      `three pairs to a row, like the A-F the worksheet merges - found ${meta.pairs.length}`);
  }
});

test('text arrives as PARSED markdown, not as a string to parse later', () => {
  // If a renderer were handed the source it would have to parse it, and there
  // would be two parsers again.
  const text = buildCardDocument(CARD, DATA, [], k => k).find(b => b.type === 'text');
  assert.ok(Array.isArray(text.blocks), 'the description is blocks');
  assert.deepStrictEqual(text.blocks.map(b => b.type), ['paragraph', 'bullet', 'bullet']);
  const bold = text.blocks[0].runs.find(r => r.bold);
  assert.ok(bold && bold.text === 'bold', 'and its emphasis survived');
});

test('the export\'s own marks are separate from the author\'s text', () => {
  // A checklist item's `[x]` and a comment's author name belong to the export,
  // not to the card - so a renderer can style them differently and the markdown
  // that follows is not pasted into a string with them.
  const doc = buildCardDocument(CARD, DATA, [], k => k);
  const list = doc.find(b => b.type === 'list'
    && b.items.some(item => item.marker === '[x]' || item.marker === '[ ]'));
  assert.strictEqual(list.items[0].marker, '[x]');
  assert.strictEqual(list.items[0].done, true);
  assert.ok(!list.items[0].runs.some(r => r.text.includes('[x]')),
    'the mark is not inside the text');

  const rows = doc.find(b => b.type === 'rows');
  const [, comment] = rows.rows[0];
  assert.ok(comment[0].bold && comment[0].text === 'xet7: ', 'the author leads, in bold');
  assert.ok(comment.some(r => r.italic), 'and the comment kept its markdown');
});

test('the popup\'s selection decides the sections, once for both formats', () => {
  // `?fields=` is what the export popup's checkboxes send. Applying it HERE is
  // what makes unticking "Comments" mean the same thing in a PDF and in a
  // spreadsheet - two `if`s in two exporters is how they would come to differ.
  const doc = buildCardDocument(CARD, DATA, ['description', 'attachments'], k => k);
  assert.deepStrictEqual(documentSections(doc), ['description', 'attachments']);
  assert.ok(wanted([], 'anything'), 'and no selection at all means the whole card');
});

test('images are a block of their own, and only real ones', () => {
  const doc = buildCardDocument(CARD, DATA, [], k => k);
  const images = doc.find(b => b.type === 'images');
  assert.ok(images && images.images.length === 1, 'the picture that has bytes');
  const none = buildCardDocument(CARD, { ...DATA, images: [{ name: 'x.png' }] }, [], k => k);
  assert.ok(!none.find(b => b.type === 'images'),
    'an image the exporter could not read is not an empty picture in the file');
});

test('it is PURE: no Meteor, no ExcelJS, no database (negative)', () => {
  // What lets both exporters be checked against the same document, and lets
  // this suite run under bare node in the fifteen seconds the others take.
  const src = fs.readFileSync(path.join(__dirname, '..', 'models/lib/cardDocument.js'), 'utf8');
  const code = src.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  for (const forbidden of ['meteor/', 'exceljs', 'ReactiveCache', 'Mongo']) {
    assert.ok(!code.includes(forbidden), `cardDocument.js must not use ${forbidden}`);
  }
  // And it names no medium: a colour or a column letter here would be one
  // renderer's decision leaking into the other's.
  assert.ok(!/argb|mergeCells|fillGray|PAGE_WIDTH/.test(code),
    'the document describes a layout, not a worksheet or a page');
});

test('a card with nothing in it still makes a document', () => {
  assert.doesNotThrow(() => buildCardDocument({}, {}, [], k => k));
  assert.doesNotThrow(() => buildCardDocument(null, null, null, null));
  const doc = buildCardDocument({}, {}, [], k => k);
  assert.strictEqual(doc[0].type, 'title', 'even an untitled card has a title block');
});

console.log(`\ncardDocument: ${passed} tests passed`);
