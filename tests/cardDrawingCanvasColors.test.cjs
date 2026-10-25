'use strict';

// #6802: the Drawing popup's drawing area takes the room there is, grows from
// its bottom-right corner and zooms with the magnifier; any color can be drawn
// with - from the color wheel, an HTML color code, the custom colors added to
// the palette, or the eyedropper - and Save sits above the drawing.
// Run: node tests/cardDrawingCanvasColors.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const d = require('../models/lib/cardDrawing.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardDrawingCanvasColors:');

test('any #rrggbb color is a color; nothing else is', () => {
  assert.strictEqual(d.cleanColor('#12AB9f'), '#12ab9f');
  for (const bad of ['red', '#fff', '#12345g', '"><script>', 'url(x)', '#1234567', null, 5, { $ne: 1 }]) {
    assert.strictEqual(d.cleanColor(bad), null, String(bad));
  }
  const [kept] = d.cleanStrokes([{ color: '#3366CC', width: 4, points: [[1, 1]] }]);
  assert.strictEqual(kept.color, '#3366cc', 'a custom color is kept with the drawing');
  assert.strictEqual(d.cleanStrokes([{ color: 'rgb(1,2,3)', width: 4, points: [[1, 1]] }]).length, 0, 'negative');
  assert.match(d.strokesToSvg([{ color: '#3366cc', width: 4, points: [[1, 1]] }]), /stroke="#3366cc"/);
  // The whiteboard takes the same colors, and only them.
  assert.strictEqual(d.whiteboardStroke({ _id: 'a1', color: '#3366cc', width: 4, points: [[1, 1]] }, 'u1').color, '#3366cc');
  assert.strictEqual(d.whiteboardStroke({ _id: 'a1', color: 'javascript:x', width: 4, points: [[1, 1]] }, 'u1'), null);
});

test('HSV and the color wheel go both ways', () => {
  assert.strictEqual(d.hsvToHex(0, 1, 1), '#ff0000');
  assert.strictEqual(d.hsvToHex(120, 1, 1), '#00ff00');
  assert.strictEqual(d.hsvToHex(240, 1, 0.5), '#000080');
  assert.strictEqual(d.hsvToHex(0, 0, 1), '#ffffff');
  for (const hex of ['#e53935', '#1e88e5', '#43a047', '#8e24aa', '#000000', '#ffffff', '#123456']) {
    const { h, s, v } = d.hexToHsv(hex);
    assert.strictEqual(d.hsvToHex(h, s, v), hex, hex);
    const p = d.wheelPoint(hex, 80);
    if (s > 0) assert.strictEqual(d.wheelColor(p.x, p.y, 80, v), hex, `${hex} on the wheel`);
  }
  assert.strictEqual(d.wheelColor(80, 80, 80, 1), '#ffffff', 'the centre is white');
  assert.strictEqual(d.wheelColor(160, 80, 80, 1), '#ff0000', 'the rim at 0 degrees is red');
  assert.strictEqual(d.wheelColor(500, 80, 80, 1), '#ff0000', 'past the rim is the rim');
  assert.strictEqual(d.hexToHsv('nope'), null);
});

test('custom colors: added once, newest last, bounded; the palette is not repeated', () => {
  let list = d.addCustomColor([], '#123456');
  list = d.addCustomColor(list, '#ABCDEF');
  list = d.addCustomColor(list, '#123456');
  assert.deepStrictEqual(list, ['#abcdef', '#123456']);
  assert.deepStrictEqual(d.addCustomColor(list, d.COLORS[0]), list, 'a palette color is not added');
  assert.deepStrictEqual(d.addCustomColor(list, 'bad'), list);
  assert.deepStrictEqual(d.addCustomColor(['"><b>', '#000001'], null), ['#000001'], 'stored junk is dropped');
  let many = [];
  for (let i = 0; i < 40; i += 1) many = d.addCustomColor(many, `#0000${i.toString(16).padStart(2, '0')}`);
  assert.strictEqual(many.length, d.MAX_CUSTOM_COLORS);
  assert.deepStrictEqual(d.removeCustomColor(list, '#ABCDEF'), ['#123456']);
});

