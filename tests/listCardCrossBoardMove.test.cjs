'use strict';

// Regression guard for #3298: "view several boards at once with drag-and-drop
// between them". The Bigboard view (#4223) already shows every board a user
// belongs to stacked on one page - list-level dragging was deliberately kept
// scoped to within one board (connectWithSelector() in swimlanes.js), but
// CARD dragging between two lists was never scoped that way: the cards
// sortable's `connectWith: '.js-minicards:not(.js-list-full)'` in list.js
// already connects across every board shown in Bigboard.
//
// The remaining bug was that the drop handler resolved the destination board
// from `Utils.getCurrentBoard()` - the board the PAGE happens to be routed to
// - instead of from the list the card was actually dropped into. On a normal
// single-board page those are the same board, so it went unnoticed; in
// Bigboard, dropping a card into a list belonging to a different board than
// the route's `currentBoard` silently moved the card to the WRONG board (or
// left it looking moved while writing the old board's id).
//
// The fix resolves the destination boardId from the dropped-into list's own
// `boardId` (`listData.boardId`, exactly as the analogous list-to-swimlane
// move in swimlanes.js already does with `list.boardId`) and passes that -
// not `currentBoard._id` - into every `card.move(...)` call the card
// sortable's `stop` handler makes.
//
// Run: node tests/listCardCrossBoardMove.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const listJsPath = path.join(__dirname, '..', 'client', 'components', 'lists', 'list.js');
const src = fs.readFileSync(listJsPath, 'utf8');

// Isolate the cards sortable's stop() handler body (bounded window covering it).
const stopAt = src.indexOf('stop(evt, ui) {');
assert.ok(stopAt > -1, 'the cards sortable stop() handler must exist');
const nextHandlerAt = src.indexOf('\n    sort(event, ui) {', stopAt);
assert.ok(nextHandlerAt > stopAt, 'the sort() handler that follows stop() must exist');
const stopBody = src.slice(stopAt, nextHandlerAt);

check('the cards sortable connects across every board (cross-board card drag is possible)', () => {
  assert.ok(
    /connectWith:\s*'\.js-minicards:not\(\.js-list-full\)'/.test(src),
    'the CARD sortable must stay unscoped by board, unlike the LIST sortable',
  );
});

check('#3298: the destination boardId is taken from the dropped-into list, not the routed board', () => {
  assert.ok(
    /const targetBoardId = listData\.boardId \|\| currentBoard\._id;/.test(stopBody),
    'targetBoardId must be resolved from listData.boardId (the list actually dropped into)',
  );
});

check('#3298: the resolved target board (not currentBoard) supplies the default swimlane', () => {
  assert.ok(
    /const defaultSwimlaneId = targetBoard\.getDefaultSwimline\(\)\._id;/.test(stopBody),
    'the default swimlane must come from the destination board, so a cross-board drop ' +
      'without an explicit target swimlane still lands on a swimlane that exists there',
  );
});

check('#3298: both card.move() calls in the stop handler use targetBoardId', () => {
  const moveCalls = stopBody.match(/card\.move\(\s*\n\s*targetBoardId,/g) || [];
  assert.strictEqual(
    moveCalls.length,
    2,
    'both the multi-selection loop and the single-card branch must move to targetBoardId',
  );
});

// --- NEGATIVE: the #3298 wrong-board bug must not come back -----------------
check('NEGATIVE: card.move() is never called with the route-only currentBoard._id', () => {
  const badCalls = stopBody.match(/card\.move\(\s*\n\s*currentBoard\._id,/g) || [];
  assert.strictEqual(
    badCalls.length,
    0,
    'card.move() must not be passed currentBoard._id directly - that is the ' +
      "route's board, not necessarily the board the card was dropped into",
  );
});

check('NEGATIVE: the list drag/reorder scoping (connectWithSelector, per #4223) is untouched', () => {
  const swimlanesJsPath = path.join(
    __dirname,
    '..',
    'client',
    'components',
    'swimlanes',
    'swimlanes.js',
  );
  const swimlanesSrc = fs.readFileSync(swimlanesJsPath, 'utf8');
  assert.ok(
    /function connectWithSelector\(\$listsDom\)/.test(swimlanesSrc),
    'list-level dragging must stay scoped to within one board via connectWithSelector()',
  );
});

console.log(`\n${passed} passing`);
