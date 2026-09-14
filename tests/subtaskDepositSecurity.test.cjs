'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { assignedOnlyCardScope, boardScopeIds } = require('../models/lib/boardCardScope');
const { memberCan } = require('../models/lib/boardRoleCapabilities');
test('destination write gate rejects foreign, missing and non-writing boards', async () => {
  const text = fs.readFileSync('server/lib/subtaskDepositAccess.js', 'utf8');
  let destination;
  const context = { Boards: { findOneAsync: async () => destination },
    allowIsBoardMemberWithWriteAccess: (id, board) => Boolean(board && memberCan(board.members, id, 'write')) };
  vm.runInNewContext(text.replace(/^import .*;\n/gm, '').replace(/export /g, ''), context);
  for (const flags of [{}, { isAdmin: true }, { isCommentOnly: true }, { isReadOnly: true }, { isActive: false }]) {
    destination = { members: [{ userId: 'u', isActive: true, ...flags }] };
    assert.equal(await context.canWriteSubtaskDeposit('u', 'B'), memberCan(destination.members, 'u', 'write'));
  }
  destination = { members: [] };
  assert.equal(await context.canWriteSubtaskDeposit('u', 'B'), false);
  assert.equal(await context.canWriteSubtaskDeposit(null, 'B'), false);
});
test('deposit publications use their own assignment policy and reactive card children', async () => {
  const text = fs.readFileSync('server/lib/subtaskDepositPublication.js', 'utf8');
  const captures = [];
  const collections = Object.fromEntries(['Cards', 'CardComments', 'Checklists', 'ChecklistItems', 'CardTextNotes', 'Attachments'].map(name => [name, { find(selector) { captures.push({ name, selector }); return { name, selector }; } }]));
  const context = { ...collections, require: () => ({ assignedOnlyCardScope }) };
  vm.runInNewContext(text.replace(/^import .*;\n/gm, '').replace(/export /g, ''), context);
  const children = context.subtaskDepositChildren('u', false, async () => false);
  const deposit = { _id: 'B', members: [{ userId: 'u', isActive: true, isReadAssignedOnly: true }] };
  const cardCursor = await children[0].find(deposit, { _id: 'A' });
  assert.equal(cardCursor.selector.boardId, 'B');
  assert.equal(cardCursor.selector.assignees.$in[0], 'u');
  for (const child of children.slice(1)) assert.equal(await child.find(deposit, {}), null);
  for (const child of children[0].children) {
    const cursor = child.find({ _id: 'assigned-card' }, deposit);
    assert.equal(Object.values(cursor.selector)[0], 'assigned-card');
  }
  const normal = { _id: 'B', members: [] };
  for (const child of children[0].children) assert.equal(child.find({ _id: 'card' }, normal), null);
  for (const child of context.subtaskDepositChildren('u', false, async () => true)) assert.equal(await child.find(deposit, {}), null);
});
test('negative: no publication unions an unvalidated deposit pointer into source scope', () => {
  assert.deepEqual(boardScopeIds({ _id: 'A', subtasksDefaultBoardId: 'secret' }), ['A']);
  const read = name => fs.readFileSync(name, 'utf8');
  const boards = read('server/publications/boards.js');
  assert.doesNotMatch(boards, /boardIds\.push\(board\.subtasksDefaultBoardId\)/);
  assert.match(boards, /Boards\.find\(\{ _id: board.subtasksDefaultBoardId, \$or \}/);
  assert.match(boards, /children: subtaskDepositChildren\(thisUserId, isArchived, boardIsLazy\)/);
  const methods = read('server/models/cards.js');
  const at = methods.indexOf('  async addSubtaskCard(');
  assert.ok(methods.indexOf('canWriteSubtaskDeposit(this.userId, targetBoard._id)', at) < methods.indexOf('targetBoard.getDefaultSubtasksListAsync()', at));
  const permissions = read('server/permissions/boards.js');
  assert.equal((permissions.match(/await canWriteSubtaskDeposit\(/g) || []).length, 2);
  assert.match(permissions, /Object.values\(modifier.\$rename\).includes\('subtasksDefaultBoardId'\)/);
  assert.match(read('models/boards.js'), /canWriteSubtaskDeposit\(Meteor.userId\(\), subtasksDefaultBoardId\)/);
});
