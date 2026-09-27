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
module.exports = { jiraTimeTracking, JIRA_ESTIMATE_FIELDS };
