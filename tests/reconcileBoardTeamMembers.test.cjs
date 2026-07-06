'use strict';

// Plain-Node unit test (no Meteor) for reconcileBoardTeamMembers().
// Run: node tests/reconcileBoardTeamMembers.test.cjs
//
// Regression guard for #5730 ("Board disappeared after adding another user"):
// setBoardTeams used to blindly overwrite board.members with the array sent by
// the client. When that client's board document was stale (e.g. a member had
// just been added via inviteUserToBoard on the server), the overwrite silently
// dropped members — and in the worst case the board's own admin — which made the
// whole board vanish from that user's board list, with no removeBoardMember
// activity logged. The reconciler must NEVER let a stale/partial client array
// drop an active admin, and must report intentional non-admin removals so they
// can be logged/cleaned up instead of vanishing silently.

const assert = require('assert');
const {
  reconcileBoardTeamMembers,
} = require('../models/lib/reconcileBoardTeamMembers');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const admin = {
  userId: 'admin',
  isAdmin: true,
  isActive: true,
  isNoComments: false,
  isCommentOnly: false,
  isWorker: false,
};
const bob = {
  userId: 'bob',
  isAdmin: false,
  isActive: true,
  isNoComments: false,
  isCommentOnly: false,
  isWorker: false,
};

const ids = list => list.map(m => m.userId).sort();

// --- POSITIVE: adding a team's users keeps existing + appends new -----------
test('adding a team user keeps the admin and appends the new user', () => {
  const { members, removedMemberIds } = reconcileBoardTeamMembers(
    [admin],
    [admin, { userId: 'carol', isAdmin: false, isActive: true }],
  );
  assert.deepStrictEqual(ids(members), ['admin', 'carol']);
  assert.deepStrictEqual(removedMemberIds, []);
  // The admin entry is preserved verbatim from the authoritative array.
  assert.strictEqual(members.find(m => m.userId === 'admin'), admin);
  // The new member gets fully-defaulted flags.
  const carol = members.find(m => m.userId === 'carol');
  assert.deepStrictEqual(carol, {
    userId: 'carol',
    isAdmin: false,
    isActive: true,
    isNoComments: false,
    isCommentOnly: false,
    isWorker: false,
    isNormalAssignedOnly: false,
    isCommentAssignedOnly: false,
    isReadOnly: false,
    isReadAssignedOnly: false,
  });
});

// --- POSITIVE: leaving a team removes the intended non-admin member ---------
test('leaving a team removes the omitted non-admin and reports it', () => {
  const { members, removedMemberIds } = reconcileBoardTeamMembers(
    [admin, bob],
    [admin],
  );
  assert.deepStrictEqual(ids(members), ['admin']);
  assert.deepStrictEqual(removedMemberIds, ['bob']);
});

// --- POSITIVE: a stale client cannot change an existing member's permissions -
test('existing member keeps its authoritative entry, not the client copy', () => {
  const clientBob = { ...bob, isAdmin: true }; // client tries to promote bob
  const { members } = reconcileBoardTeamMembers([admin, bob], [admin, clientBob]);
  const resultBob = members.find(m => m.userId === 'bob');
  assert.strictEqual(resultBob, bob); // server entry, still non-admin
  assert.strictEqual(resultBob.isAdmin, false);
});

// --- NEGATIVE (regression #5730): stale client omits the admin --------------
test('stale client omitting the admin does NOT drop the admin', () => {
  // Server truth is [admin, bob]; the client only knows about bob (its board
  // doc was stale). Blindly trusting it would drop the admin and the board would
  // vanish for them.
  const { members, removedMemberIds } = reconcileBoardTeamMembers(
    [admin, bob],
    [bob],
  );
  assert.ok(
    members.some(m => m.userId === 'admin' && m.isActive && m.isAdmin),
    'active admin must survive a stale client array',
  );
  assert.ok(
    !removedMemberIds.includes('admin'),
    'admin must never be reported as removed',
  );
});

// --- NEGATIVE (regression #5730): empty/undefined client array (worst case) --
test('empty client array still preserves the admin', () => {
  const { members, removedMemberIds } = reconcileBoardTeamMembers([admin, bob], []);
  assert.ok(members.some(m => m.userId === 'admin' && m.isActive && m.isAdmin));
  assert.ok(!removedMemberIds.includes('admin'));
  assert.deepStrictEqual(removedMemberIds, ['bob']);
});

test('undefined args do not throw and yield empty result', () => {
  const { members, removedMemberIds } = reconcileBoardTeamMembers(undefined, undefined);
  assert.deepStrictEqual(members, []);
  assert.deepStrictEqual(removedMemberIds, []);
});

// --- NEGATIVE (regression #5730): stale client tries to deactivate the admin -
test('client cannot deactivate or demote the admin through this path', () => {
  const downgradedAdmin = { userId: 'admin', isAdmin: false, isActive: false };
  const { members, removedMemberIds } = reconcileBoardTeamMembers(
    [admin],
    [downgradedAdmin],
  );
  const resultAdmin = members.find(m => m.userId === 'admin');
  assert.strictEqual(resultAdmin, admin); // authoritative entry wins
  assert.strictEqual(resultAdmin.isActive, true);
  assert.strictEqual(resultAdmin.isAdmin, true);
  assert.deepStrictEqual(removedMemberIds, []);
});

console.log(`\n${passed} tests passed`);
