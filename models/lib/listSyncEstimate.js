'use strict';
const { normalizeJiraEstimateMapping } = require('./jiraEstimateMapping');
function invalid(message) {
  const error = new Error(message);
  error.code = 'sync-estimate-invalid';
  throw error;
}
function syncEstimateMapping(source, definition) {
  if (!source.fields?.includes('estimate')) return null;
  if (source.type !== 'jira' || !definition || definition.type !== 'number' ||
      definition._id !== source.estimateCustomFieldId) invalid('Select a mapped numeric Jira estimate field on this board.');
  let mapping;
  try { mapping = normalizeJiraEstimateMapping({ estimateFieldId: definition.settings?.jiraEstimateFieldId,
    estimateUnit: definition.settings?.jiraEstimateUnit }); }
  catch (_) { invalid('Invalid Jira estimate field mapping.'); }
  return { ...mapping, localFieldId: definition._id,
    identity: JSON.stringify([definition._id, mapping.estimateFieldId, mapping.estimateUnit]) };
}
function addSyncEstimates(tasks, raw, mapping) {
  if (!mapping) return tasks;
  const issues = Array.isArray(raw) ? raw : raw.issues || [];
  const values = new Map(issues.map(issue => [String(issue.key), issue.fields?.[mapping.estimateFieldId]]));
  return tasks.map(task => {
    const estimate = values.get(String(task.externalId));
    if (estimate === undefined) return task;
    if (estimate !== null && (typeof estimate !== 'number' || !Number.isFinite(estimate) || estimate < 0 || estimate > 1e12)) {
      invalid('Invalid Jira estimate: expected a nonnegative number or null.');
    }
    return { ...task, estimate };
  });
}
function cardSyncEstimate(card, mapping) {
  if (!mapping) return undefined;
  const values = (card.customFields || []).filter(field => field._id === mapping.localFieldId);
  if (values.length > 1) invalid('Duplicate local estimate field values.');
  const value = values[0]?.value ?? null;
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12)) {
    invalid('Invalid local numeric estimate.');
  }
  return value;
}
function estimateChanges(changes, card, mapping) {
  if (!Object.hasOwn(changes, 'estimate')) return changes;
  if (!mapping) invalid('Missing Sync estimate mapping.');
  const { estimate, ...result } = changes;
  const previous = card?.customFields || [];
  let customFields;
  if (estimate === null) customFields = previous.filter(field => field._id !== mapping.localFieldId);
  else if (previous.some(field => field._id === mapping.localFieldId)) {
    customFields = previous.map(field => field._id === mapping.localFieldId ? { ...field, value: estimate } : field);
  } else customFields = [...previous, { _id: mapping.localFieldId, value: estimate }];
  return { ...result, customFields };
}
module.exports = { syncEstimateMapping, addSyncEstimates, cardSyncEstimate, estimateChanges };
