'use strict';

// Pure helpers deciding which boards may be picked as a destination in the
// IFTTT-Rules "move card to the board" / "link card to the board" selectors.
// Extracted from client/components/rules/actions/boardActions.js so the choice
// is unit-testable without Meteor.
//
// #5698 (Impossible to select other board in rules): the board dropdown used to
// filter the (already access-scoped) client cache with `'members.userId': me`,
// i.e. it only kept boards where the user has a DIRECT member entry. A user who
// reaches a board through an Organization, Team or email-domain share — but is
// not listed individually in board.members — got an EMPTY dropdown (not even the
// current board showed up), while a colleague who was a direct member saw the
// boards. This mirrors the board-list publication / Boards.userBoards() rule:
// public OR active member OR active org OR active team OR active domain.

function hasActive(list, predicate) {
  return Array.isArray(list) && list.some(entry => entry && predicate(entry));
}

// Does `board` match `ctx`'s visibility? ctx = { userId, orgIds, teamIds,
// emailDomains } — the last three are plain id arrays (empty when absent).
function boardVisibleToUserContext(board, ctx) {
  if (!board || !ctx) return false;
  if (board.permission === 'public') return true;
  if (hasActive(board.members, m => m.userId === ctx.userId && !!m.isActive)) {
    return true;
  }
  const inSet = (list, key, ids) =>
    Array.isArray(ids) &&
    hasActive(list, entry => !!entry.isActive && ids.includes(entry[key]));
  if (inSet(board.orgs, 'orgId', ctx.orgIds)) return true;
  if (inSet(board.teams, 'teamId', ctx.teamIds)) return true;
  if (inSet(board.domains, 'domain', ctx.emailDomains)) return true;
  return false;
}

// May this board appear in the rules board selector for `ctx`?
// Excludes archived boards, non-'board' types (e.g. template containers), the
// user's own templates board, and internal caret-wrapped helper boards
// (`^Subtasks^` etc.), then requires the board to be visible to the user.
function canSelectBoardInRules(board, ctx, templatesBoardId) {
  if (!board || !ctx) return false;
  if (board.archived) return false;
  if (board.type && board.type !== 'board') return false;
  if (typeof board.title === 'string' && /^\^.*\^$/.test(board.title)) {
    return false;
  }
  if (templatesBoardId && board._id === templatesBoardId) return false;
  return boardVisibleToUserContext(board, ctx);
}

module.exports = { canSelectBoardInRules, boardVisibleToUserContext };
