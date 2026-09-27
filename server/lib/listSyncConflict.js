const { createHash } = require('node:crypto');
const { compareSyncCardIds } = require('../../models/lib/listSyncTextMerge');

function describeSyncConflict(conflict, card, task, list, sourceKey, cards = []) {
  if (conflict.field === 'syncExternalId') {
    const group = cards.filter(row => String(row.syncExternalId) === conflict.externalId).sort(compareSyncCardIds);
    if (!card || group.length < 2 || group[0]._id === card._id) return conflict;
    const fingerprint = createHash('sha256').update(JSON.stringify([
      list._id, list.boardId, list.syncRevision, sourceKey, conflict.cardId,
      conflict.externalId, conflict.field, group,
    ])).digest('hex');
    const text = row => [row.title || '', row.description || ''].filter(Boolean).join('\n\n');
    return { ...conflict, duplicate: true, local: text(card), retained: text(group[0]), fingerprint };
  }
  if (!['title', 'description', 'spentTime'].includes(conflict.field) || !card || !task) return conflict;
  const field = conflict.field;
  const local = card[field], incoming = task[field];
  const fingerprint = createHash('sha256').update(JSON.stringify([
    list._id, list.boardId, list.syncRevision, sourceKey, conflict.cardId,
    conflict.externalId, field, local, incoming, card.syncLastSource,
    card.archived, Object.hasOwn(card, field),
  ])).digest('hex');
  return { ...conflict, local: local ?? '', incoming: incoming ?? '', fingerprint };
}

function planSyncConflictResolution(conflicts, cards, tasks, list, sourceKey, resolution) {
  const conflict = conflicts.find(row => row.cardId === resolution.cardId && row.field === resolution.field);
  const card = cards.find(row => row._id === resolution.cardId);
  const task = conflict && tasks.find(row => String(row.externalId) === conflict.externalId);
  const preview = conflict && describeSyncConflict(conflict, card, task, list, sourceKey, cards);
  if (preview?.duplicate) {
    if (preview.fingerprint !== resolution.fingerprint || resolution.choice !== 'detach') return null;
    return { card, changes: {}, unset: { syncExternalId: '', syncSourceType: '', syncSourceKey: '', syncLastSource: '' } };
  }
  if (!preview?.fingerprint || preview.fingerprint !== resolution.fingerprint ||
      !['local', 'source'].includes(resolution.choice)) return null;
  return { card, changes: {
    syncLastSource: { ...(card.syncLastSource || {}), [resolution.field]: task[resolution.field] },
    ...(resolution.choice === 'source' ? { [resolution.field]: task[resolution.field] } : {}),
  } };
}

module.exports = { describeSyncConflict, planSyncConflictResolution };
