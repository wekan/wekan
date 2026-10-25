'use strict';

// #6802: the lasso in the Drawing popup. A loop drawn around lines selects
// them; the selection moves together, resizes from its corner handle, groups
// and ungroups, and goes to the front or back or one layer up or down.
// Run: node tests/cardDrawingLasso.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const d = require('../models/lib/cardDrawing.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardDrawingLasso:');

const line = (points, extra = {}) => ({ color: '#000000', width: 4, points, ...extra });
const square = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const firstX = strokes => strokes.map(s => s.points[0][0]);

test('the loop selects the lines wholly inside it, and only those', () => {
  const a = line([[10, 10], [20, 20]]);
  const b = line([[100, 100], [120, 110]]);
  const across = line([[40, 40], [300, 40]]); // half inside
  const strokes = [a, b, across];
  assert.deepStrictEqual(d.lassoSelect(strokes, square(0, 0, 200, 200)), [0, 1]);
  assert.deepStrictEqual(d.lassoSelect(strokes, square(90, 90, 130, 130)), [1]);
  // A concave loop: an L-shape that leaves its notch out.
  const ell = [[0, 0], [60, 0], [60, 30], [30, 30], [30, 60], [0, 60]];
  assert.deepStrictEqual(d.lassoSelect([line([[10, 10]]), line([[45, 45]])], ell), [0], 'the notch is outside');
  // Negative: too short a loop, or none, selects nothing.
  assert.deepStrictEqual(d.lassoSelect(strokes, [[0, 0], [500, 500]]), []);
  assert.deepStrictEqual(d.lassoSelect(strokes, null), []);
  assert.deepStrictEqual(d.lassoSelect(undefined, square(0, 0, 9, 9)), []);
});

test('a line in a group brings its whole group into the selection', () => {
  const strokes = [line([[10, 10]], { group: 'g1' }), line([[400, 400]], { group: 'g1' }), line([[15, 15]]), line([[450, 450]])];
  assert.deepStrictEqual(d.lassoSelect(strokes, square(0, 0, 50, 50)), [0, 1, 2]);
  assert.deepStrictEqual(d.withGroups(strokes, [1]), [0, 1]);
  assert.deepStrictEqual(d.withGroups(strokes, [3]), [3], 'negative: an ungrouped line brings nothing');
  assert.deepStrictEqual(d.withGroups(strokes, [-1, 99, 1.5]), [], 'negative: indexes outside the list are dropped');
});

test('group and ungroup; the group survives saving, a bad group id does not', () => {
  const strokes = [line([[1, 1]]), line([[2, 2]]), line([[3, 3]])];
  const grouped = d.groupStrokes(strokes, [0, 2], 'abc123');
  assert.deepStrictEqual(grouped.map(s => s.group), ['abc123', undefined, 'abc123']);
  assert.deepStrictEqual(d.cleanStrokes(grouped).map(s => s.group), ['abc123', undefined, 'abc123'], 'kept on the card');
  const ungrouped = d.ungroupStrokes(grouped, [0, 2]);
  assert.ok(ungrouped.every(s => !('group' in s)));
  // Negative: an id that is not a plain token is neither set nor kept.
  assert.strictEqual(d.groupStrokes(strokes, [0], '<script>'), strokes);
  assert.ok(!('group' in d.cleanStrokes([line([[1, 1]], { group: '"><script>' })])[0]));
  assert.ok(!('group' in d.cleanStrokes([line([[1, 1]], { group: { $ne: 1 } })])[0]));
  assert.doesNotMatch(d.strokesToSvg(grouped), /group|abc123/, 'nothing of the group reaches the SVG');
});

test('the selection moves together, and stops at the edge keeping its shape', () => {
  const strokes = [line([[10, 10], [30, 20]]), line([[50, 50]]), line([[700, 400]])];
  const moved = d.moveStrokes(strokes, [0, 1], 100, 5);
  assert.deepStrictEqual(moved[0].points, [[110, 15], [130, 25]]);
  assert.deepStrictEqual(moved[1].points, [[150, 55]]);
  assert.strictEqual(moved[2], strokes[2], 'what is not selected is untouched');
  const far = d.moveStrokes(strokes, [0, 1], -1000, 2000, { width: 800, height: 500 });
  assert.deepStrictEqual(far[0].points, [[0, 460], [20, 470]], 'stopped at the left and bottom edges');
  assert.deepStrictEqual(far[1].points, [[40, 500]]);
  assert.strictEqual(d.moveStrokes(strokes, [], 5, 5), strokes, 'negative: nothing selected, nothing moves');
});

test('resize scales from the top-left corner, line widths to the nearest allowed one, inside the drawing', () => {
  const strokes = [line([[100, 100], [200, 150]], { width: 4 }), line([[150, 125]], { width: 2 })];
  const big = d.scaleStrokes(strokes, [0, 1], 2);
  assert.deepStrictEqual(big[0].points, [[100, 100], [300, 200]]);
  assert.deepStrictEqual(big[1].points, [[200, 150]]);
  assert.strictEqual(big[0].width, 8);
  assert.strictEqual(big[1].width, 4);
  for (const s of big) assert.ok(d.WIDTHS.includes(s.width));
  const small = d.scaleStrokes(strokes, [0], 0.5);
  assert.deepStrictEqual(small[0].points, [[100, 100], [150, 125]]);
  assert.strictEqual(small[0].width, 2);
  // Limited by the drawing's edge, and by a smallest size.
  const huge = d.scaleStrokes(strokes, [0], 50, { width: 800, height: 500 });
  assert.ok(huge[0].points.every(([x, y]) => x <= 800 && y <= 500));
  assert.deepStrictEqual(huge[0].points[1], [800, 450], 'the right edge stops it: 7 times');
  const tiny = d.scaleStrokes(strokes, [0], 0.0001);
  const [[x0], [x1]] = tiny[0].points;
  assert.ok(x1 - x0 >= 3.9, 'not scaled away to nothing');
  // Negative: no factor, a negative one, or nothing selected.
  for (const f of [0, -2, NaN, 'x']) assert.strictEqual(d.scaleStrokes(strokes, [0], f), strokes, String(f));
  assert.strictEqual(d.scaleStrokes(strokes, [], 2), strokes);
});

