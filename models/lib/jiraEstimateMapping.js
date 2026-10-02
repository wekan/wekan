'use strict';
const { normalizeScrumSettings } = require('./scrum');
function normalizeJiraEstimateMapping(value) {
  if (value === undefined) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !['estimateFieldId', 'estimateUnit'].includes(key)) ||
      typeof value.estimateFieldId !== 'string' || !/^customfield_\d{1,20}$/.test(value.estimateFieldId)) {
    throw new Error('Invalid Jira estimate field mapping');
  }
  const { estimateUnit } = normalizeScrumSettings({ estimateUnit: value.estimateUnit });
  return { estimateFieldId: value.estimateFieldId, estimateUnit };
}
function jiraEstimateValue(fields, mapping) {
  if (!mapping) return undefined;
  const value = fields?.[mapping.estimateFieldId];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12) {
    throw new Error('Invalid Jira estimate: expected a nonnegative numeric value');
  }
  return value;
}
// Jira Software's own story points type: a schema type, not a field name, so
// finding it is reading the export, not guessing.
const STORY_POINTS = 'com.pyxis.greenhopper.jira:jsw-story-points';
// The numeric custom fields the export declares (search with
// expand=names,schema), for the import page to offer: story points first,
// then by name. Nothing is offered without a schema.
function jiraEstimateCandidates(data) {
  const schema = (data && !Array.isArray(data) && data.schema) || {};
  const names = (data && !Array.isArray(data) && data.names) || {};
  return Object.keys(schema)
    .filter(id => /^customfield_\d{1,20}$/.test(id) && schema[id] && schema[id].type === 'number')
    .map(id => ({ fieldId: id, name: typeof names[id] === 'string' ? names[id] : id,
      storyPoints: schema[id].custom === STORY_POINTS }))
    .sort((a, b) => (b.storyPoints - a.storyPoints) || a.name.localeCompare(b.name) || a.fieldId.localeCompare(b.fieldId));
}
// Without an explicit mapping: the one field of the story points type, in
// points. Two or none - nothing is chosen for the user.
function discoveredJiraEstimateMapping(data) {
  const points = jiraEstimateCandidates(data).filter(candidate => candidate.storyPoints);
  return points.length === 1 ? { estimateFieldId: points[0].fieldId, estimateUnit: 'points' } : null;
}
function validateJiraEstimateMapping(data) {
  const mapping = data.wekanScrumMapping === undefined
    ? normalizeJiraEstimateMapping(discoveredJiraEstimateMapping(data) || undefined)
    : normalizeJiraEstimateMapping(data.wekanScrumMapping);
  if (!mapping) return null;
  const issues = data.issues || [];
  const schema = data.schema?.[mapping.estimateFieldId];
  if (!issues.some(issue => Object.prototype.hasOwnProperty.call(issue.fields || {}, mapping.estimateFieldId)) && schema?.type !== 'number') {
    throw new Error('Jira estimate field is absent from the imported issues');
  }
  if (schema && schema.type !== 'number') throw new Error('Jira estimate field schema must be numeric');
  for (const issue of issues) jiraEstimateValue(issue.fields, mapping);
  return mapping;
}
function jiraEstimateExportMapping(definitions, wanted = null) {
  if (wanted && (!wanted.has('scrum') || !wanted.has('custom-fields'))) return null;
  const fields = definitions.filter(field => field.type === 'number' && field.settings?.jiraEstimateFieldId);
  if (fields.length !== 1) return null;
  try {
    const mapping = normalizeJiraEstimateMapping({ estimateFieldId: fields[0].settings.jiraEstimateFieldId,
      estimateUnit: fields[0].settings.jiraEstimateUnit });
    return { ...mapping, localFieldId: fields[0]._id };
  } catch (_) { return null; }
}
function jiraEstimateExportValue(card, mapping) {
  if (!mapping) return {};
  const values = (card.customFields || []).filter(field => field._id === mapping.localFieldId);
  if (values.length !== 1) return {};
  try {
    const value = jiraEstimateValue({ [mapping.estimateFieldId]: values[0].value }, mapping);
    return { [mapping.estimateFieldId]: value ?? null };
  } catch (_) { return {}; }
}
module.exports = { normalizeJiraEstimateMapping, validateJiraEstimateMapping, jiraEstimateValue,
  jiraEstimateCandidates, discoveredJiraEstimateMapping, JIRA_STORY_POINTS_SCHEMA: STORY_POINTS,
  jiraEstimateExportMapping, jiraEstimateExportValue };
