'use strict';

// The whiteboard (docs/Features/Cards/Whiteboard.md): a line with its author,
// one atomic $push per line, Undo and Clear for one's own lines only, and the
// edit right and the Board Settings / Card row on the server.
//
// Run: node tests/whiteboard.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const d = require('../models/lib/cardDrawing.js');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('whiteboard:');

test('a line keeps its id and gets its author; the rest is the drawing\'s own cleaning', () => {
  const line = d.whiteboardStroke({ _id: 'abc123', color: '#e53935', width: 4, points: [[10, 20], [900, -5]], userId: 'forged' }, 'alice');
  assert.deepStrictEqual(line, { _id: 'abc123', userId: 'alice', color: '#e53935', width: 4, points: [[10, 20], [800, 0]] },
    'the author is the caller, never what the line says (negative)');
});

test('what is not a line (negative)', () => {
  for (const bad of [null, {}, { _id: 'x', color: 'red', width: 4, points: [[1, 1]] }, { _id: 'x', color: '#000000', width: 3, points: [[1, 1]] },
    { _id: 'x', color: '#000000', width: 2, points: [] }, { _id: '../x', color: '#000000', width: 2, points: [[1, 1]] },
    { color: '#000000', width: 2, points: [[1, 1]] }]) {
    assert.strictEqual(d.whiteboardStroke(bad, 'alice'), null, JSON.stringify(bad));
  }
  assert.strictEqual(d.whiteboardStroke({ _id: 'x', color: '#000000', width: 2, points: [[1, 1]] }, undefined), null);
});

test('Undo finds the caller\'s own last line, never somebody else\'s', () => {
  const strokes = [{ _id: 'a', userId: 'alice' }, { _id: 'b', userId: 'bob' }, { _id: 'c', userId: 'alice' }, { _id: 'd', userId: 'bob' }];
  assert.strictEqual(d.lastStrokeOf(strokes, 'alice'), 'c');
  assert.strictEqual(d.lastStrokeOf(strokes, 'carol'), null);
  assert.strictEqual(d.lastStrokeOf(undefined, 'alice'), null);
});

test('the server: edit right, the row, one $push per line, and only one\'s own lines away', () => {
  const src = read('server/methods/whiteboard.js');
  assert.match(src, /boardForCardHelper\(userId, card\.boardId, 'whiteboard', 'allowsWhiteboardOnCard'\)/);
  assert.match(src, /!\(await canEditCardOrLinkedCard\(userId, card, board\)\)/);
  assert.match(src, /\$push: \{ 'drawings\.\$\.strokes': stroke \}/, 'a line is added, never the drawing rewritten');
  assert.match(src, /'drawings\.strokes\._id': \{ \$ne: stroke\._id \}/, 'the same line twice is kept once');
  assert.match(src, /\$pull: \{ 'drawings\.\$\.strokes': \{ _id: last, userId: this\.userId \} \}/);
  assert.match(src, /\$pull: \{ 'drawings\.\$\.strokes': \{ userId: this\.userId \} \}/);
  assert.match(src, /'drawings\.\$\.pngAttachmentId': attachmentId/, 'Save picture writes only the picture');
  assert.match(src, /findOneAsync\(\{ _id: attachmentId, 'meta\.cardId': cardId \}/, 'the picture must be this card\'s');
  assert.ok(!/\$set: \{ drawings:/.test(src), 'the whiteboard never rewrites the whole drawings array (negative)');
  assert.ok(!/\$set: \{ drawings:/.test(read('client/components/cards/whiteboard.js')), 'nor does its client (negative)');
  assert.match(read('server/imports.js'), /import '\/server\/methods\/whiteboard';/);
});

test('opened from the drawing, under the header bar, hidden by its Board Settings / Card row', () => {
  const jade = read('client/components/cards/cardDetails.jade');
  assert.match(jade, /unless \$eq currentBoard\.allowsWhiteboardOnCard false\n\s+a\.card-drawing-whiteboard\.js-open-whiteboard\(data-id=_id/);
  assert.match(read('client/components/main/layouts.jade'), /\+cardWhiteboard/);
  const js = read('client/components/cards/whiteboard.js');
  assert.match(js, /document\.querySelectorAll\('#header-quick-access, #header-main-bar'\)/, 'under the header bar, one bar or two');
  assert.match(read('client/components/cards/whiteboard.css'), /z-index: 2050;/, 'above the opened card');
  assert.match(js, /boardFlagOn\('allowsWhiteboardOnCard', card\.boardId\)/);
  assert.match(read('client/components/cards/whiteboard.jade'), /each colors[\s\S]*each widths/, 'the drawing\'s own tools');
  const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows.js');
  assert.ok(CARD_SETTINGS_ROWS.find(r => r.key === 'whiteboard').card.field === 'allowsWhiteboardOnCard');
});

console.log(`\nwhiteboard: ${passed} tests passed`);
