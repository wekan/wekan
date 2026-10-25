'use strict';

// #1178: drawing onto a card, saved as both PNG and SVG and editable later.
// Run: node tests/cardDrawing.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const d = require('../models/lib/cardDrawing.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Positive.
const strokes = [{ color: '#e53935', width: 4, points: [[10, 20], [30.06, 40]] }, { color: '#000000', width: 2, points: [[5, 5]] }];
assert.deepEqual(d.cleanStrokes(strokes), [{ color: '#e53935', width: 4, points: [[10, 20], [30.1, 40]] }, { color: '#000000', width: 2, points: [[5, 5]] }]);
const svg = d.strokesToSvg(strokes);
assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="800" height="500" viewBox="0 0 800 500">/);
assert.match(svg, /<path d="M10 20L30\.1 40" stroke="#e53935" stroke-width="4"/);
assert.match(svg, /<path d="M5 5l0\.1 0"/, 'a dot is drawn');
const saved = d.drawingsAfterSave([{ _id: 'a', strokes: [] }], { _id: 'a', strokes });
assert.equal(saved.length, 1, 'editing replaces the drawing, keeping its place');
assert.equal(saved[0].strokes, strokes);
console.log('  ok - strokes become SVG paths; an edit replaces its drawing');

// Negative: nothing but numbers and allowed colours reaches the SVG.
const evil = d.strokesToSvg([
  { color: '"><script>alert(1)</script>', width: 4, points: [[1, 1]] },
  { color: '#000000', width: 999, points: [[1, 1]] },
  { color: '#000000', width: 2, points: [['1"/><script>', 2], [1e9, -5]] },
]);
assert.doesNotMatch(evil, /script|alert|999/);
assert.match(evil, /M800 0l0\.1 0/, 'a point with text in it is dropped; the rest clamped into the drawing');
assert.equal(d.cleanStrokes('junk').length, 0);
assert.equal(d.drawingsAfterSave(Array.from({ length: 30 }, (_, i) => ({ _id: `d${i}` })), { _id: 'n' }).length, d.MAX_DRAWINGS);
console.log('  ok - no markup, no foreign colours or widths, points clamped, bounded');

// Wiring.
assert.match(read('models/cards.js'), /drawings: \{[\s\S]{0,300}type: Array,\s*optional: true,\s*\},\s*'drawings\.\$': \{\s*type: Object,\s*blackbox: true,/);
const js = read('client/components/cards/cardDrawing.js');
// #6802: cleaned against the drawing's own size, which a new drawing takes
// from the room on the screen and the corner handle changes.
assert.match(js, /const size = bounds\(tpl\);\n\s+const strokes = d\.cleanStrokes\(tpl\.strokes\.get\(\), size\);/);
assert.match(js, /Attachments\.insertAsync\(buildAttachmentUploadConfig\(\{ file, meta: Utils\.getCommonAttachmentMetaFrom\(target\) \}\), false\)/, 'the PNG through the normal attachment upload');
// A new drawing is also the card's cover image; an edit leaves the cover.
assert.match(js, /\$set: \{ drawings: d\.drawingsAfterSave\(target\.drawings, drawing\), \.\.\.coverOf\(svgAttachmentId\) \}/);
assert.match(js, /\$set: \{ drawings: d\.drawingsAfterSave\(target\.drawings, drawing\), \.\.\.\(isNew \? coverOf\(pngAttachmentId\) : \{\}\) \}/);
assert.match(js, /const isNew = !tpl\.editingId\.get\(\);/);
assert.match(read('client/components/cards/cardDetails.jade'), /a\.js-card-drawing/);
assert.match(read('client/components/cards/cardDetails.jade'), /template\(name="cardDrawingPopup"\)/);
console.log('  ok - stored on the card, PNG uploaded as an attachment, opened from the card menu');
console.log('\ncardDrawing: all tests passed');
