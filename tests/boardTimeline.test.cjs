'use strict';

// Regression coverage for the Board View / Timeline feature (Step 1 of the
// maintainer's spec): reconstructing what a board's cards looked like at an
// arbitrary past moment by replaying the Activities log backwards from the
// card's CURRENT state.
//
// models/lib/boardTimeline.js's reconstructBoardStateAt() is pure and
// read-only (no Mongo/Meteor), so it is pinned directly here as arithmetic
// over plain arrays, the same way tests/dueDateCountdown.test.cjs pins its
// pure date math.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

function loadBoardTimeline() {
  const context = {};
  const source = read('models/lib/boardTimeline.js')
    .replace(/^export function/gm, 'function')
    .replace(/^export \{[^}]*\};?\s*$/m, '')
    .concat('\nresult = { reconstructBoardStateAt };');
  vm.runInNewContext(source, context);
  return context.result;
}

const { reconstructBoardStateAt } = loadBoardTimeline();

const DAY = 24 * 60 * 60 * 1000;
const t0 = new Date('2026-01-01T00:00:00.000Z').getTime();
const at = n => new Date(t0 + n * DAY);

function findCard(result, id) {
  return result.cards.find(c => c._id === id);
}

test('reconstructBoardStateAt: a card created after asOf does not exist yet', () => {
  const cards = [{ _id: 'c1', title: 'Now title', listId: 'listB', boardId: 'b1' }];
  const activities = [
    { cardId: 'c1', activityType: 'createCard', createdAt: at(5) },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(1));
  assert.equal(findCard(result, 'c1').existed, false);
});

test('reconstructBoardStateAt: undoes a title rename back to the old value', () => {
  const cards = [{ _id: 'c1', title: 'New title', boardId: 'b1' }];
  const activities = [
    { cardId: 'c1', activityType: 'createCard', createdAt: at(0) },
    {
      cardId: 'c1',
      activityType: 'a-changedTitle',
      oldValue: 'Old title',
      value: 'New title',
      createdAt: at(5),
    },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(2));
  assert.equal(findCard(result, 'c1').title, 'Old title');
  // Asking for a time AFTER the rename shows the new title.
  const later = reconstructBoardStateAt(cards, activities, at(6));
  assert.equal(findCard(later, 'c1').title, 'New title');
});

test('reconstructBoardStateAt: undoes a description edit', () => {
  const cards = [{ _id: 'c1', description: 'New body', boardId: 'b1' }];
  const activities = [
    {
      cardId: 'c1',
      activityType: 'a-changedDescription',
      oldValue: 'Old body',
      value: 'New body',
      createdAt: at(5),
    },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(2));
  assert.equal(findCard(result, 'c1').description, 'Old body');
});

test('reconstructBoardStateAt: undoes a due-date change using timeOldValue', () => {
  const cards = [{ _id: 'c1', dueAt: at(20), boardId: 'b1' }];
  const activities = [
    {
      cardId: 'c1',
      activityType: 'a-dueAt',
      timeKey: 'dueAt',
      timeValue: at(20),
      timeOldValue: at(10),
      createdAt: at(5),
    },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(2));
  assert.equal(
    new Date(findCard(result, 'c1').dueAt).getTime(),
    at(10).getTime(),
  );
});

test('reconstructBoardStateAt: undoes a list/swimlane move back to the old ids', () => {
  const cards = [
    { _id: 'c1', listId: 'listB', swimlaneId: 'swB', boardId: 'b1' },
  ];
  const activities = [
    {
      cardId: 'c1',
      activityType: 'moveCard',
      oldListId: 'listA',
      listId: 'listB',
      oldSwimlaneId: 'swA',
      swimlaneId: 'swB',
      createdAt: at(5),
    },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(2));
  const card = findCard(result, 'c1');
  assert.equal(card.listId, 'listA');
  assert.equal(card.swimlaneId, 'swA');
});

test('reconstructBoardStateAt: undoes archive/restore back to not-archived', () => {
  const cards = [{ _id: 'c1', archived: false, boardId: 'b1' }];
  const activities = [
    { cardId: 'c1', activityType: 'archivedCard', createdAt: at(5) },
    { cardId: 'c1', activityType: 'restoredCard', createdAt: at(8) },
  ];
  // Between the archive and the restore, the card WAS archived.
  const between = reconstructBoardStateAt(cards, activities, at(6));
  assert.equal(findCard(between, 'c1').archived, true);
  // Before either, it was not archived (matches current state).
  const before = reconstructBoardStateAt(cards, activities, at(1));
  assert.equal(findCard(before, 'c1').archived, false);
});

test('reconstructBoardStateAt: undoes member join/unjoin', () => {
  const cards = [{ _id: 'c1', members: ['userB'], boardId: 'b1' }];
  const activities = [
    { cardId: 'c1', activityType: 'unjoinMember', memberId: 'userA', createdAt: at(3) },
    { cardId: 'c1', activityType: 'joinMember', memberId: 'userB', createdAt: at(6) },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(1));
  assert.deepStrictEqual(findCard(result, 'c1').members.sort(), ['userA']);
});

