'use strict';

// Who a board's own timed work is recorded as and acts as: scheduled rules
// (server/scheduledRules.js), auto-archive (server/autoArchiveCards.js) and the
// attachment retention's soft delete (models/lib/attachmentRetention.js).
//
// They all used `board.createdBy`, but the Boards schema has no such field, so
// it was undefined on every board: a scheduled rule ran as nobody, and its
// "create card" action failed every time with "User ID is required in cards
// insertAsync". The board's first active admin is who answers for the board
// (an admin is never restricted by a list exception either); a board without
// one falls back to its first active member, and a board with no active member
// to nobody. Pure: tests/boardActor.test.cjs.
function boardActorId(board) {
  const members = board && Array.isArray(board.members) ? board.members : [];
  const active = members.filter(m => m && typeof m.userId === 'string' && m.userId && m.isActive === true);
  const admin = active.find(m => m.isAdmin === true);
  if (admin) return admin.userId;
  return active.length ? active[0].userId : null;
}

module.exports = { boardActorId };
