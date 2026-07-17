'use strict';

// Pure decision logic for keeping board memberships in sync when a user's
// teams change. Extracted so it is unit-testable without Meteor
// (see tests/teamBoardMemberSync.test.cjs).
//
// #4593 ("The new added user that was assigned to existing team cannot be
// applied to kanban with the right authority"): when a team is assigned to a
// board through the board sidebar (addBoardTeamPopup), every user who is in
// the team AT THAT MOMENT is pushed into board.members as a normal member.
// But a user added to the team AFTERWARDS never got a member entry: the
// publications grant them read visibility of the board (boards / board
// publications match `teams.teamId`), yet every authority check that gates
// interaction — board.hasMember() (models/boards.js), allowIsBoardMember*()
// (server/lib/utils.js), Attachments.protected (models/attachments.server.js)
// and board.isVisibleBy() (export) — only looks at board.members. So the new
// team member could at best view the board read-only, could not download its
// attachments, and had strictly less authority than teammates who happened to
// be in the team when it was assigned.
//
// These helpers compute, from a user's old and new team lists, which boards
// must gain the user as a member so a late-joining team member ends up with
// the same authority the team's original members received.

// Return the de-duplicated teamId strings of a user.teams-shaped array
// (`[{ teamId, teamDisplayName }, ...]`). Tolerates a missing/invalid list and
// entries without a teamId.
function teamIdsOf(teams) {
  if (!Array.isArray(teams)) return [];
  const ids = [];
  const seen = new Set();
  teams.forEach(team => {
    const id = team && team.teamId;
    if (!id || typeof id !== 'string' || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
}

// Team ids present in newTeams but not in oldTeams — the teams the user just
// gained. Removals are intentionally NOT reported: a user removed from a team
// may also have been invited to a board individually, and membership data
// cannot tell those apart, so team-loss cleanup stays the explicit board-admin
// action it always was (removeBoardTeamPopup).
function gainedTeamIds(oldTeams, newTeams) {
  const before = new Set(teamIdsOf(oldTeams));
  return teamIdsOf(newTeams).filter(id => !before.has(id));
}

// The member entry a team-derived user receives: a plain active, non-admin
// member, exactly like the entries addBoardTeamPopup creates and with the
// same fully-defaulted flags reconcileBoardTeamMembers assigns to members
// introduced through the team-management path.
function newTeamBoardMemberEntry(userId) {
  return {
    userId,
    isAdmin: false,
    isActive: true,
    isNoComments: false,
    isCommentOnly: false,
    isWorker: false,
    isNormalAssignedOnly: false,
    isCommentAssignedOnly: false,
    isReadOnly: false,
    isReadAssignedOnly: false,
  };
}

// Given the candidate board documents (each with at least _id, type, teams,
// members), the user id and the team ids the user just gained, return the ids
// of the boards the user must be added to as a member:
//   - the board must have one of the gained teams assigned AND active,
//   - template boards/containers are skipped (#5850: sharing on those is
//     group-only; the members tab shows only the creator),
//   - a user with ANY existing member entry (even inactive) is left untouched,
//     so an explicit per-board decision (e.g. a deactivated member) is never
//     silently overridden by a team change.
function boardsToAddMemberTo(boards, userId, gainedIds) {
  if (!userId || typeof userId !== 'string') return [];
  if (!Array.isArray(boards) || !Array.isArray(gainedIds) || !gainedIds.length) {
    return [];
  }
  const gained = new Set(gainedIds);
  const ids = [];
  boards.forEach(board => {
    if (!board || !board._id) return;
    if (board.type === 'template-board' || board.type === 'template-container') {
      return;
    }
    const teams = Array.isArray(board.teams) ? board.teams : [];
    const sharedWithGainedTeam = teams.some(
      team => team && team.isActive === true && gained.has(team.teamId),
    );
    if (!sharedWithGainedTeam) return;
    const members = Array.isArray(board.members) ? board.members : [];
    if (members.some(member => member && member.userId === userId)) return;
    ids.push(board._id);
  });
  return ids;
}

module.exports = {
  teamIdsOf,
  gainedTeamIds,
  newTeamBoardMemberEntry,
  boardsToAddMemberTo,
};
