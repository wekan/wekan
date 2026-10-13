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
const latin = readLocale('la');
const tokens = value => [...value.matchAll(
  /__[A-Za-z0-9_]+__|%[0-9$]*[A-Za-z]|%{[A-Za-z0-9]+}|{{[A-Za-z0-9]+}}/g,
)].map(([token]) => token).sort();
const tags = value => [...value.matchAll(/<\/?[A-Za-z][^>]*>/g)]
  .map(([tag]) => tag).sort();

const fillResult = spawnSync(process.execPath, [
  path.join(root, 'releases/translations/fill-translations.mjs'),
  '--completed-catalog', '--list',
  'la',
], { cwd: root, encoding: 'utf8' });
assert.equal(fillResult.status, 0, fillResult.stderr);
assert.equal(Object.keys(JSON.parse(fillResult.stdout)).length, 0,
  'every actionable Latin value stays translated');

assert.deepEqual(Object.keys(latin), Object.keys(english),
  'Latin key order follows the English source');
for (const [key, value] of Object.entries(latin)) {
  assert.deepEqual(tokens(value), tokens(english[key]),
    `${key}: locale-wide placeholder inventory`);
  assert.deepEqual(tags(value), tags(english[key]),
    `${key}: locale-wide HTML tag inventory`);
}

assert.equal(latin.board, 'Tabula');
assert.equal(latin.card, 'Charta');
assert.equal(latin.list, 'Index');
assert.equal(latin.save, 'Serva');
assert.equal(latin.search, 'Quaere');
assert.deepEqual(tokens(latin['activity-changedTitle']), ['%s', '%s']);
assert.deepEqual(tokens(latin['act-deleteCard']),
  ['__board__', '__card__', '__list__', '__swimlane__']);
assert.deepEqual(tokens(latin['restore-list-swimlanes-done']),
  ['__remaining__', '__restored__']);

console.log('latinTranslationProgress: historical catalog and reviewed additions passed');

const cardLinkKeys = ["attach-card", "attachCardPopup-title", "attach-card-hint", "attached-card-unavailable", "detach-card", "attach-card-self", "attach-card-limit", "attach-card-not-found", "board-announcement", "board-announcement-enabled", "board-view-calendar-mode", "custom-field-links", "custom-field-links-hint", "custom-field-links-none", "custom-field-link-unavailable", "custom-field-link-fields", "custom-field-link-no-fields", "custom-field-link-inactive", "custom-field-unlink", "custom-field-link-target", "custom-field-link-direction", "custom-field-link-both", "custom-field-link-send", "custom-field-link-sends", "custom-field-link-receives", "custom-field-link-add", "field-link-self", "field-link-limit", "field-link-archived", "field-link-invalid", "field-link-not-found", "field-link-not-allowed", "cardCustomFieldLinksPopup-title", "cards-use-list-color"];
for (const key of cardLinkKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['attach-card'], latin['attachCardPopup-title']);
assert.match(latin['custom-field-links-hint'], /eiusdem nominis et generis.*una tantum charta.*non mutantur/);
assert.match(latin['custom-field-link-both'], /In utramque partem/);
assert.match(latin['custom-field-link-send'], /In unam partem.*ad chartam principalem/);
assert.notEqual(latin['custom-field-link-sends'], latin['custom-field-link-receives']);
assert.match(latin['custom-field-link-inactive'], /recensere iam non potest.*aut charta in tabulario/);
assert.match(latin['field-link-not-allowed'], /Utramque chartam/);
assert.match(latin['field-link-self'], /sibi ipsi.*non potest/);
for (const key of ['link-card', 'linkCardPopup-title']) assert.doesNotMatch(latin[key], /^Latine:/);

