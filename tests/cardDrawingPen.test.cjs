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

test('a new drawing is refitted when its room changes, until it is zoomed or resized by hand (2929b61c85)', () => {
  // Opened from + Add or Add attachment, the popup was fitted at 820px and
  // maximized only afterwards, so a new drawing kept ~784px of a 1280px window.
  const js = read('client/components/cards/cardDrawing.js');
  const start = js.indexOf("const stage = this.find('.js-drawing-stage');");
  const end = js.indexOf('this.stageObserver.observe(stage);\n  }', start);
  assert.ok(start > 0 && end > start, 'the observer block of onRendered');
  const block = js.slice(start, end + 'this.stageObserver.observe(stage);\n  }'.length);
  // Run the block itself with a stand-in ResizeObserver, room and fit.
  const vm = require('vm');
  let callback = null; let observed = null; const fits = [];
  let room = { width: 784, height: 400 };
  const tpl = {
    view: { isDestroyed: false }, sizedByHand: false,
    strokes: { value: [], get() { return this.value; } },
    editingId: { value: null, get() { return this.value; } },
    find: sel => (sel === '.js-drawing-stage' ? { stage: true } : null),
  };
  vm.runInNewContext(`(function () { const tpl = this; ${block} }).call(tpl);`, {
    tpl,
    ResizeObserver: class { constructor(cb) { callback = cb; } observe(el) { observed = el; } disconnect() {} },
    stageRoom: () => room,
    fitToStage: (t, size) => fits.push([t, size, `${room.width}x${room.height}`]),
  });
  assert.ok(callback && observed && observed.stage, 'the drawing stage is observed');
  assert.ok(tpl.stageObserver, 'kept on the template, to disconnect');
  callback();
  assert.deepStrictEqual(fits.map(f => f[2]), ['784x400'], 'fitted to the room it has');
  assert.strictEqual(fits[0][1], null, 'as a NEW drawing (no size of its own)');
  callback();
  assert.strictEqual(fits.length, 1, 'the same room is not fitted twice');
  room = { width: 1240, height: 700 };
  callback();
  assert.deepStrictEqual(fits.map(f => f[2]), ['784x400', '1240x700'], 'maximized: refitted to the window');
  // Negative: once there is a line, an edited drawing, a zoom or a resize by
  // hand, a change of room keeps the size it has.
  for (const [what, set, reset] of [
    ['a line', () => { tpl.strokes.value = [{}]; }, () => { tpl.strokes.value = []; }],
    ['an edited drawing', () => { tpl.editingId.value = 'd1'; }, () => { tpl.editingId.value = null; }],
    ['sized by hand', () => { tpl.sizedByHand = true; }, () => { tpl.sizedByHand = false; }],
    ['destroyed', () => { tpl.view.isDestroyed = true; }, () => { tpl.view.isDestroyed = false; }],
  ]) {
    set();
    room = { width: room.width - 10, height: room.height };
    callback();
    assert.strictEqual(fits.length, 2, `not refitted: ${what}`);
    reset();
  }
  // Each way of choosing a size by hand marks it: zoom in, zoom out, the
  // corner handle and its keyboard steps.
  const events = js.slice(js.indexOf('Template.cardDrawingPopup.events({'));
  assert.match(events, /'click \.js-drawing-zoom-in'\(event, tpl\) \{ event\.preventDefault\(\); tpl\.sizedByHand = true;/);
  assert.match(events, /'click \.js-drawing-zoom-out'\(event, tpl\) \{ event\.preventDefault\(\); tpl\.sizedByHand = true;/);
  const resize = events.slice(events.indexOf("'pointerdown .js-drawing-canvas-resize'"), events.indexOf("'pointermove .js-drawing-canvas-resize'"));
  assert.match(resize, /tpl\.sizedByHand = true;\n\s+tpl\.canvasResize = /);
  assert.match(events, /if \(!step\) return;\n\s+event\.preventDefault\(\);\n\s+tpl\.sizedByHand = true;/);
  assert.strictEqual((js.match(/tpl\.sizedByHand = true;/g) || []).length, 4, 'and nothing else does');
  assert.match(js, /Template\.cardDrawingPopup\.onDestroyed\(function \(\) \{\n\s+if \(this\.stageObserver\) this\.stageObserver\.disconnect\(\);/);
});

console.log(`cardDrawingPen: ${passed} passed`);
