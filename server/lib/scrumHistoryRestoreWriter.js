const { sha256, canonical, hashHistoryRow, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');

// Only restoration events: ordinary edits retain the model's best-effort writer
// and redo invalidation. The caller retains its recovery journal until this
// strict writer has acknowledged the exact event for each affected author.
async function recordScrumRestoreOnce(history, options) {
  const { boardId, batchId, userId, entityType, entityId, restoredFromId, restoredByUserId } = options;
  if (![boardId, batchId, userId, entityType, entityId, restoredFromId, restoredByUserId]
    .every(value => typeof value === 'string' && value.length > 0) || options.changeType !== 'restored') {
    throw new Error('Invalid Scrum History restoration identity');
  }
  const event = {
    boardId, swimlaneId: options.swimlaneId ?? null, listId: options.listId ?? null,
    cardId: options.cardId ?? null, entityType, entityId, group: options.group ?? null,
    changeType: 'restored', previousContent: options.previousContent ?? null,
    newContent: options.newContent ?? null, userId, batchId, restoredFromId,
    restoredByUserId, isCheckpoint: options.isCheckpoint ?? false,
  };
  const id = `scrum-restore-${sha256(canonical([boardId, batchId, userId]))}`;
  const matches = row => {
    if (!rowHashIsValid(row) || Object.keys(event).some(key => canonical(row[key]) !== canonical(event[key]))) {
      throw new Error('Conflicting Scrum History restoration record');
    }
    return row._id;
  };
  // Pre-upgrade journals used random row IDs. Validate those too, without
  // rewriting their timestamp or chain link, before acknowledging the journal.
  const existing = await history.findOneAsync({ boardId, batchId, userId });
  if (existing) return matches(existing);
  const previous = await history.findOneAsync(
    { boardId, integrityHash: { $nin: [null, ''] } }, { sort: { createdAt: -1 } });
  const row = { ...event, _id: id, createdAt: new Date(), undone: false, undoneAt: null,
    superseded: false, previousHash: previous?.integrityHash ?? null };
  row.integrityHash = hashHistoryRow(row);
  try {
    return await history.insertAsync(row);
  } catch (error) {
    // A lost insert acknowledgement or a concurrent retry can both leave the
    // intended row committed. Neither permits accepting another event's data.
    const committed = await history.findOneAsync(id);
    if (committed) return matches(committed);
    throw error;
  }
}
module.exports = { recordScrumRestoreOnce };