const importGuideKeys = ["import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-meistertask", "import-board-instruction-obsidian", "import-board-instruction-linear", "import-board-instruction-ticktick", "import-board-instruction-clickup", "import-board-instruction-nullboard", "import-board-instruction-kanri", "import-board-instruction-pivotal", "import-board-instruction-tasksorg", "import-board-instruction-monday", "import-board-instruction-trello"];
for (const key of importGuideKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
  assert.doesNotMatch(latin[key], /^Latine:/);
}
assert.match(latin['import-board-instruction-opml'], /summi gradus.*indices.*subiecta.*chartae.*inferiorum graduum.*indices probationis/);
for (const name of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) assert.ok(latin['import-board-instruction-orgmode'].includes(name));
for (const format of ['meistertask', 'tasksorg']) assert.match(latin[`import-board-instruction-${format}`], /perfecta diem perfectionis servant/);
for (const format of ['nullboard', 'kanri']) assert.match(latin[`import-board-instruction-${format}`], /prima tabula importatur/);
assert.match(latin['import-board-instruction-nullboard'], /prima linea.*titulus.*cetera descriptio.*titellum raw/);
assert.match(latin['import-board-instruction-clickup'], /omnibus columnis.*indices ClickUp fiunt semitae/);
assert.match(latin['import-board-instruction-monday'], /aliae columnae fiunt campi proprii.*renovationes fiunt commentaria/);
for (const name of ['Menu', 'More', 'Print and Export', 'Export JSON']) assert.ok(latin['import-board-instruction-trello'].includes(name));

const nextImportGuideKeys = ["import-board-instruction-superproductivity", "import-board-instruction-taiga", "import-board-instruction-vikunja", "import-board-instruction-quire", "import-board-instruction-wrike", "import-board-instruction-teamwork", "import-board-instruction-businessmap", "import-board-instruction-redmine", "import-board-instruction-notion", "import-board-instruction-plane"];
for (const key of nextImportGuideKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const format of ['taiga', 'vikunja']) assert.match(latin[`import-board-instruction-${format}`], /Adiuncta non importantur/);
assert.match(latin['import-board-instruction-quire'], /Commentaria et adiuncta.*non sunt/);
assert.match(latin['import-board-instruction-notion'], /prima columna.*relatio importationis.*Relationes, imagines et adiuncta non importantur/);
assert.match(latin['import-board-instruction-plane'], /descriptiones aut adiuncta non continet.*non importantur/);
for (const marker of ['-', '#', '>', '--', '##', '>>']) assert.ok(latin['import-board-instruction-teamwork'].includes(marker));
assert.match(latin['import-board-instruction-businessmap'], /nominibus Anglicis.*ordine capitum.*in Anglicum muta/);
assert.match(latin['import-board-instruction-redmine'], /ante exportationem in My account linguam Anglicam elige/);
assert.match(latin['import-board-instruction-taiga'], /[.]json[.]gz decomprime/);
assert.match(latin['import-board-instruction-superproductivity'], /opera in tabulario posita fiunt chartae in tabulario positae/);

const mappingKeys = ["import-members-mode-heading", "import-members-mode-map", "import-members-mode-placeholder", "import-members-mode-me", "csv-mapping-title", "csv-mapping-description", "csv-mapping-not-in-file", "csv-mapping-column-number", "csv-mapping-list-missing", "csv-mapping-list-name", "csv-mapping-custom-fields", "csv-mapping-boards", "csv-mapping-skipped-sheets", "csv-mapping-title-required", "csv-mapping-list-required", "invalid-import-mapping", "import-many-boards", "import-many-boards-hint", "import-one-board-per-project", "import-one-board-per-project-hint", "import-many-progress", "import-many-results-heading", "import-many-imported", "export-all-boards", "export-selected-boards", "export-all-boards-hint", "exportAllBoardsPopup-title", "exportToTrelloPopup-title", "trello-export-desc", "trello-export-include-attachments", "trello-export-start", "trello-export-open-board", "trello-export-warnings", "sandstorm-trello-access-needed", "sandstorm-allow-trello-access"];
for (const key of mappingKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['export-all-boards'], latin['exportAllBoardsPopup-title']);
assert.equal(latin['trello-export-start'], latin['exportToTrelloPopup-title']);
assert.ok(latin['csv-mapping-description'].includes(latin['csv-mapping-not-in-file']));
assert.match(latin['import-members-mode-placeholder'], /propriis nominibus.*postea cum veris usoribus/);
assert.match(latin['import-many-boards-hint'], /sine coniunctione membrorum.*ipse una exportatio.*una tabula.*loco campi superioris/);
assert.match(latin['import-one-board-per-project-hint'], /necessitudines inter illas tabulas.*relatione importationis/);
assert.match(latin['export-all-boards-hint'], /quas exportare potes.*unus liber.*ceterae formae.*[.]zip/);
assert.match(latin['trello-export-desc'], /Swimlane: ….*rursus in semitas/);
assert.match(latin['sandstorm-trello-access-needed'], /nullum proprium accessum.*Primum permitte/);

