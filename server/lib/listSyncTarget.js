const { createHash } = require('node:crypto');
const { listSyncCardId } = require('./listSyncCardId');

function nextSyncTargetId(previous) {
  return `sync-replacement-${createHash('sha256').update(JSON.stringify(['replacement', previous])).digest('hex')}`;
}

async function readSyncTarget(targets, listId, sourceKey, externalId) {
  const key = String(externalId);
  const baseId = listSyncCardId(listId, sourceKey, key);
  const row = await targets.findOneAsync({ _id: baseId });
  if (!row) return { baseId, targetId: baseId, listId, sourceKey, externalId: key };
  if (row.listId !== listId || row.sourceKey !== sourceKey || row.externalId !== key ||
      typeof row.previousTargetId !== 'string' || row.targetId !== nextSyncTargetId(row.previousTargetId)) {
    throw new Error('Invalid Sync replacement target.');
  }
  return { baseId, targetId: row.targetId, listId, sourceKey, externalId: key };
}

async function replaceSyncTarget(targets, expected) {
  const next = { _id: expected.baseId, listId: expected.listId, sourceKey: expected.sourceKey,
    externalId: expected.externalId, previousTargetId: expected.targetId,
    targetId: nextSyncTargetId(expected.targetId) };
  if (expected.targetId === expected.baseId) {
    try { await targets.insertAsync(next); }
    catch (error) { if (error.code === 11000) return false; throw error; }
    return true;
  }
  return !!await targets.updateAsync({ _id: expected.baseId, listId: expected.listId,
    sourceKey: expected.sourceKey, externalId: expected.externalId, targetId: expected.targetId },
  { $set: { previousTargetId: next.previousTargetId, targetId: next.targetId } });
}

function describeCreationConflict(list, sourceKey, target, task) {
  const fingerprint = createHash('sha256').update(JSON.stringify([
    list._id, list.boardId, list.syncRevision, sourceKey, target.targetId, task,
  ])).digest('hex');
  // Never include the colliding document: it may now be in a private board.
  return { cardId: target.targetId, externalId: String(task.externalId), field: 'creation', creation: true,
    local: [task.title || '', task.description || ''].filter(Boolean).join('\n\n'), fingerprint };
}

module.exports = { readSyncTarget, replaceSyncTarget, describeCreationConflict, nextSyncTargetId };
