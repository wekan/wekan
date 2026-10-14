'use strict';

// #4178: a team or organization that gives board memberships also takes them
// away when the user leaves it - only the ones it gave (grantedBy), never a
// direct membership, and never a board's admin.
// Run: node tests/groupBoardMembership.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { grantOf, planGain, planLoss, updateFor, groupChanges } = require('../models/lib/groupBoardMembership');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const T = grantOf('team', 't1');
const T2 = grantOf('team', 't2');

test('gaining a team: a new member through it; a member through groups gains it; a direct member is untouched', () => {
  const push = planGain([], 'u', T);
  assert.equal(push.action, 'push');
  assert.deepEqual(push.entry.grantedBy, [T]);
  assert.equal(push.entry.isActive, true);
  assert.equal(push.entry.isAdmin, false);
  assert.deepEqual(planGain([{ userId: 'u', isActive: true, grantedBy: [T2] }], 'u', T), { action: 'addGrant', index: 0 });
  assert.deepEqual(planGain([{ userId: 'u', isActive: false, grantedBy: [] }], 'u', T), { action: 'addGrant', index: 0 },
    'deactivated by losing its groups: a group brings it back');
  assert.deepEqual(planGain([{ userId: 'u', isActive: true }], 'u', T), { action: 'none' }, 'direct');
  assert.deepEqual(planGain([{ userId: 'u', isActive: false }], 'u', T), { action: 'none' }, 'removed by a board admin: final');
  assert.deepEqual(planGain([{ userId: 'u', isActive: true, grantedBy: [T] }], 'u', T), { action: 'none' }, 'already');
});

test('losing a team: only what it gave; the last group deactivates; a board admin stays', () => {
  assert.deepEqual(planLoss([{ userId: 'u', isActive: true, grantedBy: [T, T2] }], 'u', T), { action: 'pullGrant', index: 0 });
  assert.deepEqual(planLoss([{ userId: 'u', isActive: true, grantedBy: [T] }], 'u', T), { action: 'deactivate', index: 0 });
  assert.deepEqual(planLoss([{ userId: 'u', isActive: true, isAdmin: true, grantedBy: [T] }], 'u', T), { action: 'makeDirect', index: 0 });
  // Negative: what a team did not give, it does not take.
  assert.deepEqual(planLoss([{ userId: 'u', isActive: true }], 'u', T), { action: 'none' }, 'direct membership');
  assert.deepEqual(planLoss([{ userId: 'u', isActive: true, grantedBy: [T2] }], 'u', T), { action: 'none' }, 'another team');
  assert.deepEqual(planLoss([], 'u', T), { action: 'none' });
});

test('the updates: deactivation keeps the entry (empty grantedBy), never a members overwrite', () => {
  assert.deepEqual(updateFor({ action: 'deactivate', index: 2 }, T),
    { $set: { 'members.2.isActive': false, 'members.2.grantedBy': [] } });
  assert.deepEqual(updateFor({ action: 'pullGrant', index: 1 }, T), { $pull: { 'members.1.grantedBy': T } });
  assert.deepEqual(updateFor({ action: 'makeDirect', index: 0 }, T), { $unset: { 'members.0.grantedBy': '' } });
  assert.equal(updateFor({ action: 'none' }, T), null);
  assert.deepEqual(groupChanges([{ teamId: 'a' }, { teamId: 'b' }], [{ teamId: 'b' }, { teamId: 'c' }], 'teamId'), { gained: ['c'], lost: ['a'] });
});

test('every way in records where a membership came from, and a board admin\'s own choice makes it direct', () => {
  const users = read('server/models/users.js');
  assert.match(users, /if \(updateData\.orgs !== undefined\) \{\n\s+await syncUserOrgBoards\(targetUserId, targetUser\.orgs, updateData\.orgs\);/);
  assert.match(read('server/propagateOrgTeamMembers.js'), /planGain\(members, userId, grant\)/);
  assert.match(read('server/models/boards.js'), /reconcileBoardTeamMembers\(board\.members, membersArray, id => /);
  const boards = read('models/boards.js');
  assert.match(boards, /\$set: \{ \[`members\.\$\{memberIndex\}\.isActive`\]: true \},\n\s+\$unset: \{ \[`members\.\$\{memberIndex\}\.grantedBy`\]: '' \},/, 'addMember');
  assert.match(boards, /\/\/ A board admin's removal is final \(#4178\): no team brings them back\.\n\s+\$unset: \{ \[`members\.\$\{memberIndex\}\.grantedBy`\]: '' \},/, 'removeMember');
  assert.match(boards, /'members\.\$\.grantedBy': \{/, 'schema');
});