const notificationKeys = ["sandstorm-trello-access-granted", "sandstorm-forget-access", "sandstorm-trello-save-label", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "webhook-payload-heading", "webhook-payload-description", "webhook-payload-text", "webhook-payload-fields", "webhook-payload-field-standard", "webhook-payload-field-ids", "webhook-payload-field-names", "webhook-payload-field-links", "webhook-payload-field-actor", "webhook-payload-field-people", "webhook-payload-field-details", "webhook-hide-identity", "webhook-someone", "notification-delivery-layout-classic", "notification-delivery-layout-clear", "notification-delivery-parts", "notification-delivery-part-board", "notification-delivery-part-actor", "notification-delivery-part-card", "notification-delivery-part-details", "notification-delivery-part-dates", "notification-delivery-part-link", "notification-delivery-grouping", "notification-delivery-grouping-all", "notification-delivery-grouping-board", "notification-delivery-grouping-card", "notification-delivery-grouping-none", "notification-delivery-schedule", "notification-delivery-schedule-immediate", "notification-delivery-schedule-interval", "notification-delivery-schedule-daily", "notification-delivery-interval", "notification-delivery-minutes", "notification-delivery-quiet", "notification-delivery-quiet-clear", "notification-delivery-timezone", "notification-delivery-invalid", "notification-group-card", "notification-group-board", "read-only-field"];
for (const key of notificationKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['webhook-payload-description'], /optionem hereditatam servat.*si nihil definitum est.*semper miserunt/);
assert.ok(latin['webhook-payload-field-standard'].includes('WEBHOOKS_ATTRIBUTES'));
assert.match(latin['webhook-hide-identity'], /Nomen meum.*omitte/);
assert.match(latin['notification-delivery-grouping-all'], /Omnia mittenda in uno nuntio/);
assert.notEqual(latin['notification-delivery-grouping-board'], latin['notification-delivery-grouping-card']);
assert.match(latin['notification-delivery-quiet'], /exspecta donec finiantur/);
assert.match(latin['read-only-field'], /omne membrum.*soli administratores tabulae.*mutant/);
for (const key of ['external-link-rules-description', 'external-link-identifier-aliases']) {
  const braces = text => (text.match(/[{](?:number|identifier)[}]/g) || []).sort();
  assert.deepEqual(braces(latin[key]), braces(english[key]));
}
assert.ok(latin['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(latin['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));

