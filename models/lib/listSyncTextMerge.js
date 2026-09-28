'use strict';
const { exactFieldSelector } = require('./exactFieldSelector');

// All workers protect the same first mapping, independent of cursor order.
const compareSyncCardIds = (a, b) => a._id < b._id ? -1 : a._id > b._id ? 1 : 0;

// Compare selected scalar fields to the last accepted source values.
// Legacy cards without a baseline must first agree with the source; guessing
// would make an old local edit indistinguishable from an upstream change.
function planSyncTextMerge(tasks, cards, estimateMapping = null, timeMappings = {}) {
  const byId = new Map(), baselines = new Map(), conflicts = [];
  for (const card of [...cards].sort(compareSyncCardIds)) {
    if (!card.syncExternalId) continue;
    const id = String(card.syncExternalId);
    if (byId.has(id)) conflicts.push({ cardId: card._id, externalId: id, field: 'syncExternalId' });
    else byId.set(id, card);
  }
  if (conflicts.length) return { tasks, baselines, conflicts };
  const merged = tasks.map(task => {
    const card = byId.get(String(task.externalId));
    if (!card) return task;
    const result = { ...task }, baseline = { ...(card.syncLastSource || {}) };
    if (estimateMapping && baseline.estimateMapping !== estimateMapping.identity) {
      delete baseline.estimate;
      baseline.estimateMapping = estimateMapping.identity;
    }
    for (const [field, mapping] of Object.entries(timeMappings)) {
      if (baseline[`${field}Mapping`] !== mapping.identity) {
        delete baseline[field]; baseline[`${field}Mapping`] = mapping.identity;
      }
    }
    for (const field of ['title', 'description', 'spentTime', 'estimate', 'originalEstimate', 'remainingEstimate']) {
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
  const fields = ['title', 'description', 'spentTime', 'archived', 'syncExternalId', 'syncSourceType', 'syncSourceKey', 'syncLastSource'];
  if (['estimate', 'originalEstimate', 'remainingEstimate'].some(field => Object.hasOwn(card, field))) fields.push('customFields');
  Object.assign(selector, exactFieldSelector(card, fields));
  return selector;
}
function selectSyncTextFields(tasks, fields) {
  const wanted = new Set(fields === undefined ? ['title', 'description'] : fields);
  return tasks.map(task => {
    const selected = { ...task };
    for (const field of ['title', 'description', 'spentTime', 'estimate', 'originalEstimate', 'remainingEstimate']) if (!wanted.has(field)) delete selected[field];
    return selected;
  });
}
module.exports = { planSyncTextMerge, syncTextSelector, selectSyncTextFields, compareSyncCardIds };
