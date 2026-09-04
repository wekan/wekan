'use strict';

// Guard: moving a list to a swimlane actually binds it to that swimlane.
// Run: node tests/listMoveSwimlane.test.cjs
//
// #6670 "Lists lose swimlane ID": every list showed up under every swimlane,
// backups showed an empty swimlaneId on lists, and deleting a list from one
// swimlane deleted it from all of them.
//
// The last symptom is the tell. A list rendered under three swimlanes is ONE
// document rendered three times - lists with an empty swimlaneId are shown in
// every swimlane on purpose (Swimlanes.myLists, the pre-per-swimlane fallback)
// - so deleting "the one in the second swimlane" deletes the only one there is.
// The question is why the swimlaneId was empty and why the user could not set
// it, and the answer was in List.move(boardId, swimlaneId):
//
//   const boardList = await ReactiveCache.getList({
//     boardId, title: this.title, archived: false });
//   if (boardList) { ...merge, never writes a swimlaneId... }
//   else           { ...insert a new list WITH the swimlaneId... }
//
// It asked "does the target board already have a list with this name?" without
// first asking whether the target board IS this list's board. On a same-board
// move that search finds THIS LIST, so the merge branch ran - and the merge
// branch is the one branch that never writes a swimlaneId. Choosing a swimlane
// for a list therefore did nothing at all, every time.
//
// The same branch also called `card.move(boardId, this._id, boardList._id)`.
// Card.move's second argument is a swimlaneId, so this set every card's
// swimlaneId to a LIST id - a swimlane that does not exist - which is how the
// cards then became the "orphaned cards" the board-open repair has to rescue.
//
// The decision now lives in models/lib/listMovePlan.js so it can be tested
// here; models/lists.js applies it.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { planListMove } = require(path.join(ROOT, 'models', 'lib', 'listMovePlan'));

const listsModel = fs.readFileSync(path.join(ROOT, 'models', 'lists.js'), 'utf8');
const serverLists = fs.readFileSync(path.join(ROOT, 'server', 'models', 'lists.js'), 'utf8');
const swimlanesModel = fs.readFileSync(path.join(ROOT, 'models', 'swimlanes.js'), 'utf8');

// Source scans look at CODE, not prose: the comments in List.move quote the
// call that used to be wrong, and a scan that counted those would fail on the
// very explanation of the fix.
const withoutComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

const BOARD = 'board1';
const OTHER = 'board2';
const LIST = 'listA';

// ---- the plan ---------------------------------------------------------------

test('moving a list to another swimlane on the same board binds it', () => {
  const plan = planListMove({
    listId: LIST,
    listBoardId: BOARD,
    listSwimlaneId: '',
    targetBoardId: BOARD,
    targetSwimlaneId: 'swimlane2',
    existingListId: null,
  });
  assert.equal(plan.action, 'rebind');
  assert.equal(plan.listId, LIST, 'the list moves, it is not replaced by a copy');
  assert.equal(plan.swimlaneId, 'swimlane2');
  assert.equal(plan.rebind, true, 'and its swimlaneId is written');
});

// THE regression. The title search returns this very list on a same-board move;
// before #6670 that sent the move down the merge branch, which never writes a
// swimlaneId - so the list stayed board-wide and appeared under every swimlane.
test('a same-board move is never a merge, even with itself (negative)', () => {
  const plan = planListMove({
    listId: LIST,
    listBoardId: BOARD,
    listSwimlaneId: '',
    targetBoardId: BOARD,
    targetSwimlaneId: 'swimlane2',
    existingListId: LIST, // what the by-title search finds on the same board
  });
  assert.notEqual(plan.action, 'merge',
    'merging a list into itself is what silently discarded the chosen swimlane');
  assert.equal(plan.action, 'rebind');
  assert.equal(plan.rebind, true);
});

test('re-binding to the swimlane it already has writes nothing', () => {
  const plan = planListMove({
    listId: LIST,
    listBoardId: BOARD,
    listSwimlaneId: 'swimlane2',
    targetBoardId: BOARD,
    targetSwimlaneId: 'swimlane2',
    existingListId: null,
  });
  assert.equal(plan.action, 'rebind');
  assert.equal(plan.rebind, false,
    'a pointless update still runs the collection hooks on a large board');
});

test('an empty swimlane is a deliberate un-bind back to board-wide', () => {
  const plan = planListMove({
    listId: LIST,
    listBoardId: BOARD,
    listSwimlaneId: 'swimlane2',
    targetBoardId: BOARD,
    targetSwimlaneId: '',
    existingListId: null,
  });
  assert.equal(plan.swimlaneId, '');
  assert.equal(plan.rebind, true, 'shared lists remain a legitimate layout');
});

