'use strict';

// Plain-Node test (no Meteor) for #4593 ("The new added user that was assigned
// to existing team cannot be applied to kanban with the right authority"):
// assigning a team to a board adds the team's CURRENT users to board.members,
// but a user added to the team afterwards never got a member entry - and every
// authority gate looks at board.members. A user's team change must therefore
// add them to the boards that team is assigned to.
//
// The decision is models/lib/groupBoardMembership.js (since #4178 a team also
// takes back what it gave); it replaced models/lib/teamBoardMemberSync.js,
// which this test used to exercise although the app no longer ran it. The same
// scenarios now run against the code the server uses.
// Run: node tests/teamBoardMemberSync.test.cjs

const assert = require('assert');
const { groupChanges, planGain, grantOf } = require('../models/lib/groupBoardMembership');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const teamA = { teamId: 'teamA', teamDisplayName: 'Team A' };
const teamB = { teamId: 'teamB', teamDisplayName: 'Team B' };
const grantA = grantOf('team', 'teamA');
const boardMembers = [
  { userId: 'admin', isAdmin: true, isActive: true },
  { userId: 'bob', isAdmin: false, isActive: true },
];

// --- which teams were gained ------------------------------------------------
test('a newly added team is gained', () => {
  assert.deepStrictEqual(groupChanges([teamA], [teamA, teamB], 'teamId').gained, ['teamB']);
});
test('nothing is gained when teams are unchanged or removed', () => {
  assert.deepStrictEqual(groupChanges([teamA, teamB], [teamA, teamB], 'teamId').gained, []);
  assert.deepStrictEqual(groupChanges([teamA, teamB], [teamA], 'teamId').gained, []);
});
test('undefined or malformed team lists are tolerated', () => {
  assert.deepStrictEqual(groupChanges(undefined, [teamA], 'teamId').gained, ['teamA']);
  assert.deepStrictEqual(groupChanges([teamA], undefined, 'teamId').gained, []);
  assert.deepStrictEqual(groupChanges([null, {}, teamA], [teamA, { teamId: '' }, teamA], 'teamId').gained, []);
});

// --- what joining through a team gives ---------------------------------------
test('a user gaining the team becomes a plain active non-admin member of its board', () => {
  const plan = planGain(boardMembers, 'carol', grantA);
  assert.equal(plan.action, 'push');
  assert.equal(plan.entry.userId, 'carol');
  assert.equal(plan.entry.isActive, true);
  for (const flag of ['isAdmin', 'isNoComments', 'isCommentOnly', 'isWorker', 'isNormalAssignedOnly',
    'isCommentAssignedOnly', 'isReadOnly', 'isReadAssignedOnly']) assert.equal(plan.entry[flag], false, flag);
  assert.deepStrictEqual(plan.entry.grantedBy, [grantA]);
});
test('a user who is already a member is not re-added or changed', () => {
  assert.deepStrictEqual(planGain(boardMembers, 'bob', grantA), { action: 'none' });
  assert.deepStrictEqual(planGain(boardMembers, 'admin', grantA), { action: 'none' }, 'a board admin either');
});
test('a member a board admin deactivated stays deactivated (an explicit decision wins)', () => {
  assert.deepStrictEqual(planGain([{ userId: 'dave', isActive: false }], 'dave', grantA), { action: 'none' });
});

// --- which boards: the server's selector -------------------------------------
test('only boards the team is ACTIVELY assigned to, and never template boards', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'server', 'models', 'users.js'), 'utf8');
  const body = src.slice(src.indexOf('const syncUserGroupBoards ='));
  assert.match(body, /\{ \[field\]: \{ \$elemMatch: \{ \[idField\]: groupId, isActive: true \} \}, type: \{ \$nin: \['template-board', 'template-container'\] \} \}/);
});

// --- #4593 WIRING: the helper must actually be called on every team change -----
// The pure helper above is only useful if the server methods that CHANGE a
// user's teams invoke it. Guard both call sites so the fix cannot silently
// regress (e.g. a refactor dropping the call, which would reopen #4593).
const fs = require('fs');
const path = require('path');
const usersSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'users.js'),
  'utf8',
);

test('#4593 wiring: editUser adds the user to their newly-gained teams\' boards', () => {
  const start = usersSrc.indexOf('async editUser(');
  assert.ok(start > -1, 'editUser method must exist');
  const body = usersSrc.slice(start, start + 2000);
  assert.ok(/updateData\.teams !== undefined/.test(body),
    'editUser must detect a teams change');
  assert.ok(/addUserToTeamBoards\(targetUserId, targetUser\.teams, updateData\.teams\)/.test(body),
    'editUser must call addUserToTeamBoards with the old and new teams');
});

test('#4593 wiring: creating a user directly into team(s) also adds their boards', () => {
  // The admin "add user" path that seeds teams must propagate board membership too.
  assert.ok(/addUserToTeamBoards\(id, \[\], userTeamsArray\)/.test(usersSrc),
    'the create-with-teams path must call addUserToTeamBoards');
});

test('#4593 wiring: addUserToTeamBoards routes through the tested helper', () => {
  // Since #4178 a team gives AND takes memberships, so addUserToTeamBoards
  // is the team half of syncUserGroupBoards, which decides through the tested
  // groupBoardMembership helpers (tests/groupBoardMembership.test.cjs).
  assert.ok(/const addUserToTeamBoards = \(userId, oldTeams, newTeams\) => syncUserGroupBoards\(userId, 'team', oldTeams, newTeams\);/.test(usersSrc),
    'addUserToTeamBoards must be the team half of syncUserGroupBoards');
  const start = usersSrc.indexOf('const syncUserGroupBoards =');
  const body = usersSrc.slice(start, start + 2600);
  assert.ok(/groupChanges\(/.test(body) && /planGain\(/.test(body) && /planLoss\(/.test(body),
    'syncUserGroupBoards must use the tested decision logic');
});

console.log(`\n${passed} tests passed`);
