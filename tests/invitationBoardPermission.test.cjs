'use strict';
// Hall of Fame regression coverage: InvitationBoardBleed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { canInviteToBoard } = require('../models/lib/invitationBoardPermission');
test('invitation grant requires a supported inviter role on every real board', () => {
  const user = { _id: 'u' };
  const board = flags => ({ members: [{ userId: 'u', isActive: true, ...flags }] });
  assert.equal(canInviteToBoard(user, board({ isAdmin: true }), ['board-admin']), true);
  assert.equal(canInviteToBoard(user, board({}), ['board-admin']), false);
  assert.equal(canInviteToBoard(user, board({}), ['normal']), true);
  assert.equal(canInviteToBoard(user, board({ isActive: false }), ['normal']), false);
  assert.equal(canInviteToBoard(user, { members: [] }, ['normal']), false);
  assert.equal(canInviteToBoard({ ...user, isAdmin: true }, { members: [] }, []), true);
  assert.equal(canInviteToBoard({ ...user, isAdmin: true }, null, []), false);
});
test('negative: complete board grant is checked before either invitation mutation or mail', () => {
  const text = fs.readFileSync('server/models/settings.js', 'utf8');
  const at = text.indexOf('  async sendInvitation(');
  const body = text.slice(at, text.indexOf('\n  },', at));
  const gate = body.indexOf('canInviteToBoard(user, board, allowedRoles)');
  assert.ok(gate > 0);
  for (const write of ['buildReinviteModifier(', 'InvitationCodes.insertAsync(', 'sendInvitationEmail(']) {
    assert.ok(gate < body.indexOf(write), write);
  }
  assert.match(body, /for \(const boardId of new Set\(boards\)\)/);
  assert.match(body, /key: 'authz.invitation-boards'/);
});
