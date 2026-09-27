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
function validateJiraEstimateMapping(data) {
  const mapping = normalizeJiraEstimateMapping(data.wekanScrumMapping);
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
  jiraEstimateExportMapping, jiraEstimateExportValue };
