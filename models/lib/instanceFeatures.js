'use strict';

// #6736: Admin Panel / Settings / Visibility / Features - which optional
// features this WeKan offers, instance-wide.
//
// Pure CommonJS, no Meteor: the Admin Panel page, the server method that saves
// it, the client places that hide a disabled feature, and the tests/*.test.cjs
// guards all load this ONE catalog and these decisions.
//
// What a disabled feature means:
//   * it is HIDDEN from the interface - its menu entries are not drawn, not
//     greyed out - and a user who had it open is moved to what remains;
//   * its data is untouched: enabling it again shows everything as it was;
//   * it never changes permissions: availability is not access, so enabling
//     a feature grants nobody a board, a card or an edit right.
// Swimlanes and Lists are the core of a board and are never in the catalog.
//
// Stored on the Settings document:
//   featureStates:           { '<key>': true|false }  - explicit decisions
//   featureApprovalRequired: Boolean - keep NEW features off until enabled
//   featureKnownKeys:        [key]   - the catalog when the policy was turned
//                                      on, or when the page was last saved
//   featurePreviewAdmins:    Boolean - site admins see disabled features
// and on a user: featurePreview: true - a pilot user who sees them too.

// Each entry is a group of related views, so an administrator decides about
// "the Scrum views", not about 35 menu lines. `views` are keys of
// models/lib/boardViewSettings.js BOARD_VIEWS; tests/instanceFeatures.test.cjs
// fails when a view is unknown or in two groups.
const FEATURES = [
  { key: 'views-table', labelKey: 'feature-views-table', descKey: 'feature-views-table-desc',
    views: ['board-view-table'] },
  { key: 'views-calendar', labelKey: 'feature-views-calendar', descKey: 'feature-views-calendar-desc',
    views: ['board-view-cal', 'board-view-calendar-mode', 'board-view-multiboard-cal'] },
  { key: 'views-time', labelKey: 'feature-views-time', descKey: 'feature-views-time-desc',
    views: ['board-view-time', 'board-view-timeline'] },
  { key: 'views-overview', labelKey: 'feature-views-overview', descKey: 'feature-views-overview-desc',
    views: ['board-view-stats', 'board-view-group-by-assignee', 'board-view-roadmap', 'board-view-dashboard',
      'board-view-bigboard'] },
  { key: 'views-gantt', labelKey: 'feature-views-gantt', descKey: 'feature-views-gantt-desc',
    views: ['board-view-gantt', 'board-view-gantt-frappe', 'board-view-gantt-dhtmlx'] },
  { key: 'views-scrum', labelKey: 'feature-views-scrum', descKey: 'feature-views-scrum-desc',
    views: ['board-view-product-backlog', 'board-view-sprints', 'board-view-sprint-report', 'board-view-velocity'] },
  { key: 'views-flow-charts', labelKey: 'feature-views-flow-charts', descKey: 'feature-views-flow-charts-desc',
    views: ['board-view-burndown', 'board-view-burnup', 'board-view-cumulative-flow', 'board-view-control-chart',
      'board-view-cycle-time', 'board-view-flow-efficiency', 'board-view-lead-time',
      'board-view-throughput-histogram', 'board-view-wip-run', 'board-view-pulse', 'board-view-aging-wip',
      'board-view-blocker-analysis', 'board-view-monte-carlo', 'board-view-process-behavior',
      'board-view-size-cycle-time'] },
  { key: 'views-map', labelKey: 'feature-views-map', descKey: 'feature-views-map-desc',
    views: ['board-view-map'] },
];

const FEATURE_KEYS = FEATURES.map(feature => feature.key);
const FEATURE_OF_VIEW = new Map(FEATURES.flatMap(feature => feature.views.map(view => [view, feature.key])));

function isFeatureKey(key) {
  return FEATURE_KEYS.includes(key);
}

function storedStates(setting) {
  const states = setting && setting.featureStates;
  return states && typeof states === 'object' && !Array.isArray(states) ? states : {};
}

function knownKeys(setting) {
  return Array.isArray(setting && setting.featureKnownKeys) ? setting.featureKnownKeys : [];
}

// A feature nobody has decided about yet, that arrived after the approval
// policy was turned on. It waits for an administrator.
function isAwaitingApproval(setting, key) {
  if (!isFeatureKey(key)) return false;
  return !!(setting && setting.featureApprovalRequired === true) &&
    typeof storedStates(setting)[key] !== 'boolean' && !knownKeys(setting).includes(key);
}

// On for everyone. An explicit decision wins; without one a feature is on,
// as it always was, unless it is new and the instance asked to approve first.
function isFeatureEnabled(setting, key) {
  if (!isFeatureKey(key)) return true;
  const state = storedStates(setting)[key];
  if (typeof state === 'boolean') return state;
  return !isAwaitingApproval(setting, key);
}

// Whether THIS user sees disabled features: site admins when the preview is
// on, and the pilot users an administrator named.
function canPreviewFeatures(setting, user) {
  if (!user) return false;
  if (user.featurePreview === true) return true;
  return user.isAdmin === true && !!(setting && setting.featurePreviewAdmins === true);
}

function isFeatureAvailable(setting, user, key) {
  return isFeatureEnabled(setting, key) || canPreviewFeatures(setting, user);
}

function isBoardViewAvailable(setting, user, view) {
  const key = FEATURE_OF_VIEW.get(view);
  return !key || isFeatureAvailable(setting, user, key);
}

// The rows of the Admin Panel page.
function featureRows(setting) {
  return FEATURES.map(feature => ({
    key: feature.key,
    labelKey: feature.labelKey,
    descKey: feature.descKey,
    enabled: isFeatureEnabled(setting, feature.key),
    awaitingApproval: isAwaitingApproval(setting, feature.key),
  }));
}

// The page's Save, turned into one $set, or { error }. Every catalog feature
// gets an explicit decision, so what the administrator saw is what is stored.
// Turning the approval policy ON records the catalog as it is now: only
// features added by a LATER update wait for approval. Saving with the policy
// on records the current catalog too, because every feature on the page has
// just been decided.
function featureSettingsModifier(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'invalid' };
  const { states, approvalRequired, previewAdmins } = input;
  if (!states || typeof states !== 'object' || Array.isArray(states) ||
      typeof approvalRequired !== 'boolean' || typeof previewAdmins !== 'boolean') return { error: 'invalid' };
  const unknown = Object.keys(states).filter(key => !isFeatureKey(key));
  if (unknown.length) return { error: 'unknown-feature', keys: unknown };
  const featureStates = {};
  for (const key of FEATURE_KEYS) {
    if (typeof states[key] !== 'boolean') return { error: 'invalid' };
    featureStates[key] = states[key];
  }
  return { $set: { featureStates, featureApprovalRequired: approvalRequired,
    featurePreviewAdmins: previewAdmins, featureKnownKeys: FEATURE_KEYS.slice() } };
}

// "alice, bob\ncarol" -> ['alice', 'bob', 'carol'], unique, bounded.
function parsePilotUsernames(text) {
  if (typeof text !== 'string') return [];
  return [...new Set(text.split(/[\s,;]+/).map(name => name.trim()).filter(Boolean))].slice(0, 500);
}

module.exports = {
  FEATURES,
  FEATURE_KEYS,
  isFeatureKey,
  isAwaitingApproval,
  isFeatureEnabled,
  canPreviewFeatures,
  isFeatureAvailable,
  isBoardViewAvailable,
  featureRows,
  featureSettingsModifier,
  parsePilotUsernames,
};