const workflowScrumKeys = ["r-wrike-workflow", "r-wrike-workflow-note", "r-export-wrike-workflow", "r-import-wrike-workflow", "r-import-wrike-workflow-done", "r-moved-forward", "r-moved-back", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "import-file-label", "subtask-mark-done", "subtask-mark-not-done", "subtask-done-no-permission", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished"];
for (const key of workflowScrumKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const literal of ['Active', 'Completed', 'Deferred', 'Cancelled', 'GET /workflows']) assert.ok(latin['r-wrike-workflow-note'].includes(literal));
assert.match(latin['r-wrike-workflow-note'], /exportari non possunt/);
for (const name of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) assert.ok(latin['ldap-sync-now-nothing'].includes(name));
assert.match(latin['oauth-providers-allowed-email-domains'], /commatibus separatis.*si vacuum est, omnibus licet/);
assert.notEqual(latin['subtask-mark-done'], latin['subtask-mark-not-done']);
assert.match(latin['scrum-import-into-board-hint'], /numquam duplicantur.*per ID.*numerum chartae et titulum.*immutatae relinquuntur.*Primum praevisionem/);
assert.match(latin['scrum-import-card-on-another-board'], /aliam tabulam.*immutata/);
assert.match(latin['scrum-import-sprint-finished'], /perfectum non mota/);
assert.match(latin['scrum-releases-select-help'], /Ctrl.*Cmd.*omnes electiones tolle.*omnibus editionibus/);
assert.equal(latin['scrum-import-preview'], 'Praevisio');
assert.equal(latin.history, 'Historia');

const recoveryKeys = ["sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "stuck-sync-operation-heading", "stuck-sync-operation-description", "stuck-sync-operation-list", "stuck-sync-operation-applied", "stuck-sync-operation-reason-scope-changed", "stuck-sync-operation-reason-access-denied", "stuck-sync-operation-reason-trigger-unknown", "stuck-sync-operation-reason-intent-missing", "stuck-sync-operation-reason-unknown", "stuck-sync-operation-replayable-now", "stuck-sync-operation-discard-confirm", "stuck-sync-operation-empty", "stuck-sync-operation-truncated", "stuck-sync-operation-unavailable", "stuck-sync-operation-missing", "stuck-sync-operation-not-stuck", "stuck-sync-operation-replayable", "stuck-sync-operation-busy", "interrupted-import-heading", "interrupted-import-description", "interrupted-import-progress", "interrupted-import-created", "interrupted-import-source", "interrupted-import-state-stopped", "interrupted-import-state-failed", "interrupted-import-state-discarding", "interrupted-import-scrum", "interrupted-import-counts", "interrupted-import-no-board", "interrupted-import-keep", "interrupted-import-keep-confirm", "interrupted-import-discard-confirm", "interrupted-import-empty", "interrupted-import-truncated", "interrupted-import-unavailable", "interrupted-import-missing", "interrupted-import-not-interrupted", "interrupted-import-foreign-board", "interrupted-import-scrum-busy", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of recoveryKeys) {
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['sync-planning-hint'], /primum per ID fontis, deinde per nomen/);
assert.match(latin['sync-planning-hint'], /prima synchronizatio consilium numquam removet/);
assert.match(latin['stuck-sync-operation-discard-confirm'], /iam adhibitae manent; ceterae numquam scribuntur/);
assert.match(latin['stuck-sync-operation-replayable'], /ideo abiecta non est/);
assert.match(latin['interrupted-import-description'], /continuari non potest, quia fasciculus fontis non servatur/);
assert.match(latin['interrupted-import-description'], /etiam ea quae postea addita sunt/);
assert.match(latin['interrupted-import-keep-confirm'], /Nihil removetur/);
assert.match(latin['interrupted-import-discard-confirm'], /in perpetuum removentur/);
assert.match(latin['interrupted-import-foreign-board'], /ideo immutata mansit/);
assert.match(latin['scrum-history-checkpoint-hint'], /tantum si nemo alius eas res postea mutavit/);
assert.match(latin['scrum-history-checkpoint-hint'], /nullas res mutat/);
assert.match(latin['login-setting-env-only'], /tantum per ambitum servitoris.*sine facultate mutandi/);

const reviewedActivityKeys = ["accept", "activity-changedTitle", "activity-changedDescription", "act-deleteCard", "act-removeBoard", "act-removeList", "act-removeSwimlane", "board-members-same-org-only", "board-members-same-team-only", "comment-in-reply-to", "comment-reply", "restrict-comment-editing", "due-date-changes", "due-date-changed-times", "error-user-notSameOrgOrTeam", "act-activity-notify", "act-addAttachment", "act-deleteAttachment", "act-addSubtask", "act-addLabel", "act-addedLabel", "act-removeLabel", "act-removedLabel", "act-addChecklist", "act-addChecklistItem", "act-removeChecklist", "act-removeChecklistItem", "act-checkedItem", "act-uncheckedItem", "act-completeChecklist", "act-uncompleteChecklist", "act-addComment", "act-editComment", "act-deleteComment", "act-createBoard", "act-createSwimlane", "act-createCard", "act-createCustomField", "act-deleteCustomField", "act-setCustomField", "act-createList", "act-addBoardMember", "act-archivedBoard", "act-archivedCard", "act-archivedList", "act-archivedSwimlane", "act-importBoard", "act-importCard", "act-importList", "act-joinMember", "act-moveCard", "act-moveCardToOtherBoard", "act-removeBoardMember", "act-restoredCard", "act-unjoinMember", "actions", "activity-added", "activity-archived", "activity-attached", "activity-created", "activity-changedListTitle", "activity-customfield-created", "activity-excluded", "activity-imported", "activity-imported-board"];
for (const key of reviewedActivityKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:checked|unchecked|uncompleted|commented|editing|deleting|times|at|the)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['activity-changedTitle'], /in %s rei %s/);
assert.match(latin['act-moveCardToOtherBoard'], /ex indice __oldList__.*__oldSwimlane__.*__oldBoard__.*in indicem __list__.*__swimlane__.*__board__/);
assert.match(latin['act-checkedItem'], / perfectam notavit/);
assert.match(latin['act-uncheckedItem'], / imperfectam notavit/);
assert.match(latin['restrict-comment-editing'], /Prohibe administratores.*aliorum usorum.*mutent vel deleant/);
assert.equal(latin['act-addLabel'], latin['act-addedLabel']);
assert.equal(latin['act-removeLabel'], latin['act-removedLabel']);
assert.match(latin['act-restoredCard'], /restituit/);
assert.match(latin['act-deleteCard'], /delevit/);

