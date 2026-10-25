'use strict';

// #6802: writing with a pen. The eraser takes away the lines it touches, a
// palm resting on the screen draws nothing once a pen has, and a new drawing -
// from Add Card's Drawing button or Add attachment / Drawing - opens on the
// whole window and is saved as an SVG attachment of the card.
// Run: node tests/cardDrawingPen.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const d = require('../models/lib/cardDrawing.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardDrawingPen:');

const line = (points, width = 3) => ({ color: '#000', width, points });

test('the eraser takes away the lines it touches, and only those', () => {
  const across = line([[0, 100], [400, 100]]);
  const far = line([[0, 300], [400, 300]]);
  const dot = line([[600, 50]]);
  assert.deepStrictEqual(d.eraseAt([across, far, dot], [200, 105], 10), [far, dot], 'near the middle of a segment');
  assert.deepStrictEqual(d.eraseAt([across, far, dot], [603, 52], 10), [across, far], 'a single point');
  // The line's own width counts: a thick line is reached from further away.
  assert.deepStrictEqual(d.eraseAt([line([[0, 0], [100, 0]], 30)], [50, 20], 6), [], 'within half of a 30 wide line plus 6');
  assert.strictEqual(d.eraseAt([line([[0, 0], [100, 0]], 2)], [50, 20], 6).length, 1, 'negative: a thin one is not');
  // Negative: past the end of a segment is measured to the end, not the line.
  assert.strictEqual(d.eraseAt([line([[0, 0], [100, 0]])], [130, 0], 10).length, 1);
  assert.deepStrictEqual(d.eraseAt(undefined, [0, 0]), []);
});

test('palm rejection: once a pen has drawn, a touch does not', () => {
  assert.ok(d.pointerDraws({ pointerType: 'touch', pointerId: 1 }, { penSeen: false, activePointerId: null }), 'a finger draws before any pen');
  assert.ok(d.pointerDraws({ pointerType: 'pen', pointerId: 2 }, { penSeen: true, activePointerId: null }));
  assert.ok(!d.pointerDraws({ pointerType: 'touch', pointerId: 3 }, { penSeen: true, activePointerId: null }), 'a palm after the pen');
  assert.ok(d.pointerDraws({ pointerType: 'mouse', pointerId: 1 }, { penSeen: true, activePointerId: null }), 'a mouse always draws');
  // Negative: while one pointer draws, no other one starts a second line.
  assert.ok(!d.pointerDraws({ pointerType: 'pen', pointerId: 9 }, { penSeen: true, activePointerId: 2 }));
  assert.ok(d.pointerDraws({ pointerType: 'pen', pointerId: 2 }, { penSeen: true, activePointerId: 2 }));
});

test('the popup follows the pen: palm rejection, one pointer, the eraser', () => {
  const js = read('client/components/cards/cardDrawing.js');
  assert.match(js, /if \(e\.pointerType === 'pen'\) tpl\.pointer\.penSeen = true;\n\s+if \(!d\.pointerDraws\(e, tpl\.pointer\)\) return;/);
  assert.match(js, /'pointermove \.js-drawing-surface'[\s\S]{0,120}e\.pointerId !== tpl\.pointer\.activePointerId\) return;/);
  assert.match(js, /d\.eraseAt\(tpl\.strokes\.get\(\), pointFrom\(tpl, event\)\)/);
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /a\.card-drawing-eraser\.js-drawing-eraser[^\n]*card-drawing-eraser/);
  assert.match(jade, /a\.js-drawing-clear[^\n]*\n\s+i\.fa\.fa-trash-o/, 'Clear no longer wears the eraser icon');
});

test('a new drawing opens maximized, without the earlier ones, and is saved as SVG', () => {
  const js = read('client/components/cards/cardDrawing.js');
  assert.match(read('client/lib/newDrawing.js'), /export function openNewDrawing\(cardId, opener\)[\s\S]*dataContext: \{ _id: cardId, drawingNewFile: true \}/);
  assert.match(js, /if \(tpl\.data && tpl\.data\.drawingNewFile\) \{[\s\S]*drawingSvgFile\(target, strokes, size\)[\s\S]*svgAttachmentId[\s\S]*Popup\.close\(\);/);
  assert.match(js, /type: 'image\/svg\+xml'/);
  assert.match(read('client/components/main/popup.js'), /dataContext\.drawingNewFile[\s\S]{0,200}newDrawing \|\| rememberedMaximized\(name\)/);
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /if showDrawingList/);
  assert.match(jade, /unless newFile\n\s+a\.js-drawing-download-svg/);
});

test('Add attachment and Add Card (one card) start a new drawing', () => {
  const att = read('client/components/cards/attachments.jade');
  assert.match(att, /a\.js-attach-drawing\n\s+i\.fa\.fa-pencil\n\s+\|  \{\{_ 'cardDrawingPopup-title'\}\}/);
  assert.match(read('client/components/cards/attachments.js'), /'click \.js-attach-drawing'[\s\S]{0,500}Popup\.close\(\);\n\s+setTimeout\(\(\) => openNewDrawing\(cardId\), 0\);/);
  const composer = read('client/components/lists/listBody.jade');
  // In the row Search / Template / Drawing / More options, after Template.
  assert.match(composer, /a\.js-card-template[^\n]*\n[\s\S]{0,400}if singleCardTitle\n\s+span\.quiet\n\s+\| &nbsp;\n\s+\| \/\n\s+a\.add-card-drawing\.js-add-card-drawing[^\n]*\n\s+span\.quiet\n\s+\| &nbsp;\n\s+\| \/\n\s+a\.js-toggle-more-options/);
  const body = read('client/components/lists/listBody.js');
  assert.match(body, /singleCardTitle\(\) \{\n\s+return Template\.instance\(\)\.titleCount\.get\(\) === 1;/);
  assert.match(body, /const drawAfterAdd = submittedForm\.dataset\.drawAfterAdd === 'true' && titles\.length === 1;/);
  assert.match(body, /if \(drawAfterAdd\) \{\n\s+Utils\.goCardId\(_id\);\n\s+openNewDrawingWhenOpen\(_id\);/);
  // Negative: more than one card, no Drawing.
  assert.match(body, /if \(!form \|\| tpl\.titleCount\.get\(\) !== 1\) return;/);
});

test('negative: nothing imports the Drawing popup module early', () => {
  // cardDrawing.js touches Template.cardDrawingPopup when it is loaded; imported
  // from attachments.js it ran before cardDetails.jade defined the template and
  // the client did not start. The openers live in client/lib/newDrawing.js.
  assert.doesNotMatch(read('client/lib/newDrawing.js').replace(/\/\/.*$/gm, ''), /Template\./, 'no template is touched');
  for (const f of ['client/components/cards/attachments.js', 'client/components/lists/listBody.js']) {
    assert.doesNotMatch(read(f), /from '\/client\/components\/cards\/cardDrawing'/, f);
    assert.match(read(f), /from '\/client\/lib\/newDrawing'/, f);
  }
});

test('negative: every locale has Eraser, in its own language', () => {
  const dir = path.join(__dirname, '..', 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const f of fs.readdirSync(dir)) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.ok(j['card-drawing-eraser'], f);
    if (!f.startsWith('en')) assert.notStrictEqual(j['card-drawing-eraser'], en['card-drawing-eraser'], `${f} is English`);
    const keys = Object.keys(j);
    assert.strictEqual(keys.indexOf('card-drawing-eraser'), keys.indexOf('card-drawing-clear') + 1, `${f}: key order`);
  }
});

console.log(`cardDrawingPen: ${passed} passed`);
