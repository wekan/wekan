'use strict';

// May this board member read the WHOLE board through the REST API
// (Authentication.checkBoardAccess, server/authentication.js)? Those routes
// return every list, card, checklist and comment, so a member who may see only
// the cards assigned to them is refused (AssignedBleed sibling, 2026-10-02).
//
// The built-in roles keep their long-standing list. A custom role (#3022) is
// judged by what this check is for: whether it sees all cards.
const { memberRoleOf, roleCan, CUSTOM_ROLE_PREFIX } = require('./boardRoleCapabilities');

function memberReadsWholeBoard(member, userId) {
  if (!(member && member.userId === userId && member.isActive)) return false;
  const role = memberRoleOf(member);
  if (role && role.startsWith(CUSTOM_ROLE_PREFIX)) return roleCan(role, 'seesAllCards');
  return !member.isNoComments && !member.isCommentOnly && !member.isWorker &&
    !member.isNormalAssignedOnly && !member.isCommentAssignedOnly && !member.isReadAssignedOnly;
}

module.exports = { memberReadsWholeBoard };