const reviewedBoardKeys = ["activity-joined", "activity-moved", "activity-on", "activity-removed", "activity-sent", "activity-unjoined", "activity-subtask-added", "activity-checked-item", "activity-unchecked-item", "activity-checklist-added", "activity-checklist-removed", "activity-checklist-completed", "activity-checklist-uncompleted", "activity-checklist-item-added", "activity-checklist-item-removed", "activity-checked-item-card", "activity-unchecked-item-card", "activity-checklist-completed-card", "activity-checklist-uncompleted-card", "activity-editComment", "activity-deleteComment", "activity-receivedDate", "activity-startDate", "allboards.starred", "allboards.remaining", "allboards.workspaces", "allboards.add-workspace", "allboards.add-workspace-prompt", "allboards.add-subworkspace", "allboards.add-subworkspace-prompt", "allboards.edit-workspace", "allboards.edit-workspace-name", "allboards.edit-workspace-icon", "allboards.workspace-menu", "workspace-settings", "workspaceActionsPopup-title", "addWorkspacePopup-title", "allboards.workspace-color", "allboards.delete-workspace-confirm", "allboards.delete-workspace-confirm-check", "multi-selection-active", "archive-permanent-delete-disabled-hint", "no-boards-selected", "select-only-one-board", "selected-label", "set-selected-starred", "set-selected-unstarred", "set-selected-home", "unset-selected-home", "home-board-badge", "home-board-empty", "home-board-remove", "home-board-remove-confirm", "activity-dueDate", "activity-endDate", "add-template", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "setListWidthPopup-title", "set-list-width"];
for (const key of reviewedBoardKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:checked|unchecked|uncompleted|Workspace|workspace|Please|Click|after|login)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['allboards.workspace-color'], 'Color'); // Valid Latin shared with English.
assert.equal(latin['workspace-settings'], latin['workspaceActionsPopup-title']);
assert.equal(latin['allboards.add-workspace'], latin['addWorkspacePopup-title']);
assert.match(latin['activity-moved'], /%s ex %s ad %s/);
for (const key of ['activity-receivedDate', 'activity-startDate', 'activity-dueDate', 'activity-endDate']) assert.match(latin[key], /in %s rei %s/);
assert.match(latin['activity-checked-item'], / perfectam notavit/);
assert.match(latin['activity-unchecked-item'], / imperfectam notavit/);
assert.match(latin['home-board-remove-confirm'], /Ipsa tabula non deletur/);
assert.match(latin['home-board-empty'], /Unam tantum.*post ingressum/);
assert.match(latin['archive-permanent-delete-disabled-hint'], /Si.*administrator globalis.*in perpetuum.*hic apparebit/);
assert.match(latin['add-card-to-top-of-list'], /initium/);
assert.match(latin['add-card-to-bottom-of-list'], /finem/);