test('layer order: to the front, to the back, one up, one down - the selection keeps its own order', () => {
  const s = [1, 2, 3, 4, 5].map(n => line([[n, n]]));
  const order = (sel, how) => {
    const r = d.reorderStrokes(s, sel, how);
    return [firstX(r.strokes).join(''), r.selection];
  };
  assert.deepStrictEqual(order([1], 'front'), ['13452', [4]]);
  assert.deepStrictEqual(order([0, 3], 'front'), ['23514', [3, 4]]);
  assert.deepStrictEqual(order([1, 2], 'back'), ['23145', [0, 1]]);
  assert.deepStrictEqual(order([1], 'forward'), ['13245', [2]]);
  assert.deepStrictEqual(order([1, 2], 'forward'), ['14235', [2, 3]], 'a run moves past the next line together');
  assert.deepStrictEqual(order([0, 3], 'forward'), ['21354', [1, 4]]);
  assert.deepStrictEqual(order([0, 3], 'backward'), ['12435', [0, 2]]);
  // Already at the top or the bottom: nothing changes.
  assert.deepStrictEqual(order([4], 'forward'), ['12345', [4]]);
  assert.deepStrictEqual(order([0], 'backward'), ['12345', [0]]);
  assert.deepStrictEqual(order([3, 4], 'front'), ['12345', [3, 4]]);
  // Negative: an unknown direction changes nothing.
  assert.deepStrictEqual(order([1], 'sideways'), ['12345', [1]]);
  assert.strictEqual(d.reorderStrokes(s, [2], 'front').strokes.length, 5, 'no line lost or doubled');
});

test('the selection box includes the line width', () => {
  assert.deepStrictEqual(d.selectionBounds([line([[10, 20], [30, 40]], { width: 8 })], [0]), { x: 6, y: 16, width: 28, height: 28 });
  assert.strictEqual(d.selectionBounds([line([[1, 1]])], []), null);
});

test('the popup: the lasso tool, the selection tools, Undo through every change', () => {
  const js = read('client/components/cards/cardDrawing.js');
  assert.match(js, /'click \.js-drawing-lasso'[^\n]*setTool\(tpl, tpl\.lasso\.get\(\) \? 'pen' : 'lasso'\)/);
  assert.match(js, /d\.lassoSelect\(tpl\.strokes\.get\(\), tpl\.loop\.get\(\) \|\| \[\]\)/);
  assert.match(js, /d\.moveStrokes\(base, tpl\.selection\.get\(\)/);
  assert.match(js, /d\.scaleStrokes\(base, tpl\.selection\.get\(\), factor/);
  assert.match(js, /d\.groupStrokes\(tpl\.strokes\.get\(\), sel, Random\.id\(\)\)/);
  assert.match(js, /d\.ungroupStrokes\(tpl\.strokes\.get\(\), tpl\.selection\.get\(\)\)/);
  assert.match(js, /d\.reorderStrokes\(tpl\.strokes\.get\(\), sel, event\.currentTarget\.dataset\.layer\)/);
  assert.match(js, /tpl\.history\.length \? tpl\.history\.pop\(\) : tpl\.strokes\.get\(\)\.slice\(0, -1\)/);
  // A move or a resize is one Undo step, not one per pointer move.
  assert.match(js, /if \(!tpl\.drag\.changed\) \{ remember\(tpl, base\); tpl\.drag\.changed = true; \}/);
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /a\.card-drawing-lasso\.js-drawing-lasso[^\n]*card-drawing-lasso/);
  for (const layer of ['front', 'forward', 'backward', 'back']) {
    assert.match(jade, new RegExp(`a\\.js-drawing-layer\\(data-layer="${layer}"`), layer);
  }
  assert.match(jade, /if selectionGrouped\n\s+a\.js-drawing-ungroup/);
  assert.match(jade, /rect\.card-drawing-resize-handle\.js-drawing-resize-handle/);
});

test('negative: every locale has the lasso strings, in its own language and in key order', () => {
  const keys = ['card-drawing-lasso', 'card-drawing-group', 'card-drawing-ungroup', 'card-drawing-bring-to-front',
    'card-drawing-bring-forward', 'card-drawing-send-backward', 'card-drawing-send-to-back', 'card-drawing-resize'];
  const dir = path.join(__dirname, '..', 'imports/i18n/data');
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const f of fs.readdirSync(dir)) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const order = Object.keys(j);
    let prev = order.indexOf('card-drawing-eraser');
    for (const k of keys) {
      assert.ok(j[k], `${f}: ${k}`);
      assert.strictEqual(order.indexOf(k), prev + 1, `${f}: ${k} in key order`);
      prev = order.indexOf(k);
    }
    if (!f.startsWith('en')) {
      const english = keys.filter(k => j[k] === en[k]);
      assert.ok(english.length <= 2, `${f} is English: ${english.join(', ')}`);
    }
    const values = keys.map(k => j[k]);
    assert.strictEqual(new Set(values).size, values.length, `${f}: two lasso strings are the same`);
  }
});

console.log(`cardDrawingLasso: ${passed} passed`);
