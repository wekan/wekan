'use strict';

// Guard: copying a list actually copies its cards, and a copy is a new list.
// Run: node tests/listCopySwimlane.test.cjs
//
// The copy-side twin of tests/listMoveSwimlane.test.cjs. List.copy carried both
// of the faults #6670 fixed in List.move, and one of its own:
//
//   const oldSwimlaneId = this.swimlaneId || null;
//   ...
//   const existingListWithSameName = await ReactiveCache.getList({
//     boardId, title: this.title, archived: false });
//   if (existingListWithSameName) { _id = existingListWithSameName._id; }
//   ...
//   const cards = await ReactiveCache.getCards({
//     swimlaneId: oldSwimlaneId, listId: oldId, archived: false });
//
// 1. THE COPY CAME OUT EMPTY. A list that is not bound to a swimlane - an empty
//    or missing swimlaneId, which is what every list on a board predating
//    per-swimlane lists still has - turns `this.swimlaneId || null` into
//    `null`, so the selector asks for cards that have NO swimlane. The cards of
//    such a list carry the real swimlaneIds of the swimlanes they are in, so it
//    matched nothing and the copy produced a list with no cards at all.
//
// 2. THE "COPY" WROTE INTO THE ORIGINAL. The by-title search asks whether the
//    target board has a list of this name, without first asking whether the
//    target board IS this list's own board. On a same-board copy it finds THIS
//    list, so `_id` became the original: the cards were copied back into the
//    source list, doubling them, and the source list's id was returned - which
//    POST /api/boards/:boardId/lists/:listId/copy then repositioned, moving the
//    very list the user asked to copy. That is the #6670 shape exactly.
//
// The decision now lives in models/lib/listCopyPlan.js so it can be tested
// here; models/lists.js applies it.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const {
  planListCopy,
  copiedCardSwimlaneId,
} = require(path.join(ROOT, 'models', 'lib', 'listCopyPlan'));

const listsModel = fs.readFileSync(path.join(ROOT, 'models', 'lists.js'), 'utf8');

// Source scans look at CODE, not prose: the comments in List.copy quote the
// selector that used to be wrong, and a scan that counted those would fail on
// the very explanation of the fix.
const withoutComments = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

const copySource = () => {
  const stripped = withoutComments(listsModel);
  const start = stripped.indexOf('  async copy(boardId, swimlaneId, cardIdMap = null) {');
  const end = stripped.indexOf('  async move(boardId, swimlaneId) {');
  assert.ok(start >= 0 && end > start, 'models/lists.js must still have List.copy');
  return stripped.slice(start, end);
};

let passed = 0;
const test = (name, run) => {
  run();
  passed++;
  if (process.env.VERBOSE) console.log(`  ok - ${name}`);
};

const BOARD = 'board1';
const OTHER = 'board2';
const LIST = 'listA';

// ---- which cards travel (defect 1) ------------------------------------------

// THE regression: a board-wide list is the common case on any board that
// predates per-swimlane lists, and its copy contained nothing.
test('a board-wide list copies its cards, which are in real swimlanes', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: BOARD,
    targetSwimlaneId: 'swimlane2',
  });
  assert.deepEqual(plan.cardSelector, { listId: LIST, archived: false });
  const card = { _id: 'c1', swimlaneId: 'swimlane1' };
  assert.equal(copiedCardSwimlaneId(plan, card), 'swimlane2',
    'and they land in the swimlane the copy was asked for');
});

test('the card selector never scopes by swimlane at all (negative)', () => {
  for (const listSwimlaneId of ['', null, undefined, 'swimlane1']) {
    const plan = planListCopy({
      listId: LIST,
      listBoardId: BOARD,
      listSwimlaneId,
      targetBoardId: OTHER,
      targetSwimlaneId: 'swimlane9',
    });
    assert.ok(!('swimlaneId' in plan.cardSelector),
      'scoping the source list-s own cards by a swimlane can only drop cards ' +
      'that belong to the list - and emptied the copy of a board-wide one');
    assert.deepEqual(plan.cardSelector, { listId: LIST, archived: false });
  }
});

test('archived cards are still left behind', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: OTHER,
    targetSwimlaneId: 's',
  });
  assert.equal(plan.cardSelector.archived, false,
    'a copy takes the list as it is shown, not its archive');
});

// ---- which list is written into (defect 2) ----------------------------------

// THE other regression, the #6670 shape: the by-title search finds THIS list on
// a same-board copy, so the "copy" wrote into the original.
test('a same-board copy is never a merge, even with itself (negative)', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: BOARD,
    targetSwimlaneId: 'swimlane2',
    existingListId: LIST, // what the by-title search finds on the same board
  });
  assert.notEqual(plan.action, 'merge',
    'merging a list into itself copied the cards back into the source list');
  assert.equal(plan.action, 'create');
  assert.equal(plan.listId, null, 'a copy is a NEW list');
  assert.equal(plan.swimlaneId, 'swimlane2');
});

test('a same-board copy creates a new list even beside a same-titled one', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: BOARD,
    targetSwimlaneId: '',
    existingListId: 'anotherListOnThisBoardCalledTheSame',
  });
  assert.equal(plan.action, 'create',
    'reusing a same-titled list is only meaningful across boards');
  assert.equal(plan.listId, null);
});

