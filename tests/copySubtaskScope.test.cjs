'use strict';
// AssignedBleed copy sibling (2026-10-03): a copy of a card carries along only
// the subtasks the copier could read and copy themselves
// (models/lib/boardCardScope.js copyableSubtasks). Before, an assigned-only
// member copying a card assigned to them got copies of its subtasks assigned
// to others, and of subtasks on boards they cannot read.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { copyableSubtasks, mayCopyFromBoard } = require('../models/lib/boardCardScope');

const member = (userId, extra = {}) => ({ userId, isActive: true, ...extra });
const boards = {
  team: { _id: 'team', members: [member('full'), member('limited', { isNormalAssignedOnly: true })] },
  privateOther: { _id: 'privateOther', members: [member('someone')] },
};
const canRead = (userId, board) => (board.members || []).some(m => m.userId === userId && m.isActive);
const boardOf = id => boards[id] || null;
const subtasks = [
  { _id: 'mine', boardId: 'team', assignees: ['limited'] },
  { _id: 'theirs', boardId: 'team', assignees: ['someone'] },
  { _id: 'unassigned', boardId: 'team' },
  { _id: 'elsewhere', boardId: 'privateOther', assignees: ['limited'] },
  { _id: 'gone', boardId: 'deleted-board' },
];

test('an assigned-only member carries only the subtasks assigned to them on boards they read', () => {
  assert.deepEqual(copyableSubtasks(subtasks, 'limited', boardOf, canRead).map(s => s._id), ['mine']);
});

test('a full member carries every subtask on boards they read, none on boards they cannot', () => {
  assert.deepEqual(copyableSubtasks(subtasks, 'full', boardOf, canRead).map(s => s._id), ['mine', 'theirs', 'unassigned']);
});

test('NEGATIVE: an outsider, a missing board and empty input carry nothing', () => {
  assert.deepEqual(copyableSubtasks(subtasks, 'stranger', boardOf, canRead), []);
  assert.deepEqual(copyableSubtasks([{ _id: 'x', boardId: 'deleted-board' }], 'full', boardOf, canRead), []);
  assert.deepEqual(copyableSubtasks(undefined, 'full', boardOf, canRead), []);
  assert.equal(mayCopyFromBoard(boards.team, 'limited', { assignees: ['someone'] }), false);
});

test('NEGATIVE: every place that copies subtasks filters them, nowhere copies them unfiltered', () => {
  // The shape of the fault: subtasks gathered for a copy and turned into new
  // cards (buildCopiedSubtaskFields, or a durable copy's subtaskSources)
  // without copyableSubtasks. Any file doing so must filter.
  const root = path.join(__dirname, '..');
  const files = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.meteor', '.tools', '_build', '.build', 'tests', '.git'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  };
  for (const dir of ['models', 'server', 'client', 'imports']) walk(path.join(root, dir));
  const copying = files.filter(file => /buildCopiedSubtaskFields\(|subtaskSources\s*=/.test(fs.readFileSync(file, 'utf8')))
    .filter(file => !file.endsWith(path.join('models', 'lib', 'subtaskCopy.js')))
    .filter(file => !file.endsWith(path.join('server', 'lib', 'syncRuleCopyCardCommand.js')));
  assert.deepEqual(copying.map(f => path.relative(root, f)).sort(), ['models/cards.js', 'server/notifications/storedRulePlans.js'].sort());
  for (const file of copying) assert.match(fs.readFileSync(file, 'utf8'), /copyableSubtasks\(/, path.relative(root, file));
});