test('a missing or non-string swimlane normalises to board-wide', () => {
  for (const value of [undefined, null, 0, {}]) {
    const plan = planListMove({
      listId: LIST,
      listBoardId: BOARD,
      listSwimlaneId: 'swimlane2',
      targetBoardId: BOARD,
      targetSwimlaneId: value,
    });
    assert.equal(plan.swimlaneId, '', `${JSON.stringify(value)} must not reach the database`);
  }
});

test('merging is still what happens across boards', () => {
  const plan = planListMove({
    listId: LIST,
    listBoardId: BOARD,
    listSwimlaneId: 'swimlane1',
    targetBoardId: OTHER,
    targetSwimlaneId: 'otherSwimlane',
    existingListId: 'listOnOtherBoard',
  });
  assert.equal(plan.action, 'merge');
  assert.equal(plan.listId, 'listOnOtherBoard', 'the cards join the list already there');
  assert.equal(plan.rebind, false,
    "the destination board's own list keeps its own binding");
});

test('a list whose name is new on the other board is created there, bound', () => {
  const plan = planListMove({
    listId: LIST,
    listBoardId: BOARD,
    listSwimlaneId: 'swimlane1',
    targetBoardId: OTHER,
    targetSwimlaneId: 'otherSwimlane',
    existingListId: null,
  });
  assert.equal(plan.action, 'create');
  assert.equal(plan.listId, null);
  assert.equal(plan.swimlaneId, 'otherSwimlane');
});

// ---- how models/lists.js applies it -----------------------------------------

test('List.move uses the plan and only searches other boards by title', () => {
  const move = listsModel.slice(
    listsModel.indexOf('  async move(boardId, swimlaneId) {'),
    listsModel.indexOf('orphanedCardsSwimlaneIds(swimlaneId) {'));
  assert.ok(move.length > 0, 'models/lists.js must still have List.move');
  assert.match(listsModel, /import \{ planListMove \} from '\.\/lib\/listMovePlan';/,
    'the planner must be the one place the decision lives');
  assert.match(move, /const sameBoard = boardId === this\.boardId;/,
    'the by-title search must be skipped on the same board, where it finds itself');
  assert.match(move, /sameBoard\s*\n?\s*\?\s*null/,
    'and it must resolve to nothing there');
  assert.match(move, /plan\.rebind/, 'a same-board move must write the swimlaneId');
});

// Negative: the argument-order bug. Card.move(boardId, swimlaneId, listId) - a
// list id in the second position sets a card's swimlaneId to a swimlane that
// does not exist, and the card disappears until the board-open repair finds it.
test('no card is moved into a swimlane that is really a list id (negative)', () => {
  const calls = [...withoutComments(listsModel).matchAll(/card\.move\(([^)]*)\)/g)]
    .map(m => m[1]);
  assert.ok(calls.length > 0, 'List.move must still move the cards with the list');
  for (const args of calls) {
    const second = args.split(',')[1]?.trim();
    assert.ok(second && !/^this\._id$/.test(second),
      `card.move's second argument is a swimlaneId, not a list id (got "${second}")`);
    assert.match(second, /swimlaneId/i,
      `card.move's second argument must be a swimlane (got "${second}")`);
  }
});

// Negative: the cards must not be filtered by the TARGET board's swimlaneId -
// on a cross-board move that matches nothing and leaves every card behind.
test('the cards that travel are the list-s own, unfiltered (negative)', () => {
  const move = withoutComments(listsModel).slice(
    listsModel.indexOf('  async move(boardId, swimlaneId) {'),
    listsModel.indexOf('orphanedCardsSwimlaneIds(swimlaneId) {'));
  assert.match(move, /for \(const card of await this\.cards\(\)\)/,
    'every card in the list travels with it');
  assert.doesNotMatch(move, /this\.cards\(swimlaneId\)/,
    "filtering the source list's cards by a target-board swimlane matches nothing");
});

test('moveList refuses a swimlane that is not on the target board', () => {
  assert.match(serverLists, /swimlane-not-found/,
    'binding a list to another board-s swimlane would hide it everywhere');
  assert.match(serverLists, /targetSwimlane\.boardId !== boardId/,
    'the swimlane must belong to the board the list is moving to');
  assert.match(serverLists, /if \(swimlaneId\) \{/,
    "and an empty swimlaneId must stay allowed - that is the un-bind");
});

// Context, so the next reader knows why an empty swimlaneId shows a list in
// every swimlane at all, and why that is not itself the bug.
test('an unbound list is still shown in every swimlane, on purpose', () => {
  assert.match(swimlanesModel, /\{ swimlaneId: null \}/,
    'myLists() keeps showing pre-per-swimlane lists everywhere');
  assert.match(swimlanesModel, /\{ swimlaneId: '' \}/);
});

console.log(`listMoveSwimlane: ${passed} tests passed`);
