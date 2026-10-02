'use strict';
const { normalizeJiraEstimateMapping } = require('./jiraEstimateMapping');
function invalid(message) {
  const error = new Error(message);
  error.code = 'sync-estimate-invalid';
  throw error;
}
// GitLab's own estimates (2026-10-02): an issue's weight, in points, or its
// time estimate, which GitLab gives in seconds, in hours. GitHub, Gitea and
// Forgejo issues have none. The local field is any numeric custom field the
// board administrator picks; the source attribute is saved with the Sync
// settings as `estimateSourceField`.
const GITLAB_ESTIMATES = { weight: 'points', time_estimate: 'hours' };
function syncEstimateMapping(source, definition) {
  if (!source.fields?.includes('estimate')) return null;
  if (source.type === 'gitlab') {
    const unit = GITLAB_ESTIMATES[source.estimateSourceField];
    if (!unit) invalid('Select a GitLab estimate: weight or time estimate.');
    if (!definition || definition.type !== 'number' || definition._id !== source.estimateCustomFieldId) {
      invalid('Select a numeric estimate field on this board.');
    }
    return { estimateFieldId: source.estimateSourceField, estimateUnit: unit, localFieldId: definition._id,
      provider: 'gitlab', identity: JSON.stringify([definition._id, `gitlab:${source.estimateSourceField}`, unit]) };
  }
  if (source.type !== 'jira' || !definition || definition.type !== 'number' ||
      definition._id !== source.estimateCustomFieldId) invalid('Select a mapped numeric Jira estimate field on this board.');
  let mapping;
  try { mapping = normalizeJiraEstimateMapping({ estimateFieldId: definition.settings?.jiraEstimateFieldId,
    estimateUnit: definition.settings?.jiraEstimateUnit }); }
  catch (_) { invalid('Invalid Jira estimate field mapping.'); }
  return { ...mapping, localFieldId: definition._id,
    identity: JSON.stringify([definition._id, mapping.estimateFieldId, mapping.estimateUnit]) };
}
// A GitLab issue's estimate as the mapping reads it: null when GitLab says
// nothing (no weight), undefined when the issue does not carry the attribute.
function gitlabEstimate(issue, field) {
  if (field === 'weight') return Object.hasOwn(issue, 'weight') ? issue.weight : undefined;
  const seconds = issue.time_stats?.time_estimate;
  if (seconds === undefined || seconds === null) return seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return NaN;
  return Math.round(seconds / 36) / 100;
}
function addSyncEstimates(tasks, raw, mapping) {
  if (!mapping) return tasks;
  const issues = Array.isArray(raw) ? raw : raw.issues || [];
  // GitLab's tasks are keyed by iid (models/lib/externalParsers.js parseGitlab).
  const values = mapping.provider === 'gitlab'
    ? new Map(issues.map(issue => [String(issue.iid ?? issue.id), gitlabEstimate(issue, mapping.estimateFieldId)]))
    : new Map(issues.map(issue => [String(issue.key), issue.fields?.[mapping.estimateFieldId]]));
  return tasks.map(task => {
    const estimate = values.get(String(task.externalId));
    if (estimate === undefined) return task;
    if (estimate !== null && (typeof estimate !== 'number' || !Number.isFinite(estimate) || estimate < 0 || estimate > 1e12)) {
      invalid(`Invalid ${mapping.provider === 'gitlab' ? 'GitLab' : 'Jira'} estimate: expected a nonnegative number or null.`);
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
module.exports = { syncEstimateMapping, addSyncEstimates, cardSyncEstimate, estimateChanges, GITLAB_ESTIMATES };
