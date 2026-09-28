'use strict';
const { cardSyncEstimate, estimateChanges } = require('./listSyncEstimate');
const TIME_FIELDS = {
  originalEstimate: { key: 'original', nested: 'originalEstimateSeconds', flat: 'timeoriginalestimate' },
  remainingEstimate: { key: 'remaining', nested: 'remainingEstimateSeconds', flat: 'timeestimate' },
};
function invalid(message) {
  const error = new Error(message); error.code = 'sync-time-estimate-invalid'; throw error;
}
function syncTimeMappings(source, definitions = [], estimateMapping = null) {
  const mappings = {};
  for (const [field, spec] of Object.entries(TIME_FIELDS)) {
    if (!source.fields?.includes(field)) continue;
    const matches = definitions.filter(definition => definition.type === 'number' && definition.settings?.jiraTimeField === spec.key);
    if (source.type !== 'jira' || matches.length !== 1) {
      invalid(`Sync ${field} requires exactly one imported Jira ${spec.key} time field on this board.`);
    }
    const localFieldId = matches[0]._id;
    if (typeof localFieldId !== 'string' || !localFieldId || localFieldId === estimateMapping?.localFieldId) invalid('Sync estimate mappings must use distinct valid local fields.');
    mappings[field] = { ...spec, localFieldId, identity: JSON.stringify([localFieldId, spec.key, 'hours']) };
  }
  return mappings;
}
const timeMappingIdentities = mappings => Object.fromEntries(Object.entries(mappings).map(([field, mapping]) => [field, mapping.identity]));
// Read selected raw numeric totals to preserve explicit null as a clear.
// Import normalization omits unavailable totals; Sync must distinguish that
// from a field deliberately cleared upstream. Never parse localized durations.
function addSyncTimeEstimates(tasks, raw, mappings) {
  const issues = new Map((Array.isArray(raw) ? raw : raw.issues || []).map(issue => [String(issue.key), issue.fields || {}]));
  return tasks.map(task => {
    const result = { ...task }, source = issues.get(String(task.externalId)) || {};
    for (const [field, mapping] of Object.entries(mappings)) {
      const tracking = source.timetracking || {};
      const value = Object.hasOwn(tracking, mapping.nested) ? tracking[mapping.nested] : source[mapping.flat];
      if (value === undefined) continue;
      if (value !== null && (!Number.isSafeInteger(value) || value < 0 || value / 3600 > 1e12)) {
        invalid(`Invalid Jira ${mapping.nested}: expected nonnegative integer seconds or null.`);
      }
      result[field] = value === null ? null : value / 3600;
    }
    return result;
  });
}
function cardSyncTimes(card, mappings) {
  return Object.fromEntries(Object.entries(mappings).map(([field, mapping]) => [field, cardSyncEstimate(card, mapping)]));
}
function syncTimeBaseline(task, mappings) {
  const baseline = {};
  for (const [field, mapping] of Object.entries(mappings)) if (task[field] !== undefined) {
    baseline[field] = task[field]; baseline[`${field}Mapping`] = mapping.identity;
  }
  return baseline;
}
function syncValueChanges(changes, card, estimateMapping, timeMappings = {}) {
  let result = estimateChanges(changes, card, estimateMapping);
  for (const field of Object.keys(TIME_FIELDS)) {
    if (!Object.hasOwn(result, field)) continue;
    const { [field]: value, ...rest } = result;
    if (!timeMappings[field]) invalid('Missing Sync time estimate mapping.');
    const current = { customFields: result.customFields || card?.customFields || [] };
    result = { ...rest, ...estimateChanges({ estimate: value }, current, timeMappings[field]) };
  }
  return result;
}
module.exports = { TIME_FIELDS, syncTimeMappings, timeMappingIdentities, addSyncTimeEstimates, cardSyncTimes, syncTimeBaseline, syncValueChanges };
