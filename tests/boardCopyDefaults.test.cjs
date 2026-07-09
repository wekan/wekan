'use strict';

// Plain-Node unit test (no Meteor) for the board-copy default-pointer remap.
// Run: node tests/boardCopyDefaults.test.cjs
//
// Regression guard for #4494 ("Creating a board from a template breaks
// subtasks"). Copying a template board inherited its subtasksDefaultBoardId /
// dateSettingsDefaultBoardId. When those pointed at the template board itself,
// subtasks created on the NEW board were dropped onto the TEMPLATE board.
// remapCopiedBoardDefaults() must repoint the source-board references to the
// copy (and clear the paired list id so it self-heals on the new board).

const assert = require('assert');
const { remapCopiedBoardDefaults } = require('../models/lib/boardCopyDefaults');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const OLD = 'templateBoard';
const NEW = 'newBoard';

// --- POSITIVE ---------------------------------------------------------------
test('self-referential subtasks default is repointed to the copy (#4494)', () => {
  const patch = remapCopiedBoardDefaults(
    { subtasksDefaultBoardId: OLD, subtasksDefaultListId: 'oldList' },
    OLD, NEW,
  );
  assert.strictEqual(patch.subtasksDefaultBoardId, NEW);
  assert.strictEqual(patch.subtasksDefaultListId, null); // cleared, self-heals
});

test('self-referential date-settings default is repointed to the copy', () => {
  const patch = remapCopiedBoardDefaults(
    { dateSettingsDefaultBoardId: OLD, dateSettingsDefaultListId: 'oldList' },
    OLD, NEW,
  );
  assert.strictEqual(patch.dateSettingsDefaultBoardId, NEW);
  assert.strictEqual(patch.dateSettingsDefaultListId, null);
});

test('both defaults repointed at once', () => {
  const patch = remapCopiedBoardDefaults(
    { subtasksDefaultBoardId: OLD, dateSettingsDefaultBoardId: OLD },
    OLD, NEW,
  );
  assert.strictEqual(patch.subtasksDefaultBoardId, NEW);
  assert.strictEqual(patch.dateSettingsDefaultBoardId, NEW);
});

// --- NEGATIVE ---------------------------------------------------------------
test('NEGATIVE: subtasks default pointing at ANOTHER board is left untouched', () => {
  // The template deliberately routes subtasks to a shared board; don't hijack it.
  const patch = remapCopiedBoardDefaults(
    { subtasksDefaultBoardId: 'someSharedBoard' },
    OLD, NEW,
  );
  assert.ok(!('subtasksDefaultBoardId' in patch));
  assert.deepStrictEqual(patch, {});
});

test('NEGATIVE: null / unset defaults produce no patch (empty = no DB write)', () => {
  assert.deepStrictEqual(
    remapCopiedBoardDefaults({ subtasksDefaultBoardId: null }, OLD, NEW),
    {},
  );
  assert.deepStrictEqual(remapCopiedBoardDefaults({}, OLD, NEW), {});
});

test('NEGATIVE: null board does not throw', () => {
  assert.doesNotThrow(() => remapCopiedBoardDefaults(null, OLD, NEW));
  assert.deepStrictEqual(remapCopiedBoardDefaults(null, OLD, NEW), {});
});

test('NEGATIVE: the new board must NOT keep the template board id', () => {
  const patch = remapCopiedBoardDefaults({ subtasksDefaultBoardId: OLD }, OLD, NEW);
  assert.notStrictEqual(patch.subtasksDefaultBoardId, OLD);
});

console.log(`\n${passed} tests passed`);
