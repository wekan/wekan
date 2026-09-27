'use strict';
const { isAssignedOnlyMember } = require('./boardCardScope');

// Board-wide exporters read related records without assignment filters. Board
// visibility therefore is insufficient for assigned-only members. The
// Scrum chart loaders explicitly scope cards and snapshots to the requester.
function canExportBoardData(board, user, chartKey = null) {
  if (!board || !board.isVisibleBy(user)) return false;
  if (!isAssignedOnlyMember(board, user?._id)) return true;
  return ['scrumVelocity', 'scrumSprint', 'scrumDaily'].includes(chartKey);
}
module.exports = { canExportBoardData };
