'use strict';

// Plain-Node unit test (no Meteor) for models/lib/teamBoardMemberSync.js.
// Run: node tests/teamBoardMemberSync.test.cjs
//
// Regression guard for #4593 ("The new added user that was assigned to
// existing team cannot be applied to kanban with the right authority"):
// assigning a team to a board (addBoardTeamPopup) adds the team's CURRENT
// users to board.members, but a user added to the team afterwards never got a
// member entry — publications let them view the board while every authority
// gate (board.hasMember, allowIsBoardMember*, Attachments.protected,
// board.isVisibleBy for export) only looks at board.members. The helpers under
// test decide which boards a user must be added to when their teams change.

const assert = require('assert');
const {
  teamIdsOf,
  gainedTeamIds,
  newTeamBoardMemberEntry,
  boardsToAddMemberTo,
} = require('../models/lib/teamBoardMemberSync');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const teamA = { teamId: 'teamA', teamDisplayName: 'Team A' };
const teamB = { teamId: 'teamB', teamDisplayName: 'Team B' };

// A board that team A was assigned to; its then-current members are admin+bob.
const boardSharedWithTeamA = {
  _id: 'boardB',
  type: 'board',
  teams: [{ teamId: 'teamA', teamDisplayName: 'Team A', isActive: true }],
  members: [
    { userId: 'admin', isAdmin: true, isActive: true },
    { userId: 'bob', isAdmin: false, isActive: true },
  ],
};

// --- gainedTeamIds -----------------------------------------------------------

test('gainedTeamIds reports the newly added team', () => {
  assert.deepStrictEqual(gainedTeamIds([], [teamA]), ['teamA']);
  assert.deepStrictEqual(gainedTeamIds([teamA], [teamA, teamB]), ['teamB']);
});

test('gainedTeamIds reports nothing when teams are unchanged or removed', () => {
  assert.deepStrictEqual(gainedTeamIds([teamA], [teamA]), []);
  // Removal must NOT be reported (team-loss cleanup stays an explicit action).
  assert.deepStrictEqual(gainedTeamIds([teamA, teamB], [teamA]), []);
});

test('gainedTeamIds tolerates undefined/malformed team lists', () => {
  assert.deepStrictEqual(gainedTeamIds(undefined, undefined), []);
  assert.deepStrictEqual(gainedTeamIds(null, [teamA]), ['teamA']);
  assert.deepStrictEqual(
    gainedTeamIds([], [null, {}, { teamId: '' }, teamA, teamA]),
    ['teamA'],
  );
});

test('teamIdsOf de-duplicates and skips entries without a teamId', () => {
  assert.deepStrictEqual(teamIdsOf([teamA, teamA, {}, null, teamB]), [
    'teamA',
    'teamB',
  ]);
  assert.deepStrictEqual(teamIdsOf('not-an-array'), []);
});

// --- newTeamBoardMemberEntry --------------------------------------------------

test('a team-derived member is a plain active non-admin member', () => {
  assert.deepStrictEqual(newTeamBoardMemberEntry('carol'), {
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

// --- POSITIVE (#4593): late team joiner gains membership of the team's board --

test('user gaining the team is added to the board that team is assigned to', () => {
  const ids = boardsToAddMemberTo([boardSharedWithTeamA], 'carol', ['teamA']);
  assert.deepStrictEqual(ids, ['boardB']);
});

test('user gaining one of several teams is added to all matching boards only', () => {
  const otherBoard = {
    _id: 'otherBoard',
    type: 'board',
    teams: [{ teamId: 'teamB', teamDisplayName: 'Team B', isActive: true }],
    members: [{ userId: 'admin', isAdmin: true, isActive: true }],
  };
  const unrelatedBoard = {
    _id: 'unrelated',
    type: 'board',
    teams: [{ teamId: 'teamC', teamDisplayName: 'Team C', isActive: true }],
    members: [{ userId: 'admin', isAdmin: true, isActive: true }],
  };
  const ids = boardsToAddMemberTo(
    [boardSharedWithTeamA, otherBoard, unrelatedBoard],
    'carol',
    ['teamA', 'teamB'],
  );
  assert.deepStrictEqual(ids.sort(), ['boardB', 'otherBoard']);
});

// --- NEGATIVE: existing member entries are never touched ----------------------

test('a user who is already a member is not re-added', () => {
  const ids = boardsToAddMemberTo([boardSharedWithTeamA], 'bob', ['teamA']);
  assert.deepStrictEqual(ids, []);
});

test('a deactivated member entry is left alone (explicit decision wins)', () => {
  const board = {
    ...boardSharedWithTeamA,
    members: [
      { userId: 'admin', isAdmin: true, isActive: true },
      { userId: 'carol', isAdmin: false, isActive: false }, // deactivated
    ],
  };
  const ids = boardsToAddMemberTo([board], 'carol', ['teamA']);
  assert.deepStrictEqual(ids, []);
});

// --- NEGATIVE: inactive team assignment does not grant membership -------------

test('an inactive board-team assignment grants nothing', () => {
  const board = {
    ...boardSharedWithTeamA,
    teams: [{ teamId: 'teamA', teamDisplayName: 'Team A', isActive: false }],
  };
  const ids = boardsToAddMemberTo([board], 'carol', ['teamA']);
  assert.deepStrictEqual(ids, []);
});

// --- NEGATIVE: unrelated teams grant nothing -----------------------------------

test('gaining an unrelated team grants nothing', () => {
  const ids = boardsToAddMemberTo([boardSharedWithTeamA], 'carol', ['teamB']);
  assert.deepStrictEqual(ids, []);
});

// --- NEGATIVE (#5850): template boards use group-only sharing ------------------

test('template boards and containers are skipped', () => {
  const templateBoard = { ...boardSharedWithTeamA, _id: 't1', type: 'template-board' };
  const templateContainer = {
    ...boardSharedWithTeamA,
    _id: 't2',
    type: 'template-container',
  };
  const ids = boardsToAddMemberTo(
    [templateBoard, templateContainer],
    'carol',
    ['teamA'],
  );
  assert.deepStrictEqual(ids, []);
});

// --- NEGATIVE: malformed input never throws ------------------------------------

test('malformed boards/args yield an empty result without throwing', () => {
  assert.deepStrictEqual(boardsToAddMemberTo(undefined, 'carol', ['teamA']), []);
  assert.deepStrictEqual(boardsToAddMemberTo([boardSharedWithTeamA], '', ['teamA']), []);
  assert.deepStrictEqual(boardsToAddMemberTo([boardSharedWithTeamA], 'carol', []), []);
  assert.deepStrictEqual(
    boardsToAddMemberTo(
      [null, {}, { _id: 'noTeams', type: 'board', members: [] }],
      'carol',
      ['teamA'],
    ),
    [],
  );
});

console.log(`\n${passed} tests passed`);
