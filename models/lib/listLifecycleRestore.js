'use strict';

const { softDeleteSet, restoreModifier } = require('./softDelete');

// History replays the same list-and-cards operation as ordinary delete/restore.
// Never restore every deleted card in a list: only its deletion batch belongs
// to this operation. Previously deleted cards keep their independent state.
function listLifecyclePlan(list, row, content, now = new Date()) {
  if (!list || list.boardId !== row.boardId ||
      !content || typeof content.deleted !== 'boolean') return null;
  const batchId = content.deleteBatchId || list.deleteBatchId || row.batchId || row._id;
  const scope = { boardId: list.boardId, listId: list._id };
  if (content.deleted) {
    if (!batchId) return null;
    const at = content.deletedAt ? new Date(content.deletedAt) : now;
    if (!Number.isFinite(at.getTime())) return null;
    const modifier = { $set: softDeleteSet(row.userId, batchId, at) };
    return { modifier, cards: { ...scope, deletedAt: null } };
  }
  return {
    modifier: restoreModifier(),
    cards: batchId ? { ...scope, deleteBatchId: batchId } : null,
  };
}

module.exports = { listLifecyclePlan };
