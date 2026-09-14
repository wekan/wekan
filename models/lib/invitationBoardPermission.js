'use strict';
const { memberRoleOf } = require('./boardRoleCapabilities');
function canInviteToBoard(user, board, allowedRoles) {
  if (!user || !board) return false;
  if (user.isAdmin) return true;
  const member = Array.isArray(board.members) && board.members.find(item => item.userId === user._id);
  const role = memberRoleOf(member);
  return Boolean(role && Array.isArray(allowedRoles) && allowedRoles.includes(role));
}
module.exports = { canInviteToBoard };
