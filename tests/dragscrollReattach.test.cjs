'use strict';

// Regression guard: "only the top swimlane is usable / dragscroll is not enabled"
// after the board's swimlanes/lists render or change.
//
// @wekanteam/dragscroll attaches its MOUSE handlers PER element inside reset(),
// so reset() must be re-called after the set of `.dragscroll` containers changes.
// boardBody.js calls it in onRendered (once) and in one autorun. That autorun used
// to depend only on the touch/permission reads, so when swimlanes/lists rendered
// AFTER onRendered — adaptive lazy card loading (#6480), the on-open data-repair
// adding a default swimlane (#6484), or a board switch that reuses this template
// instance without re-firing onRendered — the new containers never got mouse
// handlers and drag-scrolling was dead (touch still worked via the document-
// delegated dragscrollTouch). The fix makes the autorun read the board view +
// swimlanes + lists so reset() re-runs when the rendered containers change.
//
// The re-scan itself goes through resetBoardDragscroll() (client/lib/boardDragscroll.js)
// since #6558, which is dragscroll.reset() plus "stay suspended while a card is being
// dragged"; either spelling satisfies this file, what it pins is the reactive reads.
//
// DOM/Blaze-coupled runtime code, so it is guarded at the source level.
// Run: node tests/dragscrollReattach.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const js = fs.readFileSync(
  path.join(repoRoot, 'client/components/boards/boardBody.js'),
  'utf8',
);

// Isolate the autorun that re-scans the dragscroll containers (the one set up in
// onRendered), so the assertions cannot be satisfied by unrelated code elsewhere in
// the file.
const RESET = /(?:dragscroll\.reset|resetBoardDragscroll)\(\);/g;
const resets = [...js.matchAll(RESET)];
assert.ok(resets.length > 0, 'expected a dragscroll re-scan call in boardBody.js');
const inAutorun = resets.find(m => js.lastIndexOf('this.autorun(', m.index) !== -1
  && js.slice(js.lastIndexOf('this.autorun(', m.index), m.index).includes('.swimlanes()'));
const resetIdx = (inAutorun || resets[0]).index;
const resetLen = (inAutorun || resets[0])[0].length;
const autorunStart = js.lastIndexOf('this.autorun(', resetIdx);
assert.ok(autorunStart !== -1, 'the re-scan must live inside a this.autorun()');
// The autorun body up to and including the re-scan call.
const body = js.slice(autorunStart, resetIdx + resetLen);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the dragscroll autorun establishes a dependency on the current board', () => {
  assert.ok(/Utils\.getCurrentBoard\(\)/.test(body),
    'the autorun must read Utils.getCurrentBoard() so it re-runs on board switch');
});

test('it reads the swimlanes and lists so reset() re-runs when they change', () => {
  assert.ok(/\.swimlanes\(\)/.test(body),
    'the autorun must read board.swimlanes() as a reactive dependency');
  assert.ok(/\.draggableLists\(\)|\.lists\(\)/.test(body),
    'the autorun must read the board lists as a reactive dependency');
  assert.ok(/Utils\.boardView\(\)/.test(body),
    'the autorun must read Utils.boardView() so a view switch re-attaches dragscroll');
});

test('the reactive reads come BEFORE dragscroll.reset()', () => {
  const swimIdx = body.indexOf('.swimlanes()');
  const resetInBody = body.search(/(?:dragscroll\.reset|resetBoardDragscroll)\(\)/);
  assert.ok(swimIdx !== -1 && swimIdx < resetInBody,
    'the swimlanes/lists reads must precede the re-scan in the autorun');
});

console.log(`\nAll ${passed} dragscroll re-attach tests passed`);