const reviewedSizingKeys = ["set-list-width-value", "list-width-shared-note", "list-width-personal-note", "personal-list-width", "personal-list-width-description", "fixed-list-width", "click-to-enable-fixed-list-width", "click-to-disable-fixed-list-width", "fixed-list-width-note", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled", "setSwimlaneHeightPopup-title", "set-swimlane-height", "set-swimlane-height-value", "swimlane-height-error-message", "add-subtask", "add-existing-card-as-subtask-empty", "add-checklist", "close-add-checklist-item", "close-edit-checklist-item", "convertChecklistItemToCardPopup-title", "add-cover", "add-label", "add-after-list", "add-members", "added", "addMemberPopup-title", "admin", "admin-desc", "admin-announcement", "admin-announcement-active", "admin-announcement-title", "all-boards-hide", "public-boards", "and-n-other-card", "and-n-other-card_plural", "apply", "app-is-offline", "app-try-reconnect", "archive-board-confirm", "archive-list", "archive-swimlane", "archive-selection", "archiveBoardPopup-title", "archived-items", "archived-boards", "restore-board", "no-archived-boards", "archives", "template-container", "add-template-container", "assign-member", "attached", "attachment-delete-pop", "attachmentDeletePopup-title"];
for (const key of reviewedSizingKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:width|Height|shared|everyone|Keyboard|shortcuts|Loading|Deleting|There|Template)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['list-width-shared-note'], /omnibus/);
assert.match(latin['list-width-personal-note'], /tibi soli/);
assert.match(latin['fixed-list-width-note'], /unius indicis.*omnium.*tibi soli/);
assert.match(latin['click-to-enable-fixed-list-width'], /inactiva.*ut actives/);
assert.match(latin['click-to-disable-fixed-list-width'], / activa.*ut inactives/);
assert.match(latin['keyboard-shortcuts-enabled'], /activa.*ut inactives/);
assert.match(latin['keyboard-shortcuts-disabled'], /inactiva.*ut actives/);
assert.match(latin['swimlane-height-error-message'], /integer positivus/);
assert.match(latin['app-is-offline'], /renovare iacturam datorum efficiet/);
assert.match(latin['attachment-delete-pop'], /perpetua.*Revocari non potest/);
assert.equal(latin['set-swimlane-height'], latin['setSwimlaneHeightPopup-title']);
assert.equal(latin['add-members'], latin['addMemberPopup-title']);
assert.equal(latin['archived-items'], latin.archives);
assert.notEqual(latin['and-n-other-card'], latin['and-n-other-card_plural']);

