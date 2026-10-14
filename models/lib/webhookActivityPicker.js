'use strict';

// #2026 / #1377: which activities an outgoing webhook is sent, picked in its
// form by the same groups a member mutes notifications by (#572,
// models/lib/notificationActivityGroups.js) instead of only "all". A webhook
// matches an activity by its description, `act-<activityType>`
// (server/models/activities.js), so a group is the descriptions of its
// types. "Every activity" stays `all`, the default, which also gets
// activities no group lists. Pure: tests/webhookActivityPicker.test.cjs.

const { NOTIFICATION_ACTIVITY_GROUPS, GROUP_KEYS } = require('./notificationActivityGroups');

function groupDescriptions(key) {
  return (NOTIFICATION_ACTIVITY_GROUPS[key] || []).map(type => `act-${type}`);
}

// What the form shows for a webhook's stored activities.
function pickerState(activities) {
  const list = Array.isArray(activities) ? activities : ['all'];
  if (list.includes('all')) return { all: true, groups: [] };
  return { all: false, groups: GROUP_KEYS.filter(key => groupDescriptions(key).every(d => list.includes(d))) };
}

// The activities to store for what was ticked. Nothing ticked is "all":
// a webhook that receives nothing is switched off with its own toggle.
function activitiesFor({ all, groups } = {}) {
  const chosen = GROUP_KEYS.filter(key => Array.isArray(groups) && groups.includes(key));
  if (all || chosen.length === 0) return ['all'];
  return [...new Set(chosen.flatMap(groupDescriptions))];
}

module.exports = { groupDescriptions, pickerState, activitiesFor };
