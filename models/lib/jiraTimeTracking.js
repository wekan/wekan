'use strict';

const JIRA_ESTIMATE_FIELDS = [
  { key: 'original', name: 'Jira original estimate (hours)' },
  { key: 'remaining', name: 'Jira remaining estimate (hours)' },
];
// Jira's localized strings depend on working-day settings. Only documented
// numeric seconds are portable, and worklog pages may contain only a subset.
function jiraTimeTracking(fields = {}) {
  const tracking = fields.timetracking || {};
  const result = {};
  for (const [key, nested, flat] of [
    ['original', 'originalEstimateSeconds', 'timeoriginalestimate'],
    ['remaining', 'remainingEstimateSeconds', 'timeestimate'],
    ['spent', 'timeSpentSeconds', 'timespent'],
  ]) {
    const value = tracking[nested] ?? fields[flat];
    if (value === undefined || value === null) continue;
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid Jira ${nested}: expected nonnegative integer seconds`);
    result[key] = value / 3600;
  }
  return result;
}
function jiraTimeTrackingExport(card, definitions = [], wanted = null) {
  const result = {};
  const seconds = value => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
    const rounded = Math.round(value * 3600);
    return Number.isSafeInteger(rounded) ? rounded : undefined;
  };
  if (!wanted || wanted.has('dates')) {
    const spent = seconds(card.spentTime);
    if (spent !== undefined) result.timeSpentSeconds = spent;
  }
  if (!wanted || wanted.has('custom-fields')) {
    for (const [key, target] of [['original', 'originalEstimateSeconds'], ['remaining', 'remainingEstimateSeconds']]) {
      const fields = definitions.filter(field => field.type === 'number' && field.settings?.jiraTimeField === key);
      // A renamed field retains its meaning; ambiguous duplicate mappings do not.
      if (fields.length !== 1) continue;
      const values = (card.customFields || []).filter(value => value._id === fields[0]._id);
      if (values.length !== 1) continue;
      const value = seconds(values[0].value);
      if (value !== undefined) result[target] = value;
    }
  }
  return result;
}
module.exports = { jiraTimeTracking, jiraTimeTrackingExport, JIRA_ESTIMATE_FIELDS };