const reviewedDisplayKeys = ["auto-watch", "avatar-too-big", "board-change-color", "board-change-background-image", "board-background-image-url", "add-background-image", "remove-background-image", "show-at-all-boards-page", "board-info-on-my-boards", "boardInfoOnMyBoardsPopup-title", "boardInfoOnMyBoards-title", "show-card-counter-per-list", "show-board_members-avatar", "board_members", "card_members", "board_assignees", "card_assignees", "board-nb-stars", "board-not-found", "board-private-info", "board-public-info", "board-drag-drop-reorder-or-click-open", "board-open-and-move-between-remaining-and-workspaces", "boardChangeColorPopup-title", "changeColorPopup-title", "changeFontPopup-title", "boardChangeBackgroundImagePopup-title", "allBoardsChangeColorPopup-title", "allBoardsChangeBackgroundImagePopup-title", "boardChangeTitlePopup-title", "boardChangeVisibilityPopup-title", "boardChangeWatchPopup-title", "boardChangeViewPopup-title", "board-view", "desktop-mode", "mobile-mode", "mobile-desktop-toggle", "zoom-in", "zoom-out", "zoom-level", "enter-zoom-level", "board-view-cal", "board-view-multiboard-cal", "board-view-collapse"];
for (const key of reviewedDisplayKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Background|Image|Visibility|Watch|Calendar|Collapse|Zoom|Click|stars)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['board-private-info'], /<strong>privata<[/]strong>/);
assert.match(latin['board-public-info'], /<strong>publica<[/]strong>/);
assert.match(latin['board_assignees'], /chartae.*assignatae sunt/);
assert.match(latin['card_assignees'], /charta praesens.*assignata est/);
assert.match(latin['board-open-and-move-between-remaining-and-workspaces'], /ansa trahendi.*__workspaces__.*margine laterali/);
assert.match(latin['avatar-too-big'], /maximum __size__/);
assert.ok(latin['enter-zoom-level'].includes('50-300%'));
assert.notEqual(latin['zoom-in'], latin['zoom-out']);
assert.equal(latin['board-view'], latin['boardChangeViewPopup-title']);
for (const key of ['boardInfoOnMyBoardsPopup-title', 'boardInfoOnMyBoards-title']) assert.equal(latin[key], latin['board-info-on-my-boards']);
for (const key of ['boardChangeBackgroundImagePopup-title', 'allBoardsChangeBackgroundImagePopup-title']) assert.equal(latin[key], latin['board-change-background-image']);

const reviewedArchiveKeys = ["board-view-gantt", "board-view-table", "board-view-stats", "bucket-example", "calendar-previous-month-label", "calendar-next-month-label", "card-archived", "board-archived", "card-comments-title", "card-delete-notice", "card-delete-pop", "card-delete-suggest-archive", "card-archive-pop", "card-archive-suggest-cancel", "list-archive-pop", "list-archive-suggest", "listArchivePopup-title", "swimlane-archive-pop", "swimlane-archive-suggest", "swimlaneArchivePopup-title", "card-due", "card-due-on", "card-spent", "card-edit-attachments", "card-edit-custom-fields", "card-edit-labels", "card-edit-members", "card-labels-title", "card-members-title", "card-start-on", "cardAttachmentsPopup-title", "cardCustomField-datePopup-title", "cardCustomFieldsPopup-title", "cardStartVotingPopup-title", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "card-edit-voting", "editVoteEndDatePopup-title", "allowNonBoardMembers", "vote-question"];
for (const key of reviewedArchiveKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Deleting|There|Archive|voting|logged|custom|Starts|Attach)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['board-view-gantt'], 'Gantt');
assert.match(latin['card-delete-notice'], /perpetua.*Omnes actiones.*amittes/);
assert.match(latin['card-delete-pop'], /rursus aperire non poteris.*Revocari non potest/);
assert.match(latin['card-delete-suggest-archive'], /actiones serves/);
for (const key of ['card-archive-suggest-cancel', 'list-archive-suggest', 'swimlane-archive-suggest']) assert.match(latin[key], /postea ex archivo.*restituere potes/);
assert.match(latin.allowNonBoardMembers, /omnibus usoribus qui ingressi sunt/);
assert.notEqual(latin['positiveVoteMembersPopup-title'], latin['negativeVoteMembersPopup-title']);
assert.equal(latin['card-edit-custom-fields'], latin['cardCustomFieldsPopup-title']);
assert.match(latin['card-members-title'], /chartae.*a charta remove/);

