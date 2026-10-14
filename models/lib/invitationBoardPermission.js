'use strict';
const { memberRoleOf, roleCan, CUSTOM_ROLE_PREFIX } = require('./boardRoleCapabilities');
function canInviteToBoard(user, board, allowedRoles) {
  if (!user || !board) return false;
  if (user.isAdmin) return true;
  const member = Array.isArray(board.members) && board.members.find(item => item.userId === user._id);
  const role = memberRoleOf(member);
  return roleMayInvite(role, allowedRoles);
}
// May a member with this role invite? A custom role (#3022) carries its own
// invite setting; the built-in roles take theirs from Admin Panel / People /
// Roles. Every invite path asks this, so the two cannot differ between paths.
function roleMayInvite(role, allowedRoles) {
  if (!role) return false;
  if (role.startsWith(CUSTOM_ROLE_PREFIX)) return roleCan(role, 'inviteToBoard');
  return Array.isArray(allowedRoles) && allowedRoles.includes(role);
}
module.exports = { canInviteToBoard, roleMayInvite };