test('reconstructBoardStateAt: undoes label add/remove', () => {
  const cards = [{ _id: 'c1', labelIds: ['lblGreen'], boardId: 'b1' }];
  const activities = [
    { cardId: 'c1', activityType: 'removedLabel', labelId: 'lblRed', createdAt: at(3) },
    { cardId: 'c1', activityType: 'addedLabel', labelId: 'lblGreen', createdAt: at(6) },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(1));
  assert.deepStrictEqual(findCard(result, 'c1').labelIds.sort(), ['lblRed']);
});

test('reconstructBoardStateAt: a multi-step history reconstructs correctly at several points', () => {
  const cards = [
    {
      _id: 'c1',
      title: 'Final title',
      listId: 'listC',
      labelIds: ['lblBlue'],
      members: ['userX'],
      archived: false,
      boardId: 'b1',
    },
  ];
  const activities = [
    { cardId: 'c1', activityType: 'createCard', createdAt: at(0) },
    { cardId: 'c1', activityType: 'addedLabel', labelId: 'lblRed', createdAt: at(1) },
    { cardId: 'c1', activityType: 'joinMember', memberId: 'userX', createdAt: at(2) },
    {
      cardId: 'c1',
      activityType: 'moveCard',
      oldListId: 'listA',
      listId: 'listB',
      createdAt: at(3),
    },
    {
      cardId: 'c1',
      activityType: 'a-changedTitle',
      oldValue: 'First title',
      value: 'Mid title',
      createdAt: at(4),
    },
    { cardId: 'c1', activityType: 'removedLabel', labelId: 'lblRed', createdAt: at(5) },
    { cardId: 'c1', activityType: 'addedLabel', labelId: 'lblBlue', createdAt: at(6) },
    {
      cardId: 'c1',
      activityType: 'moveCard',
      oldListId: 'listB',
      listId: 'listC',
      createdAt: at(7),
    },
    {
      cardId: 'c1',
      activityType: 'a-changedTitle',
      oldValue: 'Mid title',
      value: 'Final title',
      createdAt: at(8),
    },
  ];

  // Before creation.
  assert.equal(findCard(reconstructBoardStateAt(cards, activities, at(-1)), 'c1').existed, false);

  // Just after creation, before any activity: no labels/members, in listA (unknown -
  // current listId is used as the base only after undoing every later move, and no
  // move activity exists yet before t=3, so listId is whatever undoing moveCard@3
  // leaves it at, i.e. listA).
  const afterCreate = findCard(reconstructBoardStateAt(cards, activities, at(0.5)), 'c1');
  assert.deepStrictEqual(afterCreate.labelIds, []);
  assert.deepStrictEqual(afterCreate.members, []);
  assert.equal(afterCreate.listId, 'listA');
  assert.equal(afterCreate.title, 'First title');

  // Mid-history (t=4.5): title renamed once, in listB, has lblRed, has userX.
  const mid = findCard(reconstructBoardStateAt(cards, activities, at(4.5)), 'c1');
  assert.equal(mid.title, 'Mid title');
  assert.equal(mid.listId, 'listB');
  assert.deepStrictEqual(mid.labelIds, ['lblRed']);
  assert.deepStrictEqual(mid.members, ['userX']);

  // After everything (t=9): matches the given current card exactly.
  const finalState = findCard(reconstructBoardStateAt(cards, activities, at(9)), 'c1');
  assert.equal(finalState.title, 'Final title');
  assert.equal(finalState.listId, 'listC');
  assert.deepStrictEqual(finalState.labelIds, ['lblBlue']);
});

test('reconstructBoardStateAt: a cross-board move is flagged as unreversed, not silently applied', () => {
  const cards = [{ _id: 'c1', boardId: 'b2' }];
  const activities = [
    {
      cardId: 'c1',
      activityType: 'moveCardBoard',
      oldBoardId: 'b1',
      boardId: 'b2',
      createdAt: at(5),
    },
  ];
  const result = reconstructBoardStateAt(cards, activities, at(2));
  const card = findCard(result, 'c1');
  assert.ok(card.unreversedActivityTypes.includes('moveCardBoard'));
});

test('reconstructBoardStateAt is pure: it does not mutate its inputs', () => {
  const cards = [{ _id: 'c1', title: 'T', labelIds: ['a'], members: ['u'], boardId: 'b1' }];
  const activities = [
    { cardId: 'c1', activityType: 'addedLabel', labelId: 'b', createdAt: at(5) },
  ];
  const cardsBefore = JSON.stringify(cards);
  const activitiesBefore = JSON.stringify(activities);
  reconstructBoardStateAt(cards, activities, at(2));
  assert.equal(JSON.stringify(cards), cardsBefore);
  assert.equal(JSON.stringify(activities), activitiesBefore);
});

// Negative test: this feature must never delete an Activity document. Scan
// the module's source for any removal call, so the guarantee holds even as
// the file changes.
test('boardTimeline.js contains no Activities removal call', () => {
  const source = read('models/lib/boardTimeline.js');
  assert.doesNotMatch(source, /Activities\s*\.\s*(remove|removeAsync|deleteOne|deleteMany)/);
  assert.doesNotMatch(source, /\.\s*(remove|removeAsync|deleteOne|deleteMany)\s*\(/);
});
