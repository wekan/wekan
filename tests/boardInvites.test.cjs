'use strict';

// Plain-Node unit test (no Meteor) for the board invitation accept / decline
// decision helpers. Run: node tests/boardInvites.test.cjs
//
// Regression guard for #4730 ("Bugs in adding and removing users"):
//
// Case 2 — "User A declines the invitation but still sees board 1 in the
// personal overview": the decline handler on the All Boards page calls
// `quitBoard` (deactivates the member entry) and then `acceptInvite` (to clear
// the invitation). The old server-side `acceptInvite` unconditionally set
// `members.$.isActive = true`, immediately re-activating the just-deactivated
// membership, so the declined board stayed in the user's overview.
//
// Case 1 fallout — "Adding and removing user A again doesn't fix it": the same
// unconditional re-activation let a member an admin had removed re-add
// themselves by calling `acceptInvite` directly.

const assert = require('assert');
const {
  isInvitedToBoard,
  planQuitBoard,
  planAcceptInvite,
} = require('../models/lib/boardInvites');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- isInvitedToBoard --------------------------------------------------------
test('isInvitedToBoard: true when profile.invitedBoards contains the board', () => {
  assert.strictEqual(
    isInvitedToBoard({ invitedBoards: ['b1', 'b2'] }, 'b1'),
    true,
  );
});

test('isInvitedToBoard: false when not invited / no profile / bad shapes', () => {
  assert.strictEqual(isInvitedToBoard({ invitedBoards: ['b2'] }, 'b1'), false);
  assert.strictEqual(isInvitedToBoard({}, 'b1'), false);
  assert.strictEqual(isInvitedToBoard(null, 'b1'), false);
  assert.strictEqual(isInvitedToBoard(undefined, 'b1'), false);
  assert.strictEqual(isInvitedToBoard({ invitedBoards: 'b1' }, 'b1'), false);
  assert.strictEqual(isInvitedToBoard({ invitedBoards: ['b1'] }, ''), false);
});

// --- planQuitBoard: POSITIVE -------------------------------------------------
test('a plain member quitting deactivates the membership', () => {
  const plan = planQuitBoard({ isMember: true, isInvited: false });
  assert.deepStrictEqual(plan, {
    ok: true,
    removeMember: true,
    pullInvite: false,
  });
});

test('#4730: declining (member + pending invite) deactivates AND clears the invite', () => {
  const plan = planQuitBoard({ isMember: true, isInvited: true });
  assert.deepStrictEqual(plan, {
    ok: true,
    removeMember: true,
    pullInvite: true,
  });
});

test('#4730: a stale invitation without a member entry can still be quit', () => {
  // e.g. an admin removed the user before they responded to the invite; the
  // old code threw error-board-notAMember and the invited board was stuck in
  // the personal overview forever.
  const plan = planQuitBoard({ isMember: false, isInvited: true });
  assert.deepStrictEqual(plan, {
    ok: true,
    removeMember: false,
    pullInvite: true,
  });
});

// --- planQuitBoard: NEGATIVE -------------------------------------------------
test('quitting a board one is neither member of nor invited to is an error', () => {
  const plan = planQuitBoard({ isMember: false, isInvited: false });
  assert.strictEqual(plan.ok, false);
  assert.strictEqual(plan.error, 'error-board-notAMember');
  assert.strictEqual(plan.removeMember, false);
  assert.strictEqual(plan.pullInvite, false);
});

// --- planAcceptInvite: POSITIVE ----------------------------------------------
test('accepting a real invitation activates the membership and clears the invite', () => {
  const plan = planAcceptInvite({ isInvited: true });
  assert.deepStrictEqual(plan, {
    ok: true,
    pullInvite: true,
    activateMember: true,
  });
});

// --- planAcceptInvite: NEGATIVE (the #4730 regression) -------------------------
test('#4730 regression: acceptInvite without an invitation must NOT activate membership', () => {
  // The old code set members.$.isActive = true unconditionally. This is what
  // re-activated a declined membership (decline = quitBoard + acceptInvite)
  // and let removed members re-add themselves.
  const plan = planAcceptInvite({ isInvited: false });
  assert.strictEqual(plan.ok, false);
  assert.strictEqual(
    plan.activateMember,
    false,
    'a user without a pending invitation must never be (re)activated',
  );
  assert.strictEqual(plan.pullInvite, false);
});

// --- End-to-end simulation of the decline flow --------------------------------
// Mirrors how server/models/boards.js applies the plans, driving the exact
// client sequence from client/components/boards/boardsList.js
// ('click .js-decline-invite'): quitBoard(boardId) then acceptInvite(boardId).
function makeWorld() {
  const world = {
    board: { members: [{ userId: 'userA', isActive: true }] },
    profile: { invitedBoards: ['board1'] },
  };
  world.memberOf = (userId) =>
    world.board.members.some((m) => m.userId === userId);
  world.activeMember = (userId) =>
    world.board.members.some((m) => m.userId === userId && m.isActive);
  world.quitBoard = (userId, boardId) => {
    const plan = planQuitBoard({
      isMember: world.memberOf(userId),
      isInvited: isInvitedToBoard(world.profile, boardId),
    });
    if (!plan.ok) throw new Error(plan.error);
    if (plan.pullInvite) {
      world.profile.invitedBoards = world.profile.invitedBoards.filter(
        (id) => id !== boardId,
      );
    }
    if (plan.removeMember) {
      world.board.members.forEach((m) => {
        if (m.userId === userId) m.isActive = false;
      });
    }
    return true;
  };
  world.acceptInvite = (userId, boardId) => {
    const plan = planAcceptInvite({
      isInvited: isInvitedToBoard(world.profile, boardId),
    });
    if (!plan.ok) return false;
    world.profile.invitedBoards = world.profile.invitedBoards.filter(
      (id) => id !== boardId,
    );
    world.board.members.forEach((m) => {
      if (m.userId === userId) m.isActive = true;
    });
    return true;
  };
  return world;
}

test('#4730 Case 2: decline flow (quitBoard then acceptInvite) leaves the member INACTIVE', () => {
  const world = makeWorld();
  // The All Boards decline handler sequence:
  assert.strictEqual(world.quitBoard('userA', 'board1'), true);
  world.acceptInvite('userA', 'board1'); // must now be a no-op
  assert.strictEqual(
    world.activeMember('userA'),
    false,
    'declined membership must stay deactivated (board leaves the personal overview)',
  );
  assert.deepStrictEqual(
    world.profile.invitedBoards,
    [],
    'the declined invitation must be removed from profile.invitedBoards',
  );
});

test('#4730 Case 1: a removed member cannot re-activate themselves via acceptInvite', () => {
  const world = makeWorld();
  world.profile.invitedBoards = []; // invite already consumed earlier (accepted)
  world.board.members[0].isActive = false; // admin removed the user
  assert.strictEqual(world.acceptInvite('userA', 'board1'), false);
  assert.strictEqual(
    world.activeMember('userA'),
    false,
    'a removed member without an invitation must stay removed',
  );
});

test('accept flow still works: invited user becomes an active member', () => {
  const world = makeWorld();
  world.board.members[0].isActive = false; // e.g. re-invited after removal
  world.profile.invitedBoards = ['board1'];
  assert.strictEqual(world.acceptInvite('userA', 'board1'), true);
  assert.strictEqual(world.activeMember('userA'), true);
  assert.deepStrictEqual(world.profile.invitedBoards, []);
});

console.log(`\n${passed} tests passed`);
