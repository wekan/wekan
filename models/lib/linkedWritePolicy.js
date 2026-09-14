'use strict';
const { memberCan, memberRoleOf } = require('./boardRoleCapabilities');
function sourceRoleBlocksDelegation(userId, board) {
  const member = board && Array.isArray(board.members) && board.members.find(item => item.userId === userId);
  return Boolean(memberRoleOf(member) && !memberCan(board.members, userId, 'write'));
}
function recordLinkedWriteDenial(source) {
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.linked-write', action: 'blocked', source,
      detail: 'Linked-card write or link creation denied by the source board write policy.',
    });
  } catch (e) { /* logging must never break the guard */ }
}
module.exports = { sourceRoleBlocksDelegation, recordLinkedWriteDenial };
