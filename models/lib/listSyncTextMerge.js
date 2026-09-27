'use strict';

// Compare local text and incoming text to the last accepted source values.
// Legacy cards without a baseline must first agree with the source; guessing
// would make an old local edit indistinguishable from an upstream change.
function planSyncTextMerge(tasks, cards) {
  const byId = new Map(cards.map(card => [String(card.syncExternalId), card]));
  const baselines = new Map(), conflicts = [];
  const merged = tasks.map(task => {
    const card = byId.get(String(task.externalId));
    if (!card) return task;
    const result = { ...task }, baseline = { ...(card.syncLastSource || {}) };
    for (const field of ['title', 'description']) {
      if (task[field] === undefined) continue;
      const incoming = task[field], local = card[field];
      const known = Object.prototype.hasOwnProperty.call(baseline, field);
      if (local === incoming) baseline[field] = incoming;
      else if (known && local === baseline[field]) baseline[field] = incoming;
      else if (known && incoming === baseline[field]) result[field] = local;
      else conflicts.push({ cardId: card._id, externalId: String(task.externalId), field });
    }
    if (JSON.stringify(baseline) !== JSON.stringify(card.syncLastSource || {})) baselines.set(card._id, baseline);
    return result;
  });
  return { tasks: merged, baselines, conflicts };
}
function syncTextSelector(card, boardId, listId) {
  const selector = { _id: card._id, boardId, listId };
  for (const field of ['title', 'description', 'archived', 'syncExternalId', 'syncSourceType', 'syncLastSource']) {
    selector[field] = card[field] === undefined ? { $exists: false } : card[field];
  }
  return selector;
}
module.exports = { planSyncTextMerge, syncTextSelector };
