'use strict';

// Plain-Node unit test (no Meteor) for copying a card's subtasks.
// Run: node tests/subtaskCopy.test.cjs
//
// Regression guard for #3185 ("Template with subtasks and checklists"). Copying
// a card inserted each subtask as a bare card document, dropping the subtask's
// checklists so the copied subtasks came out empty. The subtask copy must be
// re-homed correctly AND must reproduce its checklists.

const assert = require('assert');
const {
  buildCopiedSubtaskFields,
  subtaskCopyChildKinds,
} = require('../models/lib/subtaskCopy');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const SUBTASK = {
  _id: 'sub1',
  title: 'a subtask',
  parentId: 'oldParent',
  boardId: 'srcBoard',
  swimlaneId: 'srcSwim',
  listId: 'srcList',
  sort: 2,
};
const TARGET = { newParentId: 'newParent', boardId: 'dstB', swimlaneId: 'dstS', listId: 'dstL' };

// --- POSITIVE: the subtask copy is re-homed under the new parent/board -------
test('re-parents to the new parent card', () => {
  assert.strictEqual(buildCopiedSubtaskFields(SUBTASK, TARGET).parentId, 'newParent');
});

test('re-homes onto the destination board / swimlane / list', () => {
  const f = buildCopiedSubtaskFields(SUBTASK, TARGET);
  assert.strictEqual(f.boardId, 'dstB');
  assert.strictEqual(f.swimlaneId, 'dstS');
  assert.strictEqual(f.listId, 'dstL');
});

test('drops _id so a NEW subtask document is inserted', () => {
  assert.ok(!('_id' in buildCopiedSubtaskFields(SUBTASK, TARGET)));
});

test('preserves other fields (title, sort)', () => {
  const f = buildCopiedSubtaskFields(SUBTASK, TARGET);
  assert.strictEqual(f.title, 'a subtask');
  assert.strictEqual(f.sort, 2);
});

test('does not mutate the source subtask', () => {
  buildCopiedSubtaskFields(SUBTASK, TARGET);
  assert.strictEqual(SUBTASK._id, 'sub1');
  assert.strictEqual(SUBTASK.parentId, 'oldParent');
  assert.strictEqual(SUBTASK.boardId, 'srcBoard');
});

// --- NEGATIVE: the #3185 regression — checklists must be copied too ----------
test('NEGATIVE: a subtask copy MUST reproduce checklists (#3185)', () => {
  assert.ok(
    subtaskCopyChildKinds().includes('checklists'),
    'copying a subtask must also copy its checklists',
  );
});

test('NEGATIVE: the copy must never keep the OLD parent id (orphan) ...', () => {
  const f = buildCopiedSubtaskFields(SUBTASK, TARGET);
  assert.notStrictEqual(f.parentId, 'oldParent');
});

test('NEGATIVE: ... nor the SOURCE board id (would strand the subtask)', () => {
  const f = buildCopiedSubtaskFields(SUBTASK, TARGET);
  assert.notStrictEqual(f.boardId, 'srcBoard');
});

console.log(`\n${passed} tests passed`);
