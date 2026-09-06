const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readLocale = code => JSON.parse(fs.readFileSync(
  path.join(root, `imports/i18n/data/${code}.i18n.json`),
  'utf8',
));
const english = readLocale('en');
const albanian = readLocale('sq');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();

const batchKeys = [
  'activity-changedListTitle',
  'activity-customfield-created',
  'activity-excluded',
  'activity-imported',
  'activity-imported-board',
  'activity-joined',
  'activity-moved',
  'activity-on',
  'activity-removed',
  'activity-sent',
  'activity-unjoined',
  'activity-subtask-added',
  'activity-checked-item',
  'activity-unchecked-item',
  'activity-checklist-added',
  'activity-checklist-removed',
  'activity-checklist-completed',
  'activity-checklist-uncompleted',
  'activity-checklist-item-added',
  'activity-checklist-item-removed',
  'activity-checked-item-card',
  'activity-unchecked-item-card',
  'activity-checklist-completed-card',
  'activity-checklist-uncompleted-card',
  'activity-editComment',
  'activity-deleteComment',
  'activity-receivedDate',
  'activity-startDate',
  'allboards.starred',
  'allboards.remaining',
  'allboards.workspaces',
  'allboards.add-workspace',
  'allboards.add-workspace-prompt',
  'allboards.add-subworkspace',
  'allboards.add-subworkspace-prompt',
  'allboards.edit-workspace',
  'allboards.edit-workspace-name',
  'allboards.edit-workspace-icon',
  'allboards.workspace-menu',
  'workspace-settings',
  'workspaceActionsPopup-title',
  'addWorkspacePopup-title',
  'allboards.workspace-color',
  'allboards.delete-workspace-confirm',
  'allboards.delete-workspace-confirm-check',
  'multi-selection-active',
  'archive-permanent-delete-disabled-hint',
  'no-boards-selected',
  'select-only-one-board',
  'selected-label',
];

assert.equal(new Set(batchKeys).size, 50);
for (const key of batchKeys) {
  assert.notEqual(albanian[key], english[key], `${key}: translated from English`);
  assert.deepEqual(tokens(albanian[key]), tokens(english[key]),
    `${key}: placeholder inventory`);
}

assert.equal(albanian['allboards.workspaces'], 'Hapësirat e punës');
assert.equal(albanian['activity-moved'], 'zhvendosi %s nga %s në %s');
assert.deepEqual(tokens(albanian['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
console.log('albanianTranslationProgress: first 50 Albanian values passed');
