'use strict';
// Card dependencies ("Red Strings", #3392), #6732: who may see, edit and
// import them. Pure, so tests/dependencyAccess.test.cjs runs it without Meteor.
// The design is docs/Features/Editor/RedStrings/Board-And-My-Dependencies.md.
//
// - Showing or hiding dependencies is each user's OWN preference, in their
//   profile, off by default. It never changes what another user sees, and
//   anyone who can view a board may show its dependencies.
// - Board Dependencies are saved on the board's cards. A member whose role may
//   edit OR move cards may edit them - and import them. An assigned-only member
//   only on cards assigned to them, the cards they can see.
// - My Dependencies are saved in the user's profile; every user edits their
//   own, between cards they can see.
// - An import only ADDS lines that are not there yet; existing lines are kept
//   as they are.
const { memberCan } = require('./boardRoleCapabilities');
const { isAssignedOnlyMember } = require('./boardCardScope');

const MY_DEPENDENCIES_MAX = 5000;
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 128;

// Anyone who can view the board: an active member, or anyone on a public board.
function canViewBoard(board, userId) {
  if (!board || board.archived === true) return false;
  if (board.permission === 'public') return true;
  return text(userId) && Array.isArray(board.members) &&
    board.members.some(member => member && member.userId === userId && member.isActive === true);
}

function canEditBoardDependencies(board, userId) {
  if (!board || !text(userId)) return false;
  return memberCan(board.members, userId, 'write') || memberCan(board.members, userId, 'moveCard');
}

// May this user see this card at all (assigned-only members see their own)?
function canSeeCard(board, userId, card) {
  if (!canViewBoard(board, userId) || !card || card.boardId !== board._id || card.archived === true) return false;
  if (isAssignedOnlyMember(board, userId)) return Array.isArray(card.assignees) && card.assignees.includes(userId);
  return true;
}

// A Board Dependency is stored on its source card; both ends must be visible.
function canEditCardDependency(board, userId, sourceCard, targetCard) {
  return canEditBoardDependencies(board, userId) && canSeeCard(board, userId, sourceCard) &&
    (targetCard === undefined || canSeeCard(board, userId, targetCard));
}

// The one key of a dependency line, whichever layer it is in.
const lineKey = (boardId, fromId, toId) => `${boardId}\u0000${fromId}\u0000${toId}`;

// My Dependencies: [{ boardId, cardId, targetCardId, type, color, icon }].
function normalizeMyDependencies(list, normalizeDependency) {
  const seen = new Set(), result = [];
  for (const row of Array.isArray(list) ? list : []) {
    if (!row || !text(row.boardId) || !text(row.cardId) || !text(row.targetCardId) || row.cardId === row.targetCardId) continue;
    const key = lineKey(row.boardId, row.cardId, row.targetCardId);
    if (seen.has(key)) continue;
    seen.add(key);
    const dep = normalizeDependency({ cardId: row.targetCardId, type: row.type, color: row.color, icon: row.icon });
    result.push({ boardId: row.boardId, cardId: row.cardId, targetCardId: row.targetCardId,
      type: dep.type, color: dep.color, icon: dep.icon });
  }
  return result;
}

// Combine: keep every existing line, add only the incoming ones not yet there.
function mergeDependencyLines(existing, incoming, keyOf) {
  const keys = new Set(existing.map(keyOf));
  const added = [];
  let skipped = 0;
  for (const line of incoming) {
    const key = keyOf(line);
    if (keys.has(key)) { skipped++; continue; }
    keys.add(key);
    added.push(line);
  }
  return { added, skipped };
}

module.exports = { MY_DEPENDENCIES_MAX, canViewBoard, canEditBoardDependencies, canSeeCard, canEditCardDependency,
  lineKey, normalizeMyDependencies, mergeDependencyLines };
