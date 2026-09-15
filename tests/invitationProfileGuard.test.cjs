'use strict';
// Hall of Fame regression coverage: InviteProfileBleed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const text = fs.readFileSync('models/users.js', 'utf8');
const start = text.indexOf('export const USER_UPDATE_ALLOWED_EXACT');
const end = text.indexOf('// Custom MongoDB engine', start);
const context = {};
vm.runInNewContext(text.slice(start, end).replace(/export /g, '') + '\nthis.forbidden = hasForbiddenUserUpdateField; this.allowed = isUserUpdateAllowed;', context);
test('client cannot plant invitation capabilities through leaf, array or parent replacement', () => {
  for (const fields of [['profile.invitedBoards'], ['profile.invitedBoards.0'], ['profile'], ['profile.invitedBoards', 'profile.language']]) {
    assert.equal(context.forbidden(fields), true);
  }
  assert.equal(context.forbidden(['profile'], { $set: { 'profile.language': 'fi' } }), false);
  assert.equal(context.forbidden(['profile'], { $addToSet: { 'profile.invitedBoards': 'B' } }), true);
  assert.equal(context.forbidden(['profile'], { $rename: { 'profile.notes': 'profile.invitedBoards' } }), true);
  for (const fields of [['profile.language'], ['profile.calendar'], ['username']]) {
    assert.equal(context.forbidden(fields), false);
    assert.equal(context.allowed(fields), true);
  }
});
test('negative: both user collection permission gates reject forbidden invitation writes', () => {
  const permissions = fs.readFileSync('server/permissions/users.js', 'utf8');
  assert.equal((permissions.match(/hasForbiddenUserUpdateField\(fields, modifier\)/g) || []).length, 2);
  assert.match(permissions, /key: 'authz.invitation-profile'/);
  assert.match(permissions, /catch \(e\).*logging must never break the guard/);
});