test('merging into the destination board-s own list still happens', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: OTHER,
    targetSwimlaneId: 'otherSwimlane',
    existingListId: 'listOnOtherBoard',
  });
  assert.equal(plan.action, 'merge');
  assert.equal(plan.listId, 'listOnOtherBoard', 'the cards join the list already there');
});

test('a list whose name is new on the other board is created there, bound', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: OTHER,
    targetSwimlaneId: 'otherSwimlane',
    existingListId: null,
  });
  assert.equal(plan.action, 'create');
  assert.equal(plan.listId, null);
  assert.equal(plan.swimlaneId, 'otherSwimlane');
});

// ---- where the copied cards land --------------------------------------------

test('a missing or non-string swimlane normalises to board-wide', () => {
  for (const value of [undefined, null, 0, {}]) {
    const plan = planListCopy({
      listId: LIST,
      listBoardId: BOARD,
      targetBoardId: OTHER,
      targetSwimlaneId: value,
    });
    assert.equal(plan.swimlaneId, '', `${JSON.stringify(value)} must not reach the database`);
    assert.equal(copiedCardSwimlaneId(plan, { swimlaneId: 'swimlane1' }), '',
      'a card may not keep a swimlaneId that belongs to the source board');
  }
});

// The REST endpoint's own default: POST .../copy with no toSwimlaneId, on the
// board the list is already on.
test('a same-board copy with no swimlane keeps each card where it is', () => {
  const plan = planListCopy({
    listId: LIST,
    listBoardId: BOARD,
    targetBoardId: BOARD,
    targetSwimlaneId: undefined,
  });
  assert.equal(plan.keepCardSwimlanes, true);
  assert.equal(copiedCardSwimlaneId(plan, { swimlaneId: 'swimlane1' }), 'swimlane1');
  assert.equal(copiedCardSwimlaneId(plan, { swimlaneId: 'swimlane2' }), 'swimlane2',
    'a duplicate of a board-wide list looks like the original');
  assert.equal(copiedCardSwimlaneId(plan, {}), '',
    'a card that had no swimlane still has none');
});

// Negative: keeping the source card's swimlaneId across boards would point at a
// swimlane on the OTHER board - an orphaned card the board-open repair has to
// rescue, which is what the #6670 argument-order bug produced in List.move.
test('a cross-board copy never keeps the source swimlaneId (negative)', () => {
  for (const targetSwimlaneId of ['', 'otherSwimlane', undefined]) {
    const plan = planListCopy({
      listId: LIST,
      listBoardId: BOARD,
      targetBoardId: OTHER,
      targetSwimlaneId,
    });
    assert.equal(plan.keepCardSwimlanes, false);
    assert.equal(copiedCardSwimlaneId(plan, { swimlaneId: 'swimlaneOnSourceBoard' }),
      typeof targetSwimlaneId === 'string' ? targetSwimlaneId : '');
  }
});

// ---- how models/lists.js applies it -----------------------------------------

test('List.copy uses the plan and only searches other boards by title', () => {
  const copy = copySource();
  assert.match(listsModel,
    /import \{ planListCopy, copiedCardSwimlaneId \} from '\.\/lib\/listCopyPlan';/,
    'the planner must be the one place the decision lives');
  assert.match(copy, /const sameBoard = boardId === this\.boardId;/,
    'the by-title search must be skipped on the same board, where it finds itself');
  assert.match(copy, /sameBoard\s*\n?\s*\?\s*null/,
    'and it must resolve to nothing there');
  assert.match(copy, /planListCopy\(\{/);
  assert.match(copy, /ReactiveCache\.getCards\(plan\.cardSelector\)/,
    'the cards must be selected by the plan-s selector');
  assert.match(copy, /copiedCardSwimlaneId\(plan, card\)/,
    'and each card must land in the swimlane the plan gives it');
});

// Negative: the exact selector that emptied the copy must be gone, and no
// swimlaneId may be hand-built into the card query again.
test('List.copy no longer scopes its cards by the list-s swimlane (negative)', () => {
  const copy = copySource();
  assert.doesNotMatch(copy, /this\.swimlaneId \|\| null/,
    'a board-wide list has no swimlaneId, and its cards have real ones');
  assert.doesNotMatch(copy, /oldSwimlaneId/,
    'the source swimlane must not come back as a card filter');
  assert.doesNotMatch(copy, /getCards\(\{/,
    'the card selector belongs to models/lib/listCopyPlan.js, not to a literal here');
});

// Negative: nothing may reach the copy branch that writes into a list found by
// title on this list's OWN board.
test('no same-titled list is looked up before the board is compared (negative)', () => {
  const copy = copySource();
  assert.doesNotMatch(copy, /existingListWithSameName/,
    'the unconditional by-title search is what found THIS list');
  const searchIndex = copy.indexOf('ReactiveCache.getList({');
  assert.ok(searchIndex > 0, 'a cross-board copy still looks for a same-titled list');
  assert.ok(copy.indexOf('const sameBoard') < searchIndex,
    'the board comparison must come first, or the search finds this list again');
});

console.log(`listCopySwimlane: ${passed} tests passed`);