const reviewedPokerKeys = ["vote-public", "vote-for-it", "vote-against", "deleteVotePopup-title", "vote-delete-pop", "cardStartPlanningPokerPopup-title", "card-edit-planning-poker", "editPokerEndDatePopup-title", "poker-question", "poker-one", "poker-two", "poker-three", "poker-five", "poker-eight", "poker-thirteen", "poker-twenty", "poker-forty", "poker-oneHundred", "poker-unsure", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "set-estimation", "deletePokerPopup-title", "poker-delete-pop", "cardArchivePopup-title", "cardDetailsActionsPopup-title", "cardDependenciesPopup-title", "cardDependencyIconPopup-title", "dependencyLinePopup-title", "importDependenciesPopup-title", "addBoardOrgPopup-title", "addBoardTeamPopup-title", "removeBoardOrgPopup-title", "removeBoardTeamPopup-title", "adminChangeAvatarPopup-title", "boardBackgroundsPopup-title", "deleteBoardBackgroundPopup-title", "deleteDuplicateListsPopup-title", "userDeletePopup-title", "userAnonymizePopup-title", "addBoardDomainPopup-title", "removeBoardDomainPopup-title", "mapImportedMemberPopup-title"];
for (const key of reviewedPokerKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Deleting|There|Finish|Replay|Background|Account|existing)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const key of ['one', 'two', 'three', 'five', 'eight', 'thirteen', 'twenty', 'forty', 'oneHundred', 'unsure']) assert.equal(latin[`poker-${key}`], english[`poker-${key}`]);
assert.equal(latin['poker-question'], 'Planning Poker');
assert.equal(latin['vote-for-it'], 'pro');
assert.equal(latin['vote-against'], 'contra');
for (const key of ['vote-delete-pop', 'poker-delete-pop']) assert.match(latin[key], /perpetua.*Omnes actiones.*amittes/);
assert.match(latin['userAnonymizePopup-title'], /anonymam/);
assert.doesNotMatch(latin['userAnonymizePopup-title'], /importa/i);
assert.notEqual(latin['userAnonymizePopup-title'], latin['userDeletePopup-title']);
assert.match(latin['mapImportedMemberPopup-title'], /usore iam exsistente/);
assert.notEqual(latin['poker-finish'], latin['poker-replay']);

const reviewedMemberKeys = ["exportChecklistPopup-title", "importSwimlanePopup-title", "importListPopup-title", "importCardPopup-title", "importBoardIntoPopup-title", "userPopup-title", "cardMemberPopup-title", "cardStickersPopup-title", "invitePeoplePopup-title", "listsortPopup-title", "listWidthErrorPopup-title", "restoreArchivedCardToListPopup-title", "restoreArchivedListToSwimlanePopup-title", "rulesImportExportPopup-title", "swimlaneHeightErrorPopup-title", "bookmarksPopup-title", "cardTemplatePopup-title", "casSignIn", "samlSignIn", "cardType-linkedBoard", "change", "change-avatar", "change-color", "change-permissions", "map-to-existing-user", "map-to-existing-user-desc", "map-to-existing-user-search", "map-to-existing-user-not-member", "map-to-existing-user-none", "map-to-existing-user-no-results", "change-settings", "theme-default", "theme-category", "theme-category-flat", "theme-category-clear", "theme-category-dark", "theme-category-special", "change-font", "font", "font-default"];
for (const key of reviewedMemberKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Pick|Their|Search|matching|existing|Category|Font|override|custom)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['map-to-existing-user-desc'], /Chartae, commentarii et actiones.*transferuntur/);
assert.match(latin['map-to-existing-user-desc'], /nondum membrum.*eodem munere.*numquam plures facultates/);
assert.match(latin['map-to-existing-user-search'], /omnes usores.*nomen, nomen usoris vel inscriptionem electronicam/);
assert.equal(latin['map-to-existing-user'], latin['mapImportedMemberPopup-title']);
assert.equal(latin.font, latin['change-font']);
assert.equal(latin.font, latin['changeFontPopup-title']);
assert.equal(latin['userPopup-title'], latin['cardMemberPopup-title']);
assert.equal(latin['theme-category-clear'], 'Clarum');
assert.notEqual(latin['theme-category-clear'], latin['theme-category-dark']);
assert.match(latin.casSignIn, /CAS$/);
assert.match(latin.samlSignIn, /SAML$/);
