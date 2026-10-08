// The completed catalog predates newer features; keep its no-regression gate.
// Full translation work remains visible through fill-translations.mjs --list.
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
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'sq',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'the complete Albanian actionable backlog stays resolved');

for (const [key, value] of Object.entries(albanian)) {
  if (value !== english[key]) {
    assert.deepEqual(tokens(value), tokens(english[key]),
      `${key}: locale-wide placeholder inventory`);
  }
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
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
assert.equal(albanian['upload-completed'], 'Ngarkimi përfundoi');
assert.deepEqual(tokens(albanian['email-invite-register-text']),
  ['__icode__', '__inviter__', '__url__', '__user__']);
assert.match(albanian.Reactivity_order, /METEOR_REACTIVITY_ORDER/);
assert.match(albanian['org-domains-description'], /MULTITENANCY=true/);
assert.deepEqual(tokens(albanian['default-subtasks-board']), ['__board__']);
assert.deepEqual(tokens(albanian['activity-set-customfield']), ['%s', '%s', '%s']);
assert.deepEqual(tokens(albanian['r-w-every-day-at']), ['__time__']);
assert.deepEqual(tokens(albanian['r-import-done']), ['__count__']);
assert.match(albanian['r-import-workflow-note'], /n8n.*Node-RED.*WeKan/);
assert.equal(albanian['r-d-move-to-top-gen'],
  'Zhvendos kartën në krye të listës së saj');
assert.deepEqual(tags(albanian['add-custom-html-after-body-start']), ['<body>']);
assert.deepEqual(tokens(albanian['act-atUserComment']),
  ['__board__', '__card__', '__comment__', '__list__', '__swimlane__']);
assert.equal(albanian.monday, 'E hënë');
assert.equal(albanian['roles-status-sees-assigned'], 'Vetëm të caktuarat');
assert.equal(albanian['globalSearchViewChange-choice-me'], 'Kartat e mia');
assert.deepEqual(tokens(albanian['n-n-of-n-cards-found']),
  ['__end__', '__start__', '__total__']);
assert.equal(albanian['operator-customfield'], 'fushapersonale');
assert.deepEqual(tokens(albanian['operator-number-expected']),
  ['__operator__', '__value__']);
assert.deepEqual(tokens(albanian['globalSearch-instructions-operator-has']),
  ['__operator_has__', '__predicate_assignee__', '__predicate_attachment__',
    '__predicate_checklist__', '__predicate_description__', '__predicate_due__',
    '__predicate_end__', '__predicate_member__', '__predicate_start__']);
assert.deepEqual(tokens(albanian['import-dependencies-done']),
  ['__imported__', '__unmatched__']);
assert.deepEqual(tokens(albanian['custom-field-stringtemplate-format']), ['%{value}']);
assert.match(albanian['server-error-troubleshooting'], /sudo docker logs wekan-app/);
assert.match(albanian['api-no-calls'], /WITH_API=true/);
assert.match(albanian.Node_heap_total_heap_size, /Node/);
assert.equal(albanian['attachment-move-storage-s3'],
  'Zhvendos bashkëngjitjen në S3');
assert.match(albanian['mongodb-compact-warning'], /Meteor/);
assert.deepEqual(tokens(albanian['drag-board-to-workspace']), ['__workspaces__']);
assert.equal(albanian.accessibility, 'Qasshmëria');
assert.equal(albanian['accounts-lockout-unlock-all'], 'Zhblloko të gjithë');
assert.equal(albanian['cron-migrations'], 'Migrimet e planifikuara');
assert.deepEqual(tokens(albanian['database-migration-confirm']), ['__db__']);
assert.match(albanian['database-migration-description'], /MongoDB.*FerretDB v1.*SQLite/);
assert.equal(albanian['features-security'], 'Siguria');
assert.match(albanian['backup-description'], /S3\/MinIO.*Azure.*GCS/);
assert.match(albanian['gcs-permissions-note'], /client_email.*Storage Object Admin/);
assert.deepEqual(tags(albanian['render-links-as-plain-text-description']),
  ['<a href>']);
assert.match(albanian['cards-loading-description'],
  /CARDS_LOADING.*CARDS_LOADING_LAZY_THRESHOLD/);
assert.equal(albanian['comprehensive-board-migration'],
  'Migrim gjithëpërfshirës i tabelës');
assert.match(albanian['restore-lost-cards-migration-description'],
  /swimlaneId.*listId/);
assert.equal(albanian['step-fix-orphaned-cards'], 'Rregullo kartat jetime');
assert.equal(albanian['cpu-usage'], 'Përdorimi i CPU-së');
assert.equal(albanian['migrate-all-to-filesystem'],
  'Migro gjithçka në sistemin e skedarëve');
assert.deepEqual(tokens(albanian['repair-broken-cards-done-unfixable']),
  ['__fixed__', '__unfixable__']);
assert.deepEqual(tokens(albanian['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);
assert.deepEqual(tokens(albanian['globalSearch-instructions-operator-number']),
  ['__operator_number__']);
assert.deepEqual(tags(albanian['globalSearch-instructions-operator-number']),
  ['<number>', '<number>']);
assert.deepEqual(tokens(albanian['activity-checklist-completed-card']),
  ['__board__', '__card__', '__checklist__', '__list__', '__swimlane__']);
console.log('albanianTranslationProgress: historical catalog baseline passed; newer entries checked separately');

const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const recoveryKeys = Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'));
assert.equal(recoveryKeys.length, 23);
for (const key of recoveryKeys) {
  assert.notEqual(albanian[key], english[key], key);
  assert.deepEqual(translationTokens(albanian[key]), translationTokens(english[key]), key);
}
assert.match(albanian['stuck-sync-operation-description'], /ndryshimet e zbatuara mbeten/);
assert.match(albanian['stuck-sync-operation-description'], /ndryshimet e tjera të ruajtura nuk shkruhen kurrë/);
assert.match(albanian['stuck-sync-operation-reason-access-denied'], /të drejtë shkrimi në të gjithë listën/);
assert.match(albanian['stuck-sync-operation-replayable-now'], /nuk mund të hidhet poshtë/);
assert.match(albanian['stuck-sync-operation-not-stuck'], /nuk mund të hidhet poshtë/);
assert.match(albanian['stuck-sync-operation-truncated'], /50 veprimet më të vjetra/);
assert.match(albanian['stuck-sync-operation-busy'], /po sinkronizohet tani/);

const interruptedImportKeys = Object.keys(english).filter(key => key.startsWith('interrupted-import-'));
assert.equal(interruptedImportKeys.length, 25);
for (const key of interruptedImportKeys) {
  assert.notEqual(albanian[key], english[key], key);
  assert.deepEqual(translationTokens(albanian[key]), translationTokens(english[key]), key);
}
assert.match(albanian['interrupted-import-description'], /skedari burimor nuk ruhet/);
assert.match(albanian['interrupted-import-description'], /gjithçka të shtuar më pas/);
assert.match(albanian['interrupted-import-counts'], /__swimlanes__ korsi/);
assert.match(albanian['interrupted-import-discard-confirm'], /hiqen përgjithmonë/);
assert.match(albanian['interrupted-import-keep-confirm'], /Asgjë nuk hiqet/);
assert.match(albanian['interrupted-import-foreign-board'], /nuk u ndryshua/);
assert.match(albanian['interrupted-import-truncated'], /50 importet më të vjetra/);
assert.match(albanian['interrupted-import-scrum-busy'], /ende po shkruhet ose po rikuperohet/);

const translatedPlanningControls = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-origin-mismatch", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of translatedPlanningControls) {
  assert.notEqual(albanian[key], english[key], key);
  assert.deepEqual(translationTokens(albanian[key]), translationTokens(english[key]), key);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(albanian['import-board-instruction-orgmode'].includes(literal), literal);
}
for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
  assert.ok(albanian['import-board-instruction-todoist'].includes(literal), literal);
}
assert.ok(albanian['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(albanian['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(albanian['ldap-sync-now-nothing'].includes(literal), literal);
}
assert.match(albanian['login-origin-mismatch'], /ROOT_URL/);
assert.match(albanian['sync-planning-hint'], /sinkronizimi i parë nuk e heq kurrë/);
assert.match(albanian['scrum-import-into-board-hint'], /nuk dyfishohen kurrë/);
assert.match(albanian['scrum-history-checkpoint-hint'], /askush tjetër nuk i ka ndryshuar/);
assert.match(albanian['scrum-history-checkpoint-hint'], /nuk ndryshon asnjë regjistrim/);
assert.match(albanian['login-setting-env-only'], /vetëm për lexim/);