test('the eyedropper on the drawing takes the top line, or the white paper', () => {
  const strokes = [
    { color: '#111111', width: 4, points: [[0, 50], [100, 50]] },
    { color: '#222222', width: 4, points: [[50, 0], [50, 100]] },
  ];
  assert.strictEqual(d.colorAt(strokes, [50, 50]), '#222222', 'the one drawn last is on top');
  assert.strictEqual(d.colorAt(strokes, [10, 50]), '#111111');
  assert.strictEqual(d.colorAt(strokes, [90, 90]), '#ffffff');
});

test('the drawing size: the room there is, bounded; never smaller than its lines', () => {
  assert.deepStrictEqual(d.drawingSize(1777.6, 902.2), { width: 1778, height: 902 });
  assert.deepStrictEqual(d.drawingSize(10, 99999), { width: d.MIN_DRAWING, height: d.MAX_DRAWING });
  assert.deepStrictEqual(d.drawingSize(undefined, undefined), { width: 800, height: 500 }, 'older drawings are 800 x 500');
  assert.deepStrictEqual(d.minimumDrawingSize([{ width: 8, points: [[300, 20], [10, 250]] }]), { width: 304, height: 254 });
  assert.deepStrictEqual(d.minimumDrawingSize([]), { width: d.MIN_DRAWING, height: d.MIN_DRAWING });
  const [s] = d.cleanStrokes([{ color: '#000000', width: 4, points: [[1500, 900]] }], { width: 1600, height: 1000 });
  assert.deepStrictEqual(s.points, [[1500, 900]], 'a larger drawing keeps lines past 800 x 500');
});

test('zoom steps, bounded', () => {
  assert.strictEqual(d.nextZoom(1, 1), 1.25);
  assert.strictEqual(d.nextZoom(1.25, -1), 1);
  assert.strictEqual(d.nextZoom(d.ZOOM_MAX, 1), d.ZOOM_MAX);
  assert.strictEqual(d.nextZoom(d.ZOOM_MIN, -1), d.ZOOM_MIN);
});

test('the popup: Save above the drawing, the stage, the corner handle, the colors', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  const tpl = jade.slice(jade.indexOf('template(name="cardDrawingPopup")'));
  const tools = tpl.indexOf('.card-drawing-tools');
  const save = tpl.indexOf('js-drawing-save');
  const stage = tpl.indexOf('.card-drawing-stage');
  assert.ok(tools < save && save < stage, 'Save is in the tools, above the drawing');
  assert.match(tpl, /\.card-drawing-actions\n(\s+if message\n\s+span\.quiet= message\n)?\s+unless newFile\n\s+a\.js-drawing-download-svg[^\n]*\n\s+button\.primary\.js-drawing-save/);
  assert.match(tpl, /viewBox="0 0 \{\{drawingWidth\}\} \{\{drawingHeight\}\}" width=canvasWidth height=canvasHeight preserveAspectRatio="none"/);
  assert.match(tpl, /span\.card-drawing-canvas-resize\.js-drawing-canvas-resize/);
  for (const cls of ['js-drawing-zoom-in', 'js-drawing-zoom-out', 'js-drawing-eyedropper', 'js-drawing-wheel', 'js-drawing-hex', 'js-drawing-brightness', 'js-drawing-add-color', 'js-drawing-custom-color']) {
    assert.ok(tpl.includes(cls), cls);
  }
  assert.match(read('client/components/cards/cardDrawing.css'), /\.card-drawing-actions \{[^}]*margin-inline-start: auto/);
  const js = read('client/components/cards/cardDrawing.js');
  assert.match(js, /typeof window\.EyeDropper === 'function'/, 'the browser picks from the screen where it can');
  assert.match(js, /useColor\(tpl, d\.colorAt\(tpl\.strokes\.get\(\), point\)\)/, 'and from the drawing where it cannot');
  assert.match(js, /d\.minimumDrawingSize\(tpl\.strokes\.get\(\)\)/, 'the corner never cuts a line off');
  assert.match(js, /const drawing = \{ _id: id, strokes, width: size\.width, height: size\.height/, 'the size is saved with the drawing');
  assert.doesNotMatch(js, /, \{ width: W, height: H \}\)/, 'negative: no operation is fixed at 800 x 500 any more');
});

