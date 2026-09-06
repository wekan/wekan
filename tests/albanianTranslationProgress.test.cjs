const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

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

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--list',
  'sq',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 1416,
  'the first fourteen Albanian batches stay resolved');

for (const [key, value] of Object.entries(albanian)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
}

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
  'set-selected-starred',
  'set-selected-unstarred',
  'set-selected-home',
  'unset-selected-home',
  'home-board-badge',
  'home-board-empty',
  'home-board-remove',
  'home-board-remove-confirm',
  'activity-dueDate',
  'activity-endDate',
  'add-template',
  'add-card-to-top-of-list',
  'add-card-to-bottom-of-list',
  'setListWidthPopup-title',
  'set-list-width',
  'set-list-width-value',
  'list-width-error-message',
  'list-width-shared-note',
  'list-width-personal-note',
  'personal-list-width',
  'personal-list-width-description',
  'fixed-list-width',
  'click-to-enable-fixed-list-width',
  'click-to-disable-fixed-list-width',
  'fixed-list-width-note',
  'keyboard-shortcuts-enabled',
  'keyboard-shortcuts-disabled',
  'setSwimlaneHeightPopup-title',
  'set-swimlane-height',
  'set-swimlane-height-value',
  'swimlane-height-error-message',
  'add-subtask',
  'add-checklist',
  'close-add-checklist-item',
  'close-edit-checklist-item',
  'convertChecklistItemToCardPopup-title',
  'add-cover',
  'add-label',
  'add-after-list',
  'add-members',
  'added',
  'addMemberPopup-title',
  'admin',
  'admin-desc',
  'admin-announcement',
  'admin-announcement-active',
  'admin-announcement-title',
  'all-boards-hide',
  'public-boards',
  'and-n-other-card',
  'and-n-other-card_plural',
  'apply',
  'app-is-offline',
  'app-try-reconnect',
  'archive-board-confirm',
  'archive-list',
  'archive-swimlane',
  'archive-selection',
  'archiveBoardPopup-title',
  'archived-items',
  'archived-boards',
  'restore-board',
  'no-archived-boards',
  'archives',
  'template-container',
  'add-template-container',
  'assign-member',
  'attached',
  'attachment-delete-pop',
  'attachmentDeletePopup-title',
  'auto-watch',
  'avatar-too-big',
  'board-change-color',
  'board-change-background-image',
  'board-background-image-url',
  'add-background-image',
  'remove-background-image',
  'show-at-all-boards-page',
  'board-info-on-my-boards',
  'boardInfoOnMyBoardsPopup-title',
  'boardInfoOnMyBoards-title',
  'show-card-counter-per-list',
  'show-board_members-avatar',
  'board_members',
  'card_members',
  'board_assignees',
  'card_assignees',
  'board-nb-stars',
  'board-not-found',
  'board-private-info',
  'board-public-info',
  'board-drag-drop-reorder-or-click-open',
  'board-open-and-move-between-remaining-and-workspaces',
  'boardChangeColorPopup-title',
  'changeColorPopup-title',
  'changeFontPopup-title',
  'boardChangeBackgroundImagePopup-title',
  'allBoardsChangeColorPopup-title',
  'allBoardsChangeBackgroundImagePopup-title',
  'boardChangeTitlePopup-title',
];

assert.equal(new Set(batchKeys).size, 150);
for (const key of batchKeys) {
  assert.notEqual(albanian[key], english[key], `${key}: translated from English`);
  assert.deepEqual(tokens(albanian[key]), tokens(english[key]),
    `${key}: placeholder inventory`);
}

assert.equal(albanian['allboards.workspaces'], 'Hapësirat e punës');
assert.equal(albanian['activity-moved'], 'zhvendosi %s nga %s në %s');
assert.equal(albanian['board-view'], 'Pamja e tabelës');
assert.equal(albanian['card-due'], 'Afati');
assert.equal(albanian['positiveVoteMembersPopup-title'], 'Mbështetësit');
assert.equal(albanian['vote-question'], 'Pyetja e votimit');
assert.equal(albanian['cardDetailsActionsPopup-title'], 'Veprimet e kartës');
assert.equal(albanian['rulesImportExportPopup-title'],
  'Importo / Eksporto rregullat');
assert.equal(albanian['cardType-linkedCard'], 'Kartë e lidhur');
assert.equal(albanian['map-to-existing-user-no-results'],
  'Nuk u gjetën përdorues që përputhen.');
assert.equal(albanian['auto-list-width'], 'Gjerësia automatike e listës');
assert.equal(albanian['card-aging'], 'Vjetrimi i kartave (zbeh kartat e vjetra)');
assert.equal(albanian['read-only'], 'Vetëm lexim');
assert.equal(albanian['custom-field-currency'], 'Monedhë');
assert.equal(albanian['error-board-doesNotExist'], 'Kjo tabelë nuk ekziston');
assert.equal(albanian['export-card-attachment-filename'], 'Emri i skedarit');
assert.equal(albanian['filter-overdue'], 'Me afat të kaluar');
assert.match(albanian['import-board-instruction-issues'],
  /__sourceName__.*__endpoint__/);
assert.equal(albanian['trello-import-progress'], 'Ecuria e importimit');
assert.equal(albanian['invalid-year'],
  'Vit i pavlefshëm. Shkruaj të katër shifrat, për shembull 2026.');
assert.equal(albanian['multi-selection'], 'Përzgjedhje e shumëfishtë');
assert.equal(albanian['sidebar-close'], 'Mbyll shiritin anësor');
assert.deepEqual(tokens(albanian['remove-member-pop']),
  ['__boardTitle__', '__name__', '__username__']);
assert.deepEqual(tokens(albanian['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
console.log('albanianTranslationProgress: first fourteen Albanian batches passed');
