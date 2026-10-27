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
    // An assigned-only role is decided by the card first, before any link
    // (GHSA-r4gm-mjj9-g3x8, tests/boardRoleViews.test.cjs); this test is about
    // what a link may delegate.
    if (/assigned-only/.test(role)) continue;
    const logs = [], context = {
      sourceRoleBlocksDelegation, recordLinkedWriteDenial: source => logs.push(source),
      allowIsBoardMemberWithWriteAccess: (id, board) => Boolean(board && memberCan(board.members, id, 'write')),
      canUserSeeBoard: async () => true,
      // #4527: the card's list is asked first; these lists make no exception,
      // so the source role alone decides, as this test is about.
      listException: async () => undefined,
      require: name => (/boardCardScope/.test(name) ? require('../models/lib/boardCardScope') : { exceptionFor: () => undefined }),
      Boards: { findOneAsync: async () => source, find: () => ({ fetchAsync: async () => [{ members: [{ userId: 'u', isActive: true, isAdmin: true }] }] }) },
      Cards: { find: () => ({ fetchAsync: async () => [{ boardId: 'self-owned' }] }) },
    };
    vm.runInNewContext(text.replace(/^import .*;\n/gm, '').replace(/^export async function/gm, 'async function'), context);
    assert.equal(await context.canEditCardOrLinkedCard('u', { _id: 'card', boardId: 'A' }), roleCan(role, 'write'));
    assert.equal(logs.length, roleCan(role, 'write') ? 0 : 1);
    const count = logs.length;
    assert.equal(await context.canEditCardOrLinkedCard('u', { _id: 'card', boardId: 'A' }, source, { recordDenial: false }), roleCan(role, 'write'));
    assert.equal(logs.length, count, 'read-side capability checks must not emit write-denial events');
  }
});
test('negative: method, DDP insert and link-pointer updates enforce source write access', () => {
  const methods = fs.readFileSync('server/models/cards.js', 'utf8');
  const at = methods.indexOf('async function createLinkedCardFor(');
  const body = methods.slice(at, methods.indexOf('Meteor.methods({', at));
  assert.doesNotMatch(body, /allowIsBoardMember\(/);
  assert.match(body, /allowIsBoardMemberWithWriteAccess\(userId, sourceBoard\)/);
  // An assigned-only member links only cards assigned to them.
  assert.match(body, /isAssignedOnlyMember\(sourceBoard, userId\) && !\(sourceCard\.assignees \|\| \[\]\)\.includes\(userId\)/);
  // The method and the REST route (linkedId) both use that one rule; the REST
  // route used to check only read access and clone the whole source card.
  assert.match(methods, /return createLinkedCardFor\(this\.userId, [^)]*'createLinkedCard'\)/);
  assert.match(methods, /await createLinkedCardFor\(req\.userId, [\s\S]*?'rest:card-link'\)/);
  // #6823 removed the branch's second "created" activity and its getCard, so
  // the branch now ends at its author-spoof note.
  const restEnd = methods.indexOf("noteAuthorSpoof(req, 'POST cards (linked)');");
  assert.ok(restEnd > 0, 'the linked-card branch of POST cards');
  const rest = methods.slice(methods.indexOf("if (req.body.linkedId) {"), restEnd);
  assert.doesNotMatch(rest, /checkBoardAccess|\.link\(/);
  const ddp = fs.readFileSync('server/permissions/cards.js', 'utf8');
  assert.equal((ddp.match(/await denyUnauthorizedCardLink\(/g) || []).length, 2);
  assert.match(ddp, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  const helper = fs.readFileSync('server/lib/linkedCardPermission.js', 'utf8');
  assert.ok(helper.indexOf('sourceRoleBlocksDelegation(userId, sourceBoard)') < helper.indexOf('const links ='));
});