test('custom colors: with the account when signed in, in the browser otherwise', () => {
  const js = read('client/components/cards/cardDrawing.js');
  assert.match(js, /const user = ReactiveCache\.getCurrentUser\(\);\n\s+if \(user\) return d\.addCustomColor\(\(user\.profile && user\.profile\.drawingColors\) \|\| \[\], null\);\n\s+return tpl\.customColors\.get\(\);/);
  assert.match(js, /if \(Meteor\.userId\(\)\) \{\n\s+Meteor\.callAsync\('setDrawingColors', list\)/);
  assert.match(js, /window\.localStorage\.setItem\(CUSTOM_COLORS_KEY, JSON\.stringify\(list\)\)/, 'not signed in: this browser');
  // Negative: the browser copy is written only on the not-signed-in path.
  const save = js.slice(js.indexOf('function saveCustomColors'), js.indexOf('const WHEEL'));
  assert.ok(save.indexOf('return;') < save.indexOf('localStorage.setItem'), 'a signed-in save returns before the browser copy');

  const schema = read('models/users.js');
  assert.match(schema, /'profile\.drawingColors': \{[\s\S]{0,300}type: Array,\s*optional: true,\s*\},\s*'profile\.drawingColors\.\$': \{\s*type: String,\s*regEx: \/\^#\[0-9a-f\]\{6\}\$\/,/);
  const method = read('server/models/users.js');
  const body = method.slice(method.indexOf('async setDrawingColors('), method.indexOf('async setCardCollapsed('));
  assert.match(body, /check\(colors, \[String\]\);/);
  assert.match(body, /if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'\);/, 'negative: no account, nothing stored on the server');
  assert.match(body, /reduce\(\(list, c\) => addCustomColor\(list, c\), \[\]\)/, 'only #rrggbb, each once, bounded');
  assert.match(body, /\$set: \{ 'profile\.drawingColors': clean \}/);
  // What the method stores, for what a client might send.
  const clean = ['#ABCDEF', 'javascript:x', '#abcdef', '#123456', '"><b>'].reduce((list, c) => d.addCustomColor(list, c), []);
  assert.deepStrictEqual(clean, ['#abcdef', '#123456']);
});

test('Add Card: Search / Template / Drawing / More options', () => {
  const composer = read('client/components/lists/listBody.jade');
  const row = composer.slice(composer.indexOf('a.js-search'), composer.indexOf('a.js-toggle-more-options'));
  assert.ok(row.indexOf('a.js-card-template') < row.indexOf('a.add-card-drawing.js-add-card-drawing'));
  // Negative: not beside the Add button any more.
  const controls = composer.slice(composer.indexOf('.add-controls.clearfix'), composer.indexOf('a.js-close-inlined-form'));
  assert.doesNotMatch(controls, /js-add-card-drawing/);
});

test('negative: every locale has the color and canvas strings, in its own language', () => {
  const keys = ['card-drawing-eyedropper', 'card-drawing-custom-color', 'card-drawing-add-color', 'card-drawing-remove-color',
    'card-drawing-color-code', 'card-drawing-brightness', 'card-drawing-resize-canvas'];
  const dir = path.join(__dirname, '..', 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const f of fs.readdirSync(dir)) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const order = Object.keys(j);
    let prev = order.indexOf('card-drawing-resize');
    for (const k of keys) {
      assert.ok(j[k], `${f}: ${k}`);
      assert.strictEqual(order.indexOf(k), prev + 1, `${f}: ${k} in key order`);
      prev = order.indexOf(k);
    }
    if (!f.startsWith('en')) {
      const english = keys.filter(k => j[k] === en[k]);
      assert.ok(english.length <= 1, `${f} is English: ${english.join(', ')}`);
    }
  }
});

console.log(`cardDrawingCanvasColors: ${passed} passed`);
