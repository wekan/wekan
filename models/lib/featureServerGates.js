'use strict';

// Admin Panel / Settings / Features (models/lib/instanceFeatures.js) on the
// SERVER (docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
//
// An unticked feature is hidden from the interface, and since 2026-11-22 the
// server paths of that feature refuse it too: a Meteor method answers
// 'feature-disabled', a publication sends nothing. It is still never a
// permission: a feature that is on grants nobody a board or an edit right,
// every path keeps its own access check. And its data is untouched, so
// enabling it again shows everything as it was.
//
// SERVER_PATHS is the list tests/featureServerGates.test.cjs holds the code
// to: every method and publication of a feature file must ask the gate
// (server/lib/assistGate.js requireFeature / featureAllowed / featureOnFor),
// or be in `exempt` with the reason it is not that feature's - so a method
// added to one of these files cannot skip the check.
//
// Features with no server path of their own are in DISPLAY_ONLY, with why.
//
// Pure CommonJS, no Meteor.

const SERVER_PATHS = [
  { key: 'views-chat', file: 'server/chatView.js' },
  { key: 'views-email', file: 'server/emailView.js' },
  { key: 'views-version-control', file: 'server/versionControlView.js' },
  { key: 'views-table', file: 'server/tableViewCards.js' },
  { key: 'views-scrum', file: 'server/scrum.js',
    exempt: {
      'scrum.getBoardData': 'also read by the card details Scrum fields (scrumFields.js), which are card fields',
      'scrum.configure': 'also called by Board Settings / Card for the Scrum fields\' visibility (sidebar.js, scrumFields.js)',
      'scrum.resumeImport': 'finishes an interrupted import: board data repair, whatever is on',
      'scrum.discardImport': 'discards an interrupted import: board data repair, whatever is on',
      'scrum.inspectHistoryCheckpoint': 'History recovery of a stopped undo (historyKeyRecovery.js), not the view',
      'scrum.resolveHistoryCheckpoint': 'History recovery of a stopped undo (historyKeyRecovery.js), not the view',
    } },
  { key: 'board-summary', file: 'server/methods/boardSummary.js' },
  { key: 'since-last-visit', file: 'server/methods/sinceLastVisit.js',
    exempt: {
      'boards.markVisited': 'records the visit on every board open and shows nothing, so the list is right the moment the feature is on again',
    } },
  { key: 'rule-suggestions', file: 'server/methods/ruleSuggestions.js' },
  { key: 'workload', file: 'server/workload.js' },
  { key: 'billing', file: 'server/billing.js' },
  // Board View / Shop: its settings and its orders (models/lib/shop.js).
  { key: 'views-shop', file: 'server/shop.js' },
];

// Catalog features whose server side is a write of the board or a list
// (Boards.deny / Lists.deny in server/permissions/featureGates.js), or of a
// card's flow (server/lib/cardFlowMethod.js).
const WRITE_GATED = ['list-policies', 'commitment-point', 'person-wip-limit', 'split-lists'];

// Catalog features with nothing to refuse on the server, and why.
const DISPLAY_ONLY = {
  'views-calendar': 'the calendar views read the board\'s published cards; nothing they show or write is theirs alone',
  'views-time': 'the time views read the published cards and write ordinary card dates',
  'views-overview': 'the overview views read the published cards only',
  'views-gantt': 'the Gantt views read the published cards and write ordinary card dates and dependencies',
  'views-flow-charts': 'the charts are computed in the browser from the published cards',
  'views-map': 'the map reads the published cards\' locations and writes ordinary card fields',
  'views-website': 'the website view renders the published cards in the browser',
  'views-column-sets': 'column sets are a layout of the published lists, kept in the browser',
  'search-phrases': 'a phrase is rewritten in the browser into the search operators anybody may type',
  'standup-timer': 'the timer runs in the browser only and writes nothing',
  'retrospective-board': 'it makes an ordinary board with four lists, which the user may create by hand anyway',
};

// The flow-policy board fields a client write turns ON, and their features.
// Turning one off ($unset, false, '') is always allowed: it is the cleanup.
// A board copied or imported on the server keeps them: those writes are the
// server's, not a client's.
const BOARD_FIELD_FEATURES = Object.freeze({
  allowsListPolicies: 'list-policies',
  commitmentListId: 'commitment-point',
  personWipLimit: 'person-wip-limit',
  allowsSplitLists: 'split-lists',
});
const LIST_FIELD_FEATURES = Object.freeze({
  policy: 'list-policies',
  split: 'split-lists',
});

const turnsOn = value => value !== undefined && value !== null && value !== false && value !== '' && value !== 0;

// The feature keys a Mongo modifier turns on through `fields`.
function featuresTurnedOn(modifier, fieldFeatures) {
  const keys = new Set();
  if (!modifier || typeof modifier !== 'object') return [];
  for (const [op, value] of Object.entries(modifier)) {
    if (!value || typeof value !== 'object') continue;
    if (op === '$rename') {
      for (const target of Object.values(value)) if (fieldFeatures[target]) keys.add(fieldFeatures[target]);
      continue;
    }
    if (op === '$unset') continue;
    for (const [field, v] of Object.entries(value)) {
      if (fieldFeatures[field] && (op !== '$set' || turnsOn(v))) keys.add(fieldFeatures[field]);
    }
  }
  return [...keys];
}

const boardWriteFeatures = modifier => featuresTurnedOn(modifier, BOARD_FIELD_FEATURES);
const listWriteFeatures = modifier => featuresTurnedOn(modifier, LIST_FIELD_FEATURES);

const FEATURE_DISABLED = Object.freeze({ error: 'feature-disabled', reason: 'This feature is turned off' });

module.exports = {
  SERVER_PATHS,
  WRITE_GATED,
  DISPLAY_ONLY,
  BOARD_FIELD_FEATURES,
  LIST_FIELD_FEATURES,
  boardWriteFeatures,
  listWriteFeatures,
  FEATURE_DISABLED,
};
