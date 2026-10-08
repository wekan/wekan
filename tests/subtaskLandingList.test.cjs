'use strict';
// #1781: the subtask landing list. Board Settings / Subtasks stores the main
// board's chosen landing list (a list of the deposit board) in its own
// subtasksDefaultListId, but addSubtaskCard read only the deposit board's
// field, so the choice was ignored - and a deposit board that itself sends
// subtasks elsewhere named a list of a third board, giving a card whose list
// is on another board. models/lib/subtaskLandingList.js decides it now.
//
// Run: node tests/subtaskLandingList.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chooseSubtaskLandingList } = require('../models/lib/subtaskLandingList');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('subtaskLandingList:');

const deposit = { _id: 'B', subtasksDefaultListId: 'b-queue' };
const lists = [
  { _id: 'b-todo', boardId: 'B' }, { _id: 'b-queue', boardId: 'B' },
  { _id: 'b-old', boardId: 'B', archived: true },
];

test('each main board lands its subtasks in the list it chose on the shared deposit board', () => {
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'A', subtasksDefaultListId: 'b-todo' }, targetBoard: deposit, lists }),
    { listId: 'b-todo' });
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'C', subtasksDefaultListId: 'b-queue' }, targetBoard: deposit, lists }),
    { listId: 'b-queue' });
});

test('without a choice of its own, the deposit board\'s landing list applies, as before', () => {
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'A' }, targetBoard: deposit, lists }), { listId: 'b-queue' });
  // A board that deposits on itself: the one field is its own landing list.
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: deposit, targetBoard: deposit, lists }), { listId: 'b-queue' });
  // Nothing set anywhere: create and store "Queue", as before.
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'A' }, targetBoard: { _id: 'B' }, lists }), { create: 'store' });
});

test('negative: never a list of another board, nor an archived or deleted one', () => {
  // The main board's choice is a list of some other board (left over from a
  // previous deposit board): ignored.
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'A', subtasksDefaultListId: 'x-list' }, targetBoard: deposit,
    lists: [...lists, { _id: 'x-list', boardId: 'X' }] }), { listId: 'b-queue' });
  // The deposit board itself deposits on a third board, so its field names a
  // list there: its first live list instead, and the field is not overwritten.
  const sending = { _id: 'B', subtasksDefaultListId: 'c-list' };
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'A' }, targetBoard: sending,
    lists: [...lists, { _id: 'c-list', boardId: 'C' }] }), { listId: 'b-todo' });
  assert.deepEqual(chooseSubtaskLandingList({ parentBoard: { _id: 'A', subtasksDefaultListId: 'b-old' },
    targetBoard: { _id: 'B', subtasksDefaultListId: 'gone' }, lists: [lists[2]] }), { create: 'local' },
  'archived and deleted lists are not landing lists; a new local Queue is not stored over the choice');
});

test('addSubtaskCard uses it, and only creates and stores Queue when the deposit board has no choice', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'models', 'cards.js'), 'utf8');
  const body = src.slice(src.indexOf("chooseSubtaskLandingList({ parentBoard, targetBoard,"));
  assert.match(body, /lists: await Lists\.find\(\{ boardId: targetBoard\._id, archived: \{ \$ne: true \} \}/);
  assert.match(body, /else if \(landing\.create === 'store'\) targetList = await targetBoard\.getDefaultSubtasksListAsync\(\);/);
  assert.ok(!/const targetList = await targetBoard\.getDefaultSubtasksListAsync\(\);/.test(src), 'no unconditional read of the deposit board field');
});

console.log(`\nsubtaskLandingList: ${passed} tests passed`);
