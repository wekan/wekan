'use strict';
// Hall of Fame regression coverage: LinkedWriteBleed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { sourceRoleBlocksDelegation } = require('../models/lib/linkedWritePolicy');
const { BOARD_ROLES, ROLE_FLAGS, roleCan, memberCan } = require('../models/lib/boardRoleCapabilities');
test('live links cannot promote explicit non-writing source roles', async () => {
  const text = fs.readFileSync('server/lib/linkedCardPermission.js', 'utf8');
  for (const role of BOARD_ROLES) {
    const member = { userId: 'u', isActive: true, [ROLE_FLAGS[role] || 'normal']: true };
    const source = { _id: 'A', members: [member] };
    assert.equal(sourceRoleBlocksDelegation('u', source), !roleCan(role, 'write'));
    const logs = [], context = {
      sourceRoleBlocksDelegation, recordLinkedWriteDenial: source => logs.push(source),
      allowIsBoardMemberWithWriteAccess: (id, board) => Boolean(board && memberCan(board.members, id, 'write')),
      canUserSeeBoard: async () => true,
      Boards: { findOneAsync: async () => source, find: () => ({ fetchAsync: async () => [{ members: [{ userId: 'u', isActive: true, isAdmin: true }] }] }) },
      Cards: { find: () => ({ fetchAsync: async () => [{ boardId: 'self-owned' }] }) },
    };
    vm.runInNewContext(text.replace(/^import .*;\n/gm, '').replace('export async function', 'async function'), context);
    assert.equal(await context.canEditCardOrLinkedCard('u', { _id: 'card', boardId: 'A' }), roleCan(role, 'write'));
    assert.equal(logs.length, roleCan(role, 'write') ? 0 : 1);
  }
});
test('negative: method, DDP insert and link-pointer updates enforce source write access', () => {
  const methods = fs.readFileSync('server/models/cards.js', 'utf8');
  const at = methods.indexOf('  async createLinkedCard(');
  const body = methods.slice(at, methods.indexOf('// #6608:', at));
  assert.doesNotMatch(body, /allowIsBoardMember\(/);
  assert.match(body, /allowIsBoardMemberWithWriteAccess\(this.userId, sourceBoard\)/);
  const ddp = fs.readFileSync('server/permissions/cards.js', 'utf8');
  assert.equal((ddp.match(/await denyUnauthorizedCardLink\(/g) || []).length, 2);
  assert.match(ddp, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  const helper = fs.readFileSync('server/lib/linkedCardPermission.js', 'utf8');
  assert.ok(helper.indexOf('sourceRoleBlocksDelegation(userId, sourceBoard)') < helper.indexOf('const links ='));
});
