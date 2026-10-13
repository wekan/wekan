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

const reviewedFontAgingKeys = ["font-preview-text", "font-size", "font-size-default", "font-size-smaller", "font-size-small", "font-size-large", "font-size-larger", "font-size-largest", "text-color", "text-background-color", "changeAvatarPopup-title", "delete-avatar-confirm", "deleteAvatarPopup-title", "changeLanguagePopup-title", "changePermissionsPopup-title", "changeSettingsPopup-title", "subtasks", "click-to-star", "click-to-unstar", "click-to-star-page", "click-to-unstar-page", "click-to-enable-auto-width", "click-to-disable-auto-width", "auto-list-width", "clipboard", "card-aging", "card-aging-days", "card-aging-tier1", "card-aging-tier2", "card-aging-tier3", "move-card-up", "move-card-down", "move-list-left", "move-list-right", "close-board"];
for (const key of reviewedFontAgingKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Click|Tier|Fade|idle|Smaller|Largest|background|aging)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['font-preview-text'], /0123456789$/);
assert.equal(new Set(['smaller', 'small', 'large', 'larger', 'largest'].map(size => latin[`font-size-${size}`])).size, 5);
assert.match(latin['click-to-enable-auto-width'], /inactiva.*ut actives/);
assert.match(latin['click-to-disable-auto-width'], / activa.*ut inactives/);
for (const tier of [1, 2, 3]) assert.match(latin[`card-aging-tier${tier}`], /dies sine actione/);
assert.match(latin['card-aging-tier1'], /leviter/);
assert.match(latin['card-aging-tier2'], /mediocriter/);
assert.match(latin['card-aging-tier3'], /valde/);
assert.match(latin['move-card-up'], /sursum$/);
assert.match(latin['move-card-down'], /deorsum$/);
assert.match(latin['move-list-left'], /sinistrorsum$/);
assert.match(latin['move-list-right'], /dextrorsum$/);
assert.equal(latin['changeAvatarPopup-title'], latin['adminChangeAvatarPopup-title']);
assert.equal(latin['changeSettingsPopup-title'], latin['change-settings']);

const reviewedColorKeys = ["close-dialog", "close-popup", "go-back", "modal-title", "skip-to-content", "close-board-pop", "close-card", "color-black", "color-blue", "color-crimson", "color-darkgreen", "color-gold", "color-gray", "color-green", "color-indigo", "color-lime", "color-magenta", "color-mistyrose", "color-navy", "color-orange", "color-paleturquoise", "color-peachpuff", "color-pink", "color-plum", "color-purple", "color-red", "color-saddlebrown", "color-silver", "color-sky", "color-slateblue", "color-white", "color-yellow"];
for (const key of reviewedColorKeys) {
  assert.doesNotMatch(latin[key], /Latine:/, key);
  assert.notEqual(latin[key], english[key], key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
const colorKeys = Object.keys(english).filter(key => key.startsWith('color-'));
assert.equal(new Set(colorKeys.map(key => latin[key])).size, colorKeys.length);
assert.equal(latin['color-black'], 'niger');
assert.equal(latin['color-white'], 'albus');
assert.equal(latin['color-red'], 'ruber');
assert.match(latin['color-darkgreen'], /viridis obscurus/);
assert.match(latin['color-paleturquoise'], /pallidus/);
assert.match(latin['skip-to-content'], /materiam principalem/);
assert.match(latin['close-board-pop'], /Archivo.*pagina omnium tabularum/);
assert.doesNotMatch(latin['close-board-pop'], /domus header/);

const reviewedRoleKeys = ["unset-color", "comment-placeholder", "comment-only", "comment-only-desc", "comment-assigned-only", "comment-assigned-only-desc", "comment-delete", "deleteCommentPopup-title", "no-comments", "no-comments-desc", "read-only", "read-only-desc", "read-assigned-only", "read-assigned-only-desc", "worker", "worker-desc", "computer", "confirm-subtask-delete-popup", "confirm-checklist-delete-popup", "confirm-checklist-item-delete-popup", "confirm-move-list-to-swimlane", "subtaskDeletePopup-title", "checklistDeletePopup-title", "checklistItemDeletePopup-title", "copy-card-link-to-clipboard", "copy-link-to-clipboard", "copy-text-to-clipboard", "copyListPopup-title", "copyManyCardsPopup-title", "copyManyCardsPopup-instructions"];
for (const key of reviewedRoleKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Assigned|Worker|Computer|Clipboard|Template|Titles|Descriptions)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['comment-placeholder'], '');
for (const key of ['comment-assigned-only-desc', 'read-assigned-only-desc']) assert.match(latin[key], /Solum chartae assignatae visibiles/);
for (const key of ['read-only-desc', 'read-assigned-only-desc']) assert.match(latin[key], /Mutare non potest/);
assert.match(latin['no-comments-desc'], /videre non potest/);
assert.match(latin['worker-desc'], /Tantum chartas movere, se ipsum chartae assignare et commentarios addere/);
assert.match(latin['confirm-move-list-to-swimlane'], /omnes eius chartas in aliam semitam/);
assert.match(latin['copyManyCardsPopup-instructions'], /Tituli et descriptiones.*JSON$/);
assert.notEqual(latin['checklistDeletePopup-title'], latin['checklistItemDeletePopup-title']);

const reviewedFieldKeys = ["createTemplateContainerPopup-title", "chooseBoardSourcePopup-title", "createLabelPopup-title", "createCustomField", "createCustomFieldPopup-title", "current", "custom-color", "custom-field-delete-pop", "custom-field-checkbox", "custom-field-currency", "custom-field-currency-option", "custom-field-dropdown", "custom-field-dropdown-none", "custom-field-dropdown-options", "custom-field-dropdown-options-placeholder", "custom-field-dropdown-unknown", "custom-field-number", "custom-field-text", "date-format", "date-format-yyyy-mm-dd", "date-format-dd-mm-yyyy", "date-format-mm-dd-yyyy", "decline", "default-avatar", "enable-permanent-delete", "enable-permanent-delete-description", "deleteCustomFieldPopup-title", "deleteLabelPopup-title", "disambiguateMultiLabelPopup-title", "disambiguateMultiMemberPopup-title", "discard", "download", "edit-profile", "edit-wip-limit", "soft-wip-limit", "editCardStartDatePopup-title", "editCardDueDatePopup-title", "editCustomFieldPopup-title", "addReactionPopup-title", "editCardSpentTimePopup-title", "editLabelPopup-title", "editNotificationPopup-title", "editProfilePopup-title", "email-enrollAccount-subject", "email-enrollAccount-text", "email-fail", "email-fail-text", "email-invalid", "email-invite", "email-invite-subject"];
for (const key of reviewedFieldKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Checkbox|Currency|Disambiguate|Sending|Hello|Thanks|trying|Invalidum)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const key of ['yyyy-mm-dd', 'dd-mm-yyyy', 'mm-dd-yyyy']) assert.equal(latin[`date-format-${key}`], english[`date-format-${key}`]);
assert.match(latin['custom-field-delete-pop'], /Revocari non potest.*omnibus chartis.*historia eius delebitur/);
assert.match(latin['enable-permanent-delete-description'], /administratoribus globalibus.*nondum penitus deletae.*per se nihil delet/);
assert.match(latin['email-invite-subject'], /^__inviter__ invitationem tibi misit$/);
assert.ok(latin['email-enrollAccount-text'].includes('\n\n__url__\n\n'));
assert.equal(latin['createCustomField'], latin['createCustomFieldPopup-title']);
assert.equal(latin['edit-profile'], latin['editProfilePopup-title']);
assert.notEqual(latin['custom-field-dropdown-none'], latin['custom-field-dropdown-unknown']);

const reviewedEmailErrorKeys = ["email-invite-text", "push-invite-title", "push-invite-text", "email-resetPassword-subject", "email-resetPassword-text", "email-sent", "email-verifyEmail-subject", "email-verifyEmail-text", "enable-vertical-scrollbars", "enable-wip-limit", "error-board-doesNotExist", "error-board-notAdmin", "error-board-notAMember", "error-watch-disabled", "error-notAllowed", "error-json-malformed", "error-json-schema", "error-csv-schema", "error-import-empty-board", "error-list-doesNotExist", "error-linked-card-not-allowed", "error-user-disabled", "error-user-doesNotExist", "error-user-notAllowSelf", "error-user-notCreated"];
for (const key of reviewedEmailErrorKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Dear|Hello|Please|Thanks|Your|This|because|another|yourself)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const key of ['email-invite-text', 'push-invite-text', 'email-resetPassword-text', 'email-verifyEmail-text']) assert.ok(latin[key].includes('\n\n__url__\n\n'), key);
assert.equal(latin['email-invite-text'], latin['push-invite-text']);
assert.equal(latin['push-invite-title'], latin['email-invite-subject']);
assert.match(latin['error-board-notAdmin'], /^Administrator/);
assert.match(latin['error-board-notAMember'], /^Membrum/);
assert.match(latin['error-import-empty-board'], /nullas semitas, indices vel chartas.*rursus exporta versione praesenti.*novum fasciculum importa/);
assert.match(latin['error-linked-card-not-allowed'], /chartam ordinariam.*Aliam chartam coniunctam.*ad hanc tabulam rursus ducit.*inaccessibiles/);
assert.match(latin['error-user-notAllowSelf'], /Te ipsum.*non potes/);
assert.match(latin['error-csv-schema'], /CSV.*commatibus.*TSV.*tabulatoribus/);
assert.notEqual(latin['email-resetPassword-text'], latin['email-verifyEmail-text']);

const reviewedExportKeys = ["error-username-taken", "error-orgname-taken", "error-teamname-taken", "error-email-taken", "export-board-without-attachments", "export-ical-feed", "user-can-not-export-excel", "export-card", "export-card-pdf", "export-card-excel", "export-card-excel-fields", "export-card-subtasks", "export-card-field-people", "export-card-field-board-info", "export-card-field-dates", "export-card-attachment-filename", "export-card-attachment-size", "export-card-attachment-type", "export-card-attachment-uploaded-by", "export-card-attachment-uploaded-at", "export-card-attachment-image-previews", "export-card-excel-no-disk-space", "export-card-excel-free", "export-card-excel-needed", "user-can-not-export-card-to-pdf", "user-can-not-export-card-to-excel", "exportCardPopup-title", "sorted", "remove-sort", "sort-desc"];
for (const key of reviewedExportKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:already|taken|Filename|Previews|Uploaded|Received|Sorted|Click)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const key of ['user-can-not-export-excel', 'user-can-not-export-card-to-pdf', 'user-can-not-export-card-to-excel']) assert.match(latin[key], /exportare non potest$/);
assert.match(latin['export-card-excel-no-disk-space'], /spatium liberum in disco non sufficit/);
assert.notEqual(latin['export-card-excel-free'], latin['export-card-excel-needed']);
assert.match(latin['export-card-attachment-uploaded-by'], /^A quo/);
assert.match(latin['export-card-attachment-uploaded-at'], /^Quando/);
assert.equal(latin['exportCardPopup-title'], latin['export-card']);
assert.equal(latin['export-card-subtasks'], latin.subtasks);
assert.match(latin['export-card-field-dates'], /Creationis, Acceptionis, Initii, Debitus, Finis/);
assert.match(latin['export-board-without-attachments'], /^sine /);
assert.match(latin['export-ical-feed'], /iCal/);

const reviewedFilterKeys = ["list-sort-by", "list-label-modifiedAt", "list-label-title", "list-label-sort", "list-label-short-modifiedAt", "list-label-short-title", "list-label-short-sort", "filter-cards", "filter-dates-label", "filter-no-due-date", "filter-overdue", "filter-due-today", "filter-due-this-week", "filter-due-next-week", "filter-due-tomorrow", "list-filter-label", "filter-clear", "filter-labels-label", "filter-no-label", "filter-member-label", "filter-no-member", "filter-assignee-label", "filter-creator-label", "filter-no-assignee", "filter-custom-fields-label", "filter-no-custom-fields", "filter-show-archive", "filter-hide-empty", "filter-on", "filter-on-desc"];
for (const key of reviewedFilterKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Overdue|Due|assignee|filtering|Click|Custom|Access|Order)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['filter-due-today'], /hodie$/);
assert.match(latin['filter-due-tomorrow'], /cras$/);
assert.match(latin['filter-due-this-week'], /hac hebdomade$/);
assert.match(latin['filter-due-next-week'], /hebdomade proxima$/);
assert.match(latin['filter-overdue'], /praeteriit$/);
for (const key of ['filter-no-due-date', 'filter-no-label', 'filter-no-member', 'filter-no-assignee', 'filter-no-custom-fields']) assert.match(latin[key], /^Sine /);
assert.equal(new Set(['filter-member-label', 'filter-assignee-label', 'filter-creator-label'].map(key => latin[key])).size, 3);
assert.match(latin['filter-show-archive'], /Monstra.*archivo/);
assert.match(latin['filter-hide-empty'], /Cela.*vacuos/);
assert.equal(latin['list-label-short-modifiedAt'], '(U)');
assert.equal(latin['list-label-short-title'], '(N)');
assert.equal(latin['list-label-short-sort'], '(M)');

const reviewedImportKeys = ["filter-to-selection", "other-filters-label", "advanced-filter-label", "fullname", "show-activities", "hide-activities", "imported-member-no-account", "inactive-member", "impersonate-user", "import-board", "import-board-c", "import-board-instruction-kanboard", "import-board-instruction-deck", "import-board-instruction-openproject", "import-board-instruction-issues", "import-board-instruction-asana", "import-board-instruction-zenkit", "import-board-instruction-csv", "import-board-instruction-jira", "import-board-instruction-excel", "import-excel-file", "import-board-instruction-wekan", "import-board-instruction-about-errors", "import-without-mapping-members", "import-json-placeholder", "import-csv-placeholder", "import-json-file", "import-attachments-zip", "import-trello-json-file", "advanced-filter-description"];
for (const key of reviewedImportKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Paste|Advanced|For Example|Note:|sometimes|mapping|optional)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const example of ['== != <= >= && || ( )', 'Field1 == Value1', "'Field 1' == 'Value 1'", "Field1 == I\\'m", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) assert.ok(latin['advanced-filter-description'].includes(example), example);
for (const literal of ['GET /rest/api/3/search/jql?jql=project=KEY&fields=*all&expand=names,schema', 'nextPageToken', '"issues"', '"automationRules"']) assert.ok(latin['import-board-instruction-jira'].includes(literal), literal);
assert.match(latin['import-board-instruction-jira'], /sine fields tantum ID rerum reddit/);
assert.match(latin['import-board-instruction-excel'], /una charta in quaque linea.*Omne folium cum linea titulorum fit tabula/);
assert.match(latin['import-board-instruction-about-errors'], /interdum.*tamen succedit/);
assert.match(latin['import-without-mapping-members'], /postea coniunge/);

const reviewedTrelloKeys = ["import-trello-json-file-hint", "import-trello-zip-file", "import-trello-zip-file-hint", "import-trello-zip-no-boards", "import-trello-zip-progress", "import-trello-failed", "import-timeout", "import-trello-zip-failed", "import-trello-zip-read-failed", "import-trello-zip-too-large", "import-trello-zip-too-many-files", "import-trello-zip-file-too-large", "import-trello-zip-unsafe-path", "import-trello-workspace", "import-trello-workspace-placeholder", "import-trello-parent-workspace", "trello-api-import", "trello-api-import-desc", "trello-api-key", "trello-api-token", "trello-list-workspaces", "trello-parent-workspace-top", "trello-import-selected", "trello-importing", "trello-import-results", "trello-api-credentials-required", "trello-api-credentials-saved", "trello-select-boards", "select-all", "select-none", "unselect-all", "trello-import-more", "trello-import-progress", "trello-cancel", "trello-cancel-delete", "trello-cancel-delete-confirm", "trello-resume", "trello-delete-imported", "trello-clear-job", "trello-import-errors"];
for (const key of reviewedTrelloKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Please|Importing|Cancel|Resume|Top level|workspaces|already|re-entering)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['import-trello-zip-file-hint'], /Omnes tabulae importantur/);
assert.ok(latin['import-trello-zip-file-hint'].includes('Trello Card Attachments Downloader'));
assert.match(latin['import-trello-zip-too-many-files'], /nimis multos fasciculos/);
assert.match(latin['import-trello-zip-file-too-large'], /Fasciculus intra/);
assert.match(latin['import-trello-zip-unsafe-path'], /non tuta.*reiectus/);
assert.match(latin['trello-api-credentials-required'], /et clavem API et tesseram/);
assert.match(latin['trello-select-boards'], /saltem unam tabulam/);
assert.match(latin['trello-cancel-delete-confirm'], /iam hac operatione importatas.*revocari non potest/);
assert.notEqual(latin['trello-cancel'], latin['trello-cancel-delete']);
assert.notEqual(latin['trello-cancel'], latin['trello-resume']);
assert.ok(latin['trello-api-key'].includes('https://trello.com/app-key'));

const reviewedMappingStatusKeys = ["copy-to-clipboard", "running", "paused", "import-map-members", "import-members-map", "import-members-map-note", "import-show-user-mapping", "import-user-select", "importMapMembersAddPopup-title", "info", "check-version", "version-check-failed", "initials", "invalid-date", "invalid-time", "invalid-year", "invalid-user", "joined", "just-invited", "keyboard-shortcuts", "label-create", "label-default", "label-delete-pop", "last-admin-desc", "leave-board"];
for (const key of reviewedMappingStatusKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Paused|Review|Pick|Initials|Keyboard|There|roles|Leave)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['import-members-map-note'], /non coniuncta usori praesenti assignabuntur/);
assert.match(latin['import-user-select'], /iam exsistentem.*pro hoc membro/);
assert.match(latin['invalid-year'], /omnes quattuor cifras.*2026/);
assert.match(latin['last-admin-desc'], /mutare non potes.*saltem unus administrator/);
assert.match(latin['label-delete-pop'], /Revocari non potest.*omnibus chartis.*historia eius delebitur/);
assert.equal(latin['label-create'], latin['createLabelPopup-title']);
assert.notEqual(latin.running, latin.paused);
assert.notEqual(latin['invalid-date'], latin['invalid-time']);

const reviewedListActionKeys = ["leave-board-pop", "leaveBoardPopup-title", "list-archive-cards", "list-archive-cards-pop", "list-move-cards", "list-select-cards", "set-color-list", "settingsUserPopup-title", "settingsTeamPopup-title", "settingsOrgPopup-title", "orgAdminsPopup-title", "swimlaneActionPopup-title", "swimlaneAddPopup-title", "listImportCardPopup-title", "listImportCardsTsvPopup-title", "link-list", "list-delete-pop", "list-delete-suggest-archive", "calendar", "gantt", "log-in", "loginPopup-title", "menu", "move-selection", "copy-selection", "moveListPopup-title", "moveCardToBottom-title", "moveCardToTop-title", "moveSelectionPopup-title", "copySelectionPopup-title"];
for (const key of reviewedListActionKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Leave|Bottom|Top|selection|Admins|Configurationes)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['leave-board-pop'], /__boardTitle__.*omnibus chartis.*removeberis/);
for (const key of ['list-archive-cards', 'list-move-cards', 'list-select-cards']) assert.match(latin[key], /omnes chartas huius indicis/);
assert.match(latin['list-delete-pop'], /recuperare non poteris.*Revocari non potest/);
assert.match(latin['list-delete-suggest-archive'], /actiones serves/);
assert.match(latin['list-archive-cards-pop'], /in tabulam restituas/);
assert.equal(latin['move-selection'], latin['moveSelectionPopup-title']);
assert.equal(latin['copy-selection'], latin['copySelectionPopup-title']);
assert.notEqual(latin['moveCardToTop-title'], latin['moveCardToBottom-title']);
assert.equal(latin.calendar, latin['board-view-cal']);
assert.equal(latin.gantt, 'Gantt');
assert.equal(latin['log-in'], latin['loginPopup-title']);

const reviewedVisibilityKeys = ["selection-color", "multi-selection", "multi-selection-label", "multi-selection-member", "multi-selection-on", "multi-selection-off", "muted", "muted-info", "my-boards", "no-archived-cards", "no-archived-lists", "no-archived-swimlanes", "normal", "normal-desc", "normal-assigned-only", "normal-assigned-only-desc", "not-accepted-yet", "notify-participate", "notify-watch", "page-maybe-private", "page-not-found", "paste-or-dragdrop", "participating", "preview", "previewAttachedImagePopup-title", "previewClipboardImagePopup-title", "private-desc", "public-desc", "quick-access-description", "remove-cover"];
for (const key of reviewedVisibilityKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Preview|Receive|Participating|people|anyone|watching|logging in|minicard)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['normal-desc'], /videre et mutare potest.*Optiones mutare non potest/);
assert.match(latin['normal-assigned-only-desc'], /Solum chartae assignatae visibiles/);
assert.match(latin['private-desc'], /Solum homines tabulae additi.*videre et mutare/);
assert.match(latin['public-desc'], /Quivis ligamen habens.*Google.*Solum homines tabulae additi eam mutare/);
assert.ok(latin['page-maybe-private'].includes("<a href='%s'>ingrederis</a>"));
assert.match(latin['muted-info'], /nullis mutationibus.*umquam/);
assert.match(latin['notify-participate'], /creator vel membrum/);
assert.match(latin['notify-watch'], /tabularum, indicum vel chartarum/);
for (const key of ['previewAttachedImagePopup-title', 'previewClipboardImagePopup-title']) assert.equal(latin[key], latin.preview);
assert.equal(new Set(['no-archived-cards', 'no-archived-lists', 'no-archived-swimlanes'].map(key => latin[key])).size, 3);

const reviewedShortcutKeys = ["remove-from-board", "remove-label", "listDeletePopup-title", "remove-member", "deleted-user", "remove-member-from-card", "remove-member-pop", "sandstorm-remove-member-warning", "removeMemberPopup-title", "rename-board", "rescue-card-description", "rescue-card-description-dialogue", "rules", "search-cards", "search-example", "select-color", "select-board", "set-wip-limit-value", "setWipLimitPopup-title", "shortcut-add-self", "shortcut-assign-self", "shortcut-autocomplete-emoji", "shortcut-autocomplete-members", "shortcut-clear-filters", "shortcut-close-dialog", "shortcut-filter-my-cards", "shortcut-filter-my-assigned-cards", "shortcut-show-shortcuts", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar"];
for (const key of reviewedShortcutKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:They|yourself|Overwrite|Sidebar|Autocomplete|Bring up)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['remove-member-pop'], /omnibus chartis.*Notificationem accipiet/);
assert.match(latin['sandstorm-remove-member-warning'], /tantum intra WeKan celat.*non revocat.*etiam.*Share access.*revoca/);
assert.match(latin['rescue-card-description'], /ante clausuram.*non servatae/);
assert.match(latin['set-wip-limit-value'], /maximi numeri munerum/);
assert.notEqual(latin['shortcut-add-self'], latin['shortcut-assign-self']);
assert.notEqual(latin['shortcut-filter-my-cards'], latin['shortcut-filter-my-assigned-cards']);
assert.equal(latin['shortcut-close-dialog'], latin['close-dialog']);
assert.equal(latin['rename-board'], latin['boardChangeTitlePopup-title']);
assert.match(latin['search-cards'], /titulis chartarum et indicum, descriptionibus et campis propriis/);

const reviewedSidebarKeys = ["shortcut-toggle-sidebar", "show-cards-minimum-count", "sidebar-open", "sidebar-close", "signupPopup-title", "star-board-title", "set-default-board-title", "unset-default-board-title", "starred-boards", "starred-boards-description", "subscribe", "team", "this-board", "this-card", "spent-time-hours", "overtime-hours", "overtime", "has-overtime-cards", "has-spenttime-cards", "toggle-assignees", "toggle-labels", "remove-labels-multiselect", "tracking", "tracking-info", "type", "unassign-member", "unsaved-description", "upload", "upload-avatar", "uploaded-avatar"];
for (const key of reviewedSidebarKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Toggle|Sidebar|Starred|Tracking|Spent|Overtime|Unassign|unsaved)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['show-cards-minimum-count'], /plures continet quam$/);
assert.match(latin['set-default-board-title'], /automatice post ingressum/);
assert.match(latin['unset-default-board-title'], /desinat automatice aperiri/);
assert.match(latin['toggle-assignees'], /1-9.*ordine quo tabulae additi/);
assert.match(latin['toggle-labels'], /Electio plurium rerum titulos 1-9 addit/);
assert.match(latin['remove-labels-multiselect'], /titulos 1-9 removet/);
assert.match(latin['tracking-info'], /omnibus mutationibus.*creator vel membrum/);
assert.notEqual(latin['unassign-member'], latin['remove-member']);
assert.notEqual(latin['spent-time-hours'], latin['overtime-hours']);
assert.equal(latin['starred-boards'], latin['bookmarksPopup-title']);

const reviewedUploadKeys = ["uploading-files", "upload-failed", "upload-completed", "custom-top-left-corner-logo-image-url", "custom-top-left-corner-logo-link-url", "custom-top-left-corner-logo-height", "custom-login-logo-image-url", "custom-login-logo-link-url", "custom-help-link-url", "text-below-custom-login-logo", "automatic-linked-url-schemes", "import-usernames", "view-it", "go-to-board", "warn-list-archived", "watching", "watching-info", "welcome-board", "welcome-swimlane", "welcome-list1", "welcome-list2", "card-templates-swimlane", "list-templates-swimlane", "board-templates-swimlane", "what-to-do", "wipLimitErrorPopup-title", "wipLimitErrorPopup-dialog-pt1", "wipLimitErrorPopup-dialog-pt2", "attachment-transfer-limits-title", "attachment-limits"];
for (const key of reviewedUploadKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Uploading|Custom|Top|Corner|Height|Welcome|Milestone|Templates|Limits)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['upload-failed'], /defecit/);
assert.match(latin['upload-completed'], /perfecta est/);
assert.match(latin['custom-top-left-corner-logo-height'], /superiore sinistro.*27$/);
assert.match(latin['custom-top-left-corner-logo-image-url'], /URL imaginis/);
assert.match(latin['custom-top-left-corner-logo-link-url'], /URL ligaminis/);
assert.match(latin['automatic-linked-url-schemes'], /Unum schema URL in quaque linea/);
assert.match(latin['warn-list-archived'], /charta in indice qui in archivo/);
assert.match(latin['watching-info'], /omni mutatione/);
assert.match(latin['wipLimitErrorPopup-dialog-pt1'], /maior est quam limes WIP/);
assert.match(latin['wipLimitErrorPopup-dialog-pt2'], /ex hoc indice move, aut maiorem limitem/);
assert.equal(new Set(['card', 'list', 'board'].map(kind => latin[`${kind}-templates-swimlane`])).size, 3);

const reviewedTransferKeys = ["attachment-transfer-limits-description", "attachment-transfer-limits-saved", "attachment-transfer-limits-save-failed", "attachment-transfer-limits-invalid-value", "attachment-upload-limit-label", "avatars-upload-blocked-label", "avatars-upload-blocked-description", "attachment-download-limit-label", "api-upload-limit-label", "api-download-limit-label", "attachment-limit-mode-unlimited", "attachment-limit-mode-max-size", "attachment-limit-mode-blocked", "attachment-limit-unit-gb", "attachment-limit-unit-mb", "attachment-limit-unit-bytes", "registration", "self-registration", "invite", "invite-people", "to-boards", "email-addresses", "smtp-host-description", "smtp-port-description", "smtp-tls-description", "smtp-host", "smtp-port", "smtp-tls", "send-from", "send-smtp-test", "email-templates-invite-subject", "email-templates-invite-body", "invitation-code", "email-invite-register-subject", "email-invite-register-text", "email-smtp-test-subject", "email-smtp-test-text", "error-invitation-code-not-exist", "error-notAuthorized", "webhook-title"];
for (const key of reviewedTransferKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Avatars|Unlimited|Registration|Addresses|support|yourself|Dear|Thanks|authorized)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const [key, value] of [['gb', 'GB'], ['mb', 'MB'], ['bytes', 'Bytes']]) assert.equal(latin[`attachment-limit-unit-${key}`], value);
assert.match(latin['attachment-transfer-limits-description'], /API proprios limites securitatis in servitore/);
assert.match(latin['attachment-transfer-limits-invalid-value'], /validum et positivum/);
assert.match(latin['avatars-upload-blocked-description'], /Prohibe.*novas.*praedefinite permissae/);
assert.equal(new Set(['unlimited', 'max-size', 'blocked'].map(mode => latin[`attachment-limit-mode-${mode}`])).size, 3);
assert.match(latin['smtp-port-description'], /mittendas/);
assert.match(latin['send-smtp-test'], /tibi ipsi$/);
assert.equal(latin['email-invite-register-subject'], latin['email-invite-subject']);
assert.ok(latin['email-invite-register-text'].includes('\n__url__\n\n'));
assert.ok(latin['email-invite-register-text'].includes('__icode__'));
assert.notEqual(latin['email-templates-invite-subject'], latin['email-templates-invite-body']);

const reviewedSystemKeys = ["webhook-token", "notification-delivery-layout", "outgoing-webhooks", "bidirectional-webhooks", "outgoingWebhooksPopup-title", "boardCardTitlePopup-title", "disable-webhook", "global-webhook", "new-outgoing-webhook", "no-name", "Platform", "package", "OS", "Meteor", "Database", "Node", "Node_version", "Meteor_version", "Database_type", "Database_commit", "FerretDB_version", "FerretDB_commit", "Reactivity_mode", "Reactivity_order", "DDP_transport", "MongoDB_version", "MongoDB_storage_engine", "MongoDB_Oplog_enabled", "OS_Arch", "OS_Cpus"];
for (const key of reviewedSystemKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Optional|Outgoing|Two-Way|Layout|storage engine|CPU Count)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const name of ['OS', 'Meteor', 'Node']) assert.equal(latin[name], name);
for (const value of ['changeStreams', 'oplog', 'polling']) assert.ok(latin.Reactivity_mode.includes(value));
assert.ok(latin.Reactivity_order.includes('METEOR_REACTIVITY_ORDER'));
assert.ok(latin.DDP_transport.includes('DDP_TRANSPORT'));
assert.match(latin['webhook-token'], /optionalis/);
assert.notEqual(latin['outgoing-webhooks'], latin['bidirectional-webhooks']);
assert.equal(latin['outgoing-webhooks'], latin['outgoingWebhooksPopup-title']);
assert.match(latin['disable-webhook'], /^Inactiva /);
assert.match(latin.MongoDB_version, /compatibilis/);
assert.match(latin.OS_Cpus, /Numerus CPU/);

const reviewedFieldPolicyKeys = ["OS_Freemem", "OS_Loadavg", "OS_Platform", "OS_Release", "OS_Totalmem", "OS_Type", "OS_Uptime", "days", "hours", "minutes", "seconds", "show-field-on-card", "automatically-field-on-card", "always-field-on-card", "showLabel-field-on-card", "showSum-field-on-list", "accounts-allowEmailChange", "accounts-allowUserNameChange", "tableVisibilityMode-allowPrivateOnly", "tableVisibilityMode", "visibility", "createdAt", "modifiedAt", "verified", "active", "active-team", "active-org", "org-shared-templates", "org-propagate-members-to-boards", "org-sync-members-from-auth"];
for (const key of reviewedFieldPolicyKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Free|Load Average|Uptime|Modified|Shared|Templates|Provider|Propagate)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin.OS_Freemem, /libera/);
assert.match(latin.OS_Totalmem, /tota/);
assert.equal(new Set(['days', 'hours', 'minutes', 'seconds'].map(key => latin[key])).size, 4);
assert.match(latin['automatically-field-on-card'], /chartis novis/);
assert.match(latin['always-field-on-card'], /omnibus chartis/);
assert.match(latin['showSum-field-on-list'], /summam camporum in summo indice/);
assert.match(latin['tableVisibilityMode-allowPrivateOnly'], /tantum tabulas privatas/);
assert.notEqual(latin.createdAt, latin.modifiedAt);
assert.match(latin['org-propagate-members-to-boards'], /ad tabulas/);
assert.match(latin['org-sync-members-from-auth'], /ex provisore authenticationis/);

const reviewedTenantLabelKeys = ["org-tenant", "org-domains", "org-domains-description", "error-org-domain-taken", "org-admins", "org-admins-description", "org-admin", "team-shared-templates", "team-propagate-members-to-boards", "team-sync-members-from-auth", "active-person", "card-received", "card-received-on", "card-end", "card-end-on", "editCardReceivedDatePopup-title", "editCardEndDatePopup-title", "setCardColorPopup-title", "setSelectionColorPopup-title", "setCardActionsColorPopup-title", "setSwimlaneColorPopup-title", "setListColorPopup-title", "assigned-by", "requested-by", "card-sorting-by-number"];
for (const key of reviewedTenantLabelKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:tenant|Domains|Hostnames|admins|Shared|Provider|Received|sorting)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['org-domains-description'], /commatibus separata/);
assert.match(latin['org-domains-description'], /tantum si servitor cum MULTITENANCY=true/);
assert.match(latin['org-domains-description'], /Relinque vacuum si/);
assert.match(latin['org-admins-description'], /homines et exemplaria subsidiaria, nihil aliud/);
assert.match(latin['org-admins-description'], /Numquam.*totius situs concedere, neque administratorem situs administrare/);
for (const suffix of ['shared-templates', 'propagate-members-to-boards', 'sync-members-from-auth']) {
  assert.equal(latin[`team-${suffix}`], latin[`org-${suffix}`]);
}
assert.notEqual(latin['card-received-on'], latin['card-end-on']);
assert.notEqual(latin['assigned-by'], latin['requested-by']);
assert.match(latin['setSelectionColorPopup-title'], /rerum electarum/);

const reviewedDeletionSubtaskKeys = ["board-delete-notice", "delete-board-confirm-popup", "boardDeletePopup-title", "delete-board", "delete-all-notifications", "delete-all-notifications-confirm", "delete-duplicate-lists", "delete-duplicate-lists-confirm", "default-subtasks-board", "default", "defaultdefault", "queue", "subtask-settings", "card-settings", "boardSubtaskSettingsPopup-title", "boardCardSettingsPopup-title", "deposit-subtasks-board", "deposit-subtasks-list", "show-parent-in-minicard", "description-on-minicard", "cover-attachment-on-minicard", "badge-attachment-on-minicard", "card-sorting-by-number-on-minicard", "checklist-count-on-minicard", "checklist-count", "attachment-count", "cover-image", "prefix-with-full-path", "prefix-with-parent", "subtext-with-full-path", "subtext-with-parent", "change-card-parent", "parent-card", "source-board", "no-parent", "activity-added-label", "activity-removed-label", "activity-delete-attach", "activity-added-label-card", "activity-removed-label-card"];
for (const key of reviewedDeletionSubtaskKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Deleting|permanent|undo|Duplicate|Settings|Landing|Count|parent|Prefix|Subtext)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['board-delete-notice'], /Deletio perpetua est/);
assert.match(latin['delete-board-confirm-popup'], /neque contenta tabulae recuperare poteris/);
assert.match(latin['delete-all-notifications-confirm'], /revocari non potest/);
assert.match(latin['delete-duplicate-lists-confirm'], /idem nomen habent et nullas chartas continent/);
assert.equal(latin.default, latin.defaultdefault);
assert.equal(latin['subtask-settings'], latin['boardSubtaskSettingsPopup-title']);
assert.equal(latin['card-settings'], latin['boardCardSettingsPopup-title']);
assert.notEqual(latin['deposit-subtasks-board'], latin['deposit-subtasks-list']);
for (const kind of ['prefix', 'subtext']) {
  assert.match(latin[`${kind}-with-full-path`], /totam seriem chartarum superiorum/);
  assert.doesNotMatch(latin[`${kind}-with-parent`], /totam seriem/);
}
assert.match(latin['prefix-with-parent'], /^Praepone/);
assert.match(latin['subtext-with-parent'], /^Subpone/);
assert.match(latin['no-parent'], /^Noli monstrare/);
assert.equal(latin['checklist-count-on-minicard'], latin['checklist-count'] + ' in chartula');
assert.match(latin['activity-added-label'], /^addidit/);
assert.match(latin['activity-removed-label'], /^removit/);

const reviewedRuleBuilderKeys = ["activity-delete-attach-card", "activity-set-customfield", "activity-unset-customfield", "r-rule", "r-add-trigger", "r-add-action", "r-board-rules", "r-add-rule", "r-view-rule", "r-delete-rule", "r-new-rule-name", "r-no-rules", "r-import-export", "r-select-all", "r-unselect-all", "r-delete-selected", "r-export-selected", "r-edit-rule", "r-edit-rule-trigger-action", "r-workflow-view", "r-list-view", "r-when", "r-workflow-help", "r-drop-trigger", "r-drop-action", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-w-set-received-now", "r-export-json", "r-export-csv", "r-import-json", "r-import-csv"];
for (const key of reviewedRuleBuilderKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Rule|trigger|action|Workflow|When|Every|selected|custom field)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['activity-set-customfield'], /^constituit valorem/);
assert.match(latin['activity-unset-customfield'], /^removit valorem/);
assert.match(latin['r-drop-trigger'], /condicionem excitantem/);
assert.match(latin['r-drop-action'], /actionem/);
assert.match(latin['r-workflow-help'], /deinde adde regulam/);
assert.match(latin['r-workflow-help'], /in regulam iam existentem/);
assert.match(latin['r-w-card-archived'], /in archivum transfertur/);
assert.match(latin['r-w-card-unarchived'], /ex archivo restituitur/);
assert.match(latin['r-w-label-added'], /Quilibet.*additur/);
assert.match(latin['r-w-label-removed'], /Quilibet.*removetur/);
assert.match(latin['r-w-every-day-at'], /^Quotidie/);
assert.match(latin['r-w-set-received-now'], /receptionis ad tempus praesens/);
for (const format of ['json', 'csv']) {
  assert.equal(latin[`r-export-${format}`], `Exporta regulas in forma ${format.toUpperCase()}`);
  assert.equal(latin[`r-import-${format}`], `Importa regulas ex forma ${format.toUpperCase()}`);
}
for (const action of ['delete', 'export']) assert.match(latin[`r-${action}-selected`], /regulas electas$/);

const reviewedRuleScheduleKeys = ["r-import-trello", "r-import-paste", "r-import-done", "r-import-trello-note", "r-import-target", "r-workspace", "r-all-boards", "r-import-workflow", "r-workflow-format", "r-format-auto", "r-import-workflow-note", "r-import-unmapped", "r-set-scheduled-triggers", "r-set-button-triggers", "r-when-scheduled", "r-schedule-type", "r-schedule-once", "r-schedule-daily", "r-schedule-weekday", "r-schedule-weekly", "r-schedule-monthly", "r-schedule-at-time", "r-schedule-on-weekday", "r-schedule-on-day", "r-schedule-on-date", "r-of-cards-in-list", "r-when-due", "r-due-is-set", "r-due-soon", "r-due-overdue"];
for (const key of reviewedRuleScheduleKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Paste|Imported|Scheduled|Every|Repeat|weekday|overdue)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['r-import-trello'], /quantum fieri potest/);
assert.match(latin['r-import-trello-note'], /regulas Butler non continent/);
assert.match(latin['r-import-trello-note'], /partes quae sustinentur/);
assert.match(latin['r-import-trello-note'], /lineae non conversae indicantur/);
assert.match(latin['r-import-workflow-note'], /n8n aut Node-RED/);
assert.match(latin['r-import-workflow-note'], /nodi non conversi indicantur/);
assert.match(latin['r-schedule-weekday'], /a die Lunae ad diem Veneris/);
assert.equal(new Set(['once', 'daily', 'weekday', 'weekly', 'monthly'].map(k => latin[`r-schedule-${k}`])).size, 5);
assert.notEqual(latin['r-schedule-on-weekday'], latin['r-schedule-on-day']);
assert.equal(new Set(['is-set', 'soon', 'overdue'].map(k => latin[`r-due-${k}`])).size, 3);
assert.match(latin['r-due-overdue'], /praeteriit/);

const reviewedRuleActionLabels = ["r-days-before", "r-days-after", "r-when-card-in-list", "r-for-n-days", "r-card-button", "r-board-button", "r-button-label", "r-run", "r-sort-list", "r-sort-by", "r-sort-due", "r-sort-name", "r-mark-complete", "r-mark-incomplete", "r-move-all-cards", "r-set-date-relative", "r-later", "r-unit-minutes", "r-unit-hours", "r-unit-days", "r-unit-weeks", "r-unit-months", "r-trigger", "r-action"];
for (const key of reviewedRuleActionLabels) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:days|before|after|button|Sort|Mark|complete|relative|Trigger)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['r-days-before'], /ante$/);
assert.match(latin['r-days-after'], /post$/);
assert.match(latin['r-for-n-days'], /N dies/);
assert.notEqual(latin['r-card-button'], latin['r-board-button']);
assert.match(latin['r-mark-complete'], /chartam perfectam$/);
assert.match(latin['r-mark-incomplete'], /chartam imperfectam$/);
assert.match(latin['r-move-all-cards'], /omnes chartas/);
assert.match(latin['r-set-date-relative'], /temporis praesentis/);
assert.equal(new Set(['minutes', 'hours', 'days', 'weeks', 'months'].map(k => latin[`r-unit-${k}`])).size, 5);
assert.notEqual(latin['r-trigger'], latin['r-action']);

const reviewedTriggerGrammarKeys = ["r-when-a-card", "r-is", "r-is-moved", "r-added-to", "r-attachment-added-to", "r-removed-from", "r-attachment-removed-from", "r-the-board", "r-list", "set-filter", "r-moved-to", "r-moved-from", "r-archived", "r-unarchived", "r-a-card", "r-when-a-label-is", "r-when-the-label", "r-list-name", "r-when-a-member", "r-when-the-member", "r-name", "r-when-a-attach", "r-when-a-due-date-changed", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-when-a-checklist", "r-when-the-checklist", "r-completed", "r-made-incomplete", "r-when-a-item", "r-when-the-item", "r-checked", "r-unchecked", "r-when-a-assignee", "r-when-the-assignee", "r-when-a-start-date-changed"];
for (const key of reviewedTriggerGrammarKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:When|Moved|Restored|Added|Removed|Completed|Unchecked|the)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
const { ruleTriggerCopula: latinCopula } = require('../imports/i18n/ruleGrammar');
for (const locale of ['la', 'la-VA', 'la_VA', 'LA']) assert.equal(latinCopula(locale, 'est'), '');
for (const locale of ['en', 'lat', 'lan', undefined]) assert.equal(latinCopula(locale, 'is'), 'is');
assert.equal(latin['r-is'], 'est');
for (const subject of ['member', 'assignee', 'label', 'checklist']) {
  for (const action of ['r-added-to', 'r-removed-from']) {
    const sentence = [latin[`r-when-the-${subject}`], 'Alpha', latinCopula('la', latin['r-is']), latin[action], latin['r-a-card']].filter(Boolean).join(' ');
    assert.doesNotMatch(sentence, /\best\b|Latine:/);
    assert.match(sentence, /Alpha (additur in|removetur ex) charta$/);
  }
}
assert.match(latin['r-archived'], /in archivum/);
assert.match(latin['r-unarchived'], /ex archivo/);
assert.notEqual(latin['r-checked'], latin['r-unchecked']);
assert.notEqual(latin['r-completed'], latin['r-made-incomplete']);
for (const kind of ['due', 'start', 'end', 'received']) {
  assert.match(latin[`r-when-a-${kind}-date-changed`], /constituitur vel mutatur$/);
}

const reviewedActionDescriptionKeys = ["r-move-card-to", "r-top-of", "r-bottom-of", "r-its-list", "r-unarchive", "r-card", "r-remove", "r-label", "r-member", "r-remove-all", "r-assignee", "r-set-color", "r-checklist", "r-check-all", "r-uncheck-all", "r-items-check", "r-check", "r-uncheck", "r-item", "r-of-checklist", "r-send-email", "r-to", "r-of", "r-subject", "r-rule-details", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "r-d-send-email", "r-d-send-email-to", "r-d-send-email-subject", "r-d-send-email-message", "r-d-archive", "r-d-unarchive", "r-d-add-label", "r-d-remove-label", "r-create-card", "r-in-list", "r-in-swimlane", "r-d-add-member", "r-d-remove-member", "r-d-remove-all-member", "r-d-check-all", "r-d-uncheck-all", "r-d-check-one", "r-d-uncheck-one", "r-d-check-of-list", "r-d-add-checklist", "r-d-remove-checklist"];
for (const key of reviewedActionDescriptionKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Top|Bottom|Archive|checklist|Send|subject|items|Restore)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const direction of ['top', 'bottom']) {
  assert.equal([latin['r-move-card-to'], latin[`r-${direction}-of`], latin['r-its-list']].join(' '), latin[`r-d-move-to-${direction}-gen`]);
  assert.match(latin[`r-d-move-to-${direction}-gen`], /indicis sui$/);
  assert.match(latin[`r-d-move-to-${direction}-spec`], /indicis$/);
}
for (const action of ['check', 'uncheck']) {
  assert.equal(`${latin[`r-${action}-all`]} ${latin['r-items-check']}`, latin[`r-d-${action}-all`]);
  assert.equal(`${latin[`r-${action}`]} ${latin['r-item']}`, latin[`r-d-${action}-one`]);
}
assert.match(latin['r-d-archive'], /in archivum/);
assert.match(latin['r-d-unarchive'], /ex archivo/);
assert.match(latin['r-remove-all'], /omnia membra ex charta/);
assert.equal(latin['r-send-email'], latin['r-d-send-email']);
assert.equal(latin['r-subject'], latin['r-d-send-email-subject']);
assert.notEqual(latin['r-d-add-member'], latin['r-d-remove-member']);
assert.notEqual(latin['r-in-list'], latin['r-in-swimlane']);

const reviewedRuleBrandingKeys = ["r-by", "r-add-checklist", "r-with-items", "r-items-list", "r-add-swimlane", "r-swimlane-name", "r-board-note", "r-checklist-note", "r-when-a-card-is-moved", "r-set", "r-update", "r-datefield", "r-df-start-at", "r-df-due-at", "r-df-end-at", "r-df-received-at", "r-to-current-datetime", "r-remove-value-from", "r-link-card", "ldap", "oauth2", "cas", "authentication-method", "authentication-type", "custom-product-name", "settings-group-url", "settings-group-logo", "custom-head-tags-enabled", "custom-head-meta-tags", "custom-head-link-tags", "custom-manifest-enabled", "custom-head-manifest-content", "custom-assetlinks-enabled", "custom-assetlinks-content", "layout", "hide-logo", "card-counter-list", "board-member-list", "add-custom-html-after-body-start", "add-custom-html-before-body-end"];
for (const key of reviewedRuleBrandingKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Note|empty|comma|Custom|Enable|Hide|Layout|current|another)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['r-board-note'], /campum vacuum ut quilibet valor congruat/);
assert.match(latin['r-checklist-note'], /commatibus separati/);
assert.equal(latin['r-items-list'].split(',').length, 3);
assert.match(latin['r-when-a-card-is-moved'], /in alium indicem/);
assert.equal(`${latin['r-remove-value-from']} ${latin['r-datefield']}`, 'Vacua campum diei');
assert.notEqual(latin['r-set'], latin['r-update']);
assert.equal(new Set(['start', 'due', 'end', 'received'].map(k => latin[`r-df-${k}-at`])).size, 4);
for (const [key, value] of [['ldap', 'LDAP'], ['oauth2', 'OAuth2'], ['cas', 'CAS'], ['settings-group-url', 'URL']]) assert.equal(latin[key], value);
assert.match(latin['custom-head-meta-tags'], /meta.*HTML/);
assert.match(latin['custom-head-link-tags'], /link.*HTML/);
assert.match(latin['custom-assetlinks-content'], /assetlinks\.json.*JSON/);
assert.match(latin['add-custom-html-after-body-start'], /post initium <body>/);
assert.match(latin['add-custom-html-before-body-end'], /ante finem <\/body>/);

const reviewedAuthDateKeys = ["error-undefined", "error-ldap-login", "display-authentication-method", "oidc-button-text", "default-authentication-method", "duplicate-board", "duplicate-board-confirm", "org-number", "team-number", "people-number", "swimlaneDeletePopup-title", "swimlane-delete-pop", "restore-all", "delete-all", "previous_as", "act-a-dueAt", "act-a-endAt", "act-a-startAt", "act-a-receivedAt", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt", "above-selected-card", "above-selected-swimlane", "below-selected-card", "below-selected-swimlane", "left-of-list", "right-of-list", "almostdue"];
for (const key of reviewedAuthDateKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Something|Authentication|Default|Duplicate|recover|undo|modified|selected|approaching)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['oidc-button-text'], /OIDC$/);
assert.notEqual(latin['display-authentication-method'], latin['default-authentication-method']);
assert.match(latin['duplicate-board-confirm'], /duplicare velle/);
assert.match(latin['swimlane-delete-pop'], /neque semitam recuperare poteris/);
assert.match(latin['swimlane-delete-pop'], /revocari non potest/);
assert.notEqual(latin['restore-all'], latin['delete-all']);
assert.match(latin['act-a-dueAt'], /Quando: __timeValue__\nUbi: __card__/);
assert.match(latin['act-a-dueAt'], /prius erat __timeOldValue__/);
for (const kind of ['card', 'swimlane']) {
  assert.match(latin[`above-selected-${kind}`], /^Supra/);
  assert.match(latin[`below-selected-${kind}`], /^Infra/);
}
assert.match(latin['left-of-list'], /sinistram/);
assert.match(latin['right-of-list'], /dextram/);
assert.match(latin.almostdue, /appropinquat$/);

const reviewedReminderPreferenceKeys = ["pastdue", "duenow", "act-newDue", "act-withDue", "act-almostdue", "act-pastdue", "act-duenow", "act-atUserComment", "delete-user-confirm-popup", "delete-team-confirm-popup", "delete-org-confirm-popup", "accounts-allowUserDelete", "hide-minicard-label-text", "show-desktop-drag-handles", "drag-to-resize-sidebar", "drag-to-resize-left-menu", "submit-on-enter", "open-many-cards-at-once", "open-many-cards-at-once-description", "submit-on-enter-description", "addmore-detail", "show-on-card", "show-on-minicard", "new", "editOrgPopup-title", "newOrgPopup-title", "editTeamPopup-title", "newTeamPopup-title", "editUserPopup-title", "newUserPopup-title", "help", "view-all", "filter-by-unread", "mark-all-as-read", "mark-all-as-unread"];
for (const key of reviewedReminderPreferenceKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:current|reminding|mentioned|undo|Hide|Show|Keep|When|Unread)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin.pastdue, /praeteriit$/);
assert.match(latin.duenow, /hodie est$/);
assert.match(latin['act-almostdue'], /appropinquare$/);
assert.match(latin['act-pastdue'], /praeteriisse$/);
assert.match(latin['act-duenow'], /nunc adesse$/);
for (const kind of ['user', 'team', 'org']) assert.match(latin[`delete-${kind}-confirm-popup`], /revocari non potest/);
assert.match(latin['accounts-allowUserDelete'], /rationem suam/);
for (const shortcut of ['Enter', 'Shift+Enter', 'Ctrl/Cmd+Enter']) assert.ok(latin['submit-on-enter-description'].includes(shortcut));
assert.match(latin['submit-on-enter-description'], /Si inactiva est, Ctrl\/Cmd\+Enter servat et Enter novam lineam inserit/);
assert.match(latin['open-many-cards-at-once-description'], /propria fenestra quamque chartam/);
assert.match(latin['open-many-cards-at-once-description'], /inactiva est.*claudis eam quae aperta erat/);
assert.notEqual(latin['show-on-card'], latin['show-on-minicard']);
assert.equal(latin['mark-all-as-read'], 'Nota omnia ut lecta');
assert.equal(latin['mark-all-as-unread'], 'Nota omnia ut non lecta');

const reviewedRoleWeekdayKeys = ["remove-all-read", "allow-rename", "allowRenamePopup-title", "roles", "roles-info", "allow-invite-to-board", "all-board-members", "board-admin", "roles-status", "roles-status-desc", "roles-status-role", "roles-status-invite", "roles-status-sees", "roles-status-write", "roles-status-manage", "roles-status-sees-all", "roles-status-sees-assigned", "roles-status-empty", "start-day-of-week", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "owner", "last-modified-at", "last-activity", "voting", "delete-linked-card-before-this-card", "delete-linked-cards-before-this-list", "hide-checked-items", "hide-finished-checklist"];
for (const key of reviewedRoleWeekdayKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Allow|Roles|Choose|Read-only|Assigned|Monday|Owner|linked|Hide)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['allow-rename'], latin['allowRenamePopup-title']);
assert.match(latin['roles-info'], /administratores totius situs.*semper omnia iura habent neque hic restringi possunt/);
assert.match(latin['roles-status-desc'], /Tantum legitur/);
assert.match(latin['roles-status-desc'], /antequam serves/);
assert.equal(latin['roles-status-sees-assigned'], 'Tantum assignatae');
assert.notEqual(latin['roles-status-sees-all'], latin['roles-status-sees-assigned']);
assert.equal(new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(k => latin[k])).size, 7);
assert.match(latin['delete-linked-cards-before-this-list'], /antequam chartas coniunctas deleveris/);
assert.match(latin['delete-linked-cards-before-this-list'], /ad chartas huius indicis spectant/);
assert.notEqual(latin['hide-checked-items'], latin['hide-finished-checklist']);

const reviewedSharingViewKeys = ["task", "create-task", "domains", "domain", "add-domain", "share-template-with", "drag-template-here-to-share", "remove-domain-from-board", "invalid-domain", "domain-user-count", "no-items-message", "shared-templates", "shared-templates-info", "shared-templates-select-scope", "no-shared-templates", "displayName", "shortName", "autoAddUsersWithDomainName", "website", "person", "day", "week", "month", "context-separator", "myCardsViewChange-title", "myCardsViewChangePopup-title", "myCardsViewChange-choice-table", "myCardsSortChange-title", "myCardsSortChangePopup-title", "myCardsSortChange-choice-board", "myCardsSortChange-choice-dueat", "dueCards-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "dueCardsViewChange-choice-me", "dueCardsViewChange-choice-all", "dueCardsViewChange-choice-all-description", "globalSearchViewChange-title", "globalSearchViewChangePopup-title", "globalSearchViewChange-choice-me"];
for (const key of reviewedSharingViewKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Task|Domain|Template|Browse|Select|Shared|Automatically|View|Users)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['invalid-domain'], /example\.com.*sine @ aut spatiis/);
assert.match(latin['shared-templates-info'], /unum vel plures ambitus/);
assert.match(latin['shared-templates-info'], /Soli usores quorum tabula Exemplarium non est vacua/);
assert.match(latin['shared-templates-info'], /dominium inscriptionis electronicae/);
assert.equal(latin['context-separator'], '/');
for (const key of ['myCardsViewChange', 'myCardsSortChange', 'dueCardsViewChange', 'globalSearchViewChange']) assert.equal(latin[`${key}-title`], latin[`${key}Popup-title`]);
assert.notEqual(latin['myCardsSortChange-choice-board'], latin['myCardsSortChange-choice-dueat']);
assert.match(latin['dueCardsViewChange-choice-all-description'], /chartas imperfectas/);
assert.match(latin['dueCardsViewChange-choice-all-description'], /cum \*die debito\*/);
assert.match(latin['dueCardsViewChange-choice-all-description'], /ad quas usor aditum habet/);
assert.notEqual(latin['dueCardsViewChange-choice-me'], latin['dueCardsViewChange-choice-all']);

const reviewedSearchOperatorKeys = ["globalSearchViewChange-choice-all", "globalSearchViewChange-choice-all-description", "dueCards-noResults-title", "dueCards-noResults-description", "board-title-not-found", "swimlane-title-not-found", "list-title-not-found", "label-not-found", "label-color-not-found", "user-username-not-found", "comment-not-found", "org-name-not-found", "team-name-not-found", "no-cards-found", "one-card-found", "n-cards-found", "n-n-of-n-cards-found", "operator-board", "operator-board-abbrev", "operator-swimlane", "operator-swimlane-abbrev", "operator-list", "operator-list-abbrev", "operator-label", "operator-label-abbrev", "operator-user", "operator-user-abbrev", "operator-member", "operator-member-abbrev", "operator-assignee", "operator-assignee-abbrev", "operator-creator", "operator-status", "operator-due", "operator-created", "operator-modified", "operator-sort", "operator-comment", "operator-has", "operator-limit", "operator-debug", "operator-org", "operator-team", "operator-title", "operator-description", "operator-customfield", "operator-attachment-text", "operator-checklist-text"];
for (const key of reviewedSearchOperatorKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:All cards|Search|permission|Found|not found|Username|Organization)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['globalSearchViewChange-choice-all-description'], /ad quas aditum habes/);
assert.match(latin['globalSearchViewChange-choice-all-description'], /membrum vel delegatus es/);
assert.match(latin['dueCards-noResults-description'], /cum die debito nunc/);
assert.match(latin['comment-not-found'], /textum '%s' continente/);
assert.notEqual(latin['no-cards-found'], latin['one-card-found']);
const latinOperators = reviewedSearchOperatorKeys.filter(key => key.startsWith('operator-'));
assert.equal(new Set(latinOperators.map(key => latin[key])).size, latinOperators.length, 'operator aliases do not collide');
for (const key of latinOperators.filter(key => key.endsWith('-abbrev'))) assert.equal(latin[key], english[key]);
assert.equal(latin['operator-board'], 'tabula');
assert.equal(latin['operator-title'], 'tituluschartae');
assert.notEqual(latin['operator-title'], latin['operator-label']);
const latinSearchParserSource = fs.readFileSync(path.join(root, 'config/query-classes.js'), 'utf8');
for (const key of latinOperators) assert.ok(latinSearchParserSource.includes(`'${key}':`), `${key}: registered in search parser`);
assert.match(latinSearchParserSource, /operatorMap\[TAPi18n\.\_\_\(key\)\.toLowerCase\(\)\] = value/);

const reviewedSearchPredicateKeys = ["predicate-archived", "predicate-open", "predicate-ended", "predicate-all", "predicate-overdue", "predicate-week", "predicate-month", "predicate-quarter", "predicate-year", "predicate-due", "predicate-modified", "predicate-created", "predicate-attachment", "predicate-description", "predicate-checklist", "predicate-start", "predicate-end", "predicate-assignee", "predicate-member", "predicate-public", "predicate-private", "predicate-selector", "predicate-projection", "operator-unknown-error", "operator-number-expected", "operator-sort-invalid", "operator-status-invalid", "operator-has-invalid", "operator-limit-invalid", "operator-debug-invalid", "next-page", "previous-page", "heading-notes", "globalSearch-instructions-heading", "globalSearch-instructions-description", "globalSearch-instructions-operators", "globalSearch-instructions-operator-board", "globalSearch-instructions-operator-list", "globalSearch-instructions-operator-swimlane", "globalSearch-instructions-operator-comment"];
for (const key of reviewedSearchPredicateKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:archived|overdue|positive integer|Available|Searches|quotation|matching|containing)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
const latinPredicates = reviewedSearchPredicateKeys.filter(key => key.startsWith('predicate-'));
assert.equal(new Set(latinPredicates.map(key => latin[key])).size, latinPredicates.length);
for (const key of latinPredicates) assert.ok(latinSearchParserSource.includes(`'${key}':`), `${key}: registered predicate`);
assert.match(latin['operator-limit-invalid'], /numerus integer positivus/);
assert.match(latin['operator-number-expected'], /__operator__.*'__value__'/);
assert.notEqual(latin['next-page'], latin['previous-page']);
assert.ok(latin['globalSearch-instructions-description'].includes('`' + latin['operator-list'] + ':Impedita`'));
assert.match(latin['globalSearch-instructions-description'], /spatia aut characteres speciales/);
assert.match(latin['globalSearch-instructions-description'], /signa citationis/);
assert.equal(latin['predicate-overdue'], 'praeteritum');

const reviewedSearchHelpKeys = ["globalSearch-instructions-operator-label", "globalSearch-instructions-operator-hash", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-at", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee", "globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team", "globalSearch-instructions-operator-due", "globalSearch-instructions-operator-created", "globalSearch-instructions-operator-modified", "globalSearch-instructions-operator-status", "globalSearch-instructions-status-archived", "globalSearch-instructions-status-all", "globalSearch-instructions-status-ended", "globalSearch-instructions-status-public", "globalSearch-instructions-status-private", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-1", "globalSearch-instructions-notes-2", "globalSearch-instructions-notes-3", "globalSearch-instructions-notes-3-2", "globalSearch-instructions-notes-4", "globalSearch-instructions-notes-5", "link-to-search", "excel-font", "number"];
for (const key of reviewedSearchHelpKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:shorthand|matching|where|following|absence|Multiple|Differing|insensitive)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.ok(latin['globalSearch-instructions-operator-at'].includes('`' + latin['operator-user'] + ':<username>`'));
assert.ok(latin['globalSearch-instructions-operator-has'].includes('`' + latin['operator-has'] + ':-' + latin['predicate-due'] + '`'));
assert.match(latin['globalSearch-instructions-operator-has'], /sine die debito/);
assert.match(latin['globalSearch-instructions-operator-sort'], /ordine descendente.*`-`/);
assert.match(latin['globalSearch-instructions-operator-limit'], /integer positivus.*in quaque pagina/);
assert.match(latin['globalSearch-instructions-notes-2'], /OR.*cuilibet condicionum/);
assert.match(latin['globalSearch-instructions-notes-3'], /AND.*omnibus operatoribus/);
assert.match(latin['globalSearch-instructions-notes-3-2'], /positivo aut negativo/);
assert.match(latin['globalSearch-instructions-notes-4'], /maiusculas a minusculis non distinguunt/);
assert.match(latin['globalSearch-instructions-notes-5'], /in archivo non quaeruntur/);
assert.equal(latin['excel-font'], 'Arial');

assert.equal(latin['operator-number'], 'numerus');
assert.match(latin['globalSearch-instructions-operator-number'], /chartae quarum numerus est/);
for (const [key, value] of Object.entries(latin)) {
  if (key.startsWith('globalSearch-instructions') || key.startsWith('operator-')) assert.doesNotMatch(value, /Latine:/, key);
}

const reviewedSortDependencyKeys = ["label-colors", "label-names", "archived-at", "sort-cards", "sort-boards", "search-boards", "sort-boards-custom", "sort-boards-title-asc", "sort-boards-title-desc", "sort-is-on", "cardsSortPopup-title", "due-complete", "card-mark-complete", "card-mark-incomplete", "stickers", "add-sticker", "remove-sticker", "card-dependencies", "add-dependency", "remove-dependency", "show-dependencies", "hide-dependencies", "drag-to-connect", "dependency-type", "dependency-color", "dependency-icon", "dependency-type-related-to", "dependency-type-blocks", "dependency-type-is-blocked-by", "dependency-type-fixes", "dependency-type-is-fixed-by", "filter-dependencies-label", "import-dependencies-file", "import-dependencies-placeholder", "import-dependencies-parse-error", "import-dependencies-empty", "import-dependencies-done"];
for (const key of reviewedSortDependencyKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Label|Sort|Title|Custom|sticker|Dependencies|Relation|Blocks|Imported)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['sort-cards'], latin['cardsSortPopup-title']);
assert.match(latin['sort-boards-title-asc'], /A → Z/);
assert.match(latin['sort-boards-title-desc'], /Z → A/);
assert.notEqual(latin['card-mark-complete'], latin['card-mark-incomplete']);
assert.equal(latin['dependency-type-blocks'], 'Impedit');
assert.equal(latin['dependency-type-is-blocked-by'], 'Impeditur a');
assert.equal(latin['dependency-type-fixes'], 'Corrigit');
assert.equal(latin['dependency-type-is-fixed-by'], 'Corrigitur a');
assert.equal(latin['dependency-color'], 'Color');
assert.match(latin['import-dependencies-file'], /JSON vel SVG/);
assert.match(latin['import-dependencies-empty'], /tabulam.*saltem unam lineam/);
assert.match(latin['import-dependencies-done'], /sine congruentia: __unmatched__/);

const reviewedLocationBackgroundKeys = ["board-backgrounds", "boardBackgrounds-title", "upload-background", "set-as-active", "background-too-big", "board-background-delete-pop", "location", "location-open-map", "add-location", "cardLocationsPopup-title", "location-name", "location-address", "location-latitude", "location-longitude", "location-detect-from-map", "location-detect", "location-detect-none", "location-detect-done", "location-open-map-at", "map-region-usa", "map-region-europe", "map-region-asia", "map-provider-saved", "server-error", "server-error-troubleshooting", "title-alphabetically", "created-at-newest-first", "created-at-oldest-first", "links-heading", "board-activities"];
for (const key of reviewedLocationBackgroundKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:background|Upload|Location|Detect|Could|Filled|Default|Newest|Oldest)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['board-backgrounds'], latin['boardBackgrounds-title']);
assert.equal(latin['add-location'], latin['cardLocationsPopup-title']);
assert.match(latin['background-too-big'], /nimis magna.*{{size}}/);
assert.equal(latin['location-latitude'], 'Latitudo');
assert.equal(latin['location-longitude'], 'Longitudo');
assert.match(latin['location-detect-none'], /inveniri non potuit/);
assert.match(latin['location-detect-done'], /infra inserta sunt/);
assert.equal(latin['map-region-asia'], 'Asia');
for (const command of ['sudo snap logs wekan.wekan', 'sudo docker logs wekan-app']) assert.ok(latin['server-error-troubleshooting'].includes('`' + command + '`'));
assert.match(latin['created-at-newest-first'], /recentissima primum/);
assert.match(latin['created-at-oldest-first'], /antiquissima primum/);

const reviewedReportTemplateKeys = ["now-activities-of-all-boards-are-hidden", "move-swimlane", "moveSwimlanePopup-title", "custom-field-stringtemplate", "custom-field-stringtemplate-format", "custom-field-stringtemplate-separator", "custom-field-stringtemplate-item-placeholder", "creator", "creator-on-minicard", "filesReportTitle", "filter-invisible-filenames", "filename-invisible-legend", "reports", "problems", "securityReportTitle", "speedReportTitle", "testsReportTitle", "cpuReportTitle", "databaseReportTitle", "new-problems", "acknowledge", "rulesReportTitle", "boardsReportTitle", "cardsReportTitle", "impersonationReportTitle", "impersonation-admin", "impersonation-user", "recoveryReportTitle", "officeReportTitle", "office-report-desc"];
for (const key of reviewedReportTemplateKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:String Template|Format|Press|Report|Only|filename|Impersonated|successful)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['move-swimlane'], latin['moveSwimlanePopup-title']);
assert.match(latin['custom-field-stringtemplate-format'], /%{value}/);
for (const entity of ['&#32;', '&nbsp;']) assert.ok(latin['custom-field-stringtemplate-separator'].includes(entity));
assert.match(latin['filter-invisible-filenames'], /^Tantum nomina fasciculorum/);
assert.match(latin['filename-invisible-legend'], /^Ruber:/);
assert.notEqual(latin['impersonation-admin'], latin['impersonation-user']);
assert.match(latin['office-report-desc'], /secundum personam/);
assert.match(latin['office-report-desc'], /IPv4 vel IPv6/);
assert.match(latin['office-report-desc'], /si praesto sunt/);
assert.match(latin['office-report-desc'], /ingressuum felicium/);
assert.equal(latin['cpuReportTitle'], 'Usus CPU');

const reviewedOfficeRecoveryKeys = ["office-location", "office-address", "office-logins", "office-first-seen", "office-last-seen", "office-shared", "office-no-results", "apiReportTitle", "api-report-desc", "api-endpoint", "api-calls", "api-first-called", "api-last-called", "api-no-calls", "recovery-report-desc", "recovery-event", "recovery-severity", "recovery-db", "recovery-detail", "recovery-no-events", "recovery-maintenance-title", "recovery-maintenance-note", "reason", "copy-swimlane", "copySwimlanePopup-title"];
for (const key of reviewedOfficeRecoveryKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Location|Address|Logins|Shared|endpoints|account|recorded|Recovering|Reason)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.notEqual(latin['office-first-seen'], latin['office-last-seen']);
assert.match(latin['office-no-results'], /aut nulli ingressus relati/);
assert.equal(latin.apiReportTitle, 'API');
assert.equal(latin['api-endpoint'], 'API');
assert.match(latin['api-report-desc'], /Una linea pro quaque ratione et puncto accessus/);
assert.match(latin['api-report-desc'], /numquam una linea pro quaque petitione/);
assert.match(latin['api-no-calls'], /inactiva est nisi WITH_API=true/);
assert.match(latin['recovery-report-desc'], /iterata migratio ex MongoDB/);
assert.match(latin['recovery-report-desc'], /exemplaria subsidiaria datorum textualium/);
assert.match(latin['recovery-maintenance-note'], /automatice perget cum restitutio perfecta erit/);
assert.equal(latin['copy-swimlane'], latin['copySwimlanePopup-title']);

const reviewedSpinnerTicketKeys = ["display-card-creator", "wait-spinner", "Bounce", "Cube", "Cube-Grid", "Dot", "Double-Bounce", "Rotateplane", "Scaleout", "Wave", "maximize-card", "minimize-card", "delete-org-warning-message", "delete-team-warning-message", "subject", "details", "carbon-copy", "ticket", "tickets", "ticket-number", "open", "pending", "closed", "resolved", "cancelled", "history-change-removed", "history-change-edited", "history-change-moved", "history-change-restored", "request"];
for (const key of reviewedSpinnerTicketKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Display|Wait|Spinner|Maximize|Minimize|organization|Pending|Resolved|Removed)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
const latinSpinnerKeys = ['Bounce', 'Cube', 'Cube-Grid', 'Dot', 'Double-Bounce', 'Rotateplane', 'Scaleout', 'Wave'];
assert.equal(new Set(latinSpinnerKeys.map(key => latin[key])).size, 8);
for (const key of latinSpinnerKeys) assert.match(latin[key], /^Indicium exspectationis/);
assert.notEqual(latin['maximize-card'], latin['minimize-card']);
for (const kind of ['org', 'team']) assert.match(latin[`delete-${kind}-warning-message`], /deleri non potest, quia saltem unus usor/);
assert.ok(latin['carbon-copy'].includes('(Cc:)'));
assert.equal(new Set(['open', 'pending', 'closed', 'resolved', 'cancelled'].map(key => latin[key])).size, 5);
assert.equal(new Set(['removed', 'edited', 'moved', 'restored'].map(kind => latin[`history-change-${kind}`])).size, 4);

const reviewedMemoryInvitationKeys = ["requests", "help-request", "editCardSortOrderPopup-title", "cardDetailsPopup-title", "add-teams", "add-teams-label", "remove-team-from-table", "confirm-btn", "remove-btn", "filter-card-title-label", "invite-people-success", "invite-people-error", "email-domain-allowed-to-invite", "to-create-teams-contact-admin", "Node_heap_total_heap_size", "Node_heap_total_heap_size_executable", "Node_heap_total_physical_size", "Node_heap_total_available_size", "Node_heap_used_heap_size", "Node_heap_heap_size_limit", "Node_heap_malloced_memory", "Node_heap_peak_malloced_memory", "Node_heap_does_zap_garbage", "Node_heap_number_of_native_contexts", "Node_heap_number_of_detached_contexts", "Node_memory_usage_rss", "Node_memory_usage_heap_total", "Node_memory_usage_heap_used", "Node_memory_usage_external", "add-organizations", "add-organizations-label", "remove-organization-from-board", "to-create-organizations-contact-admin", "custom-legal-notice-link-url", "acceptance_of_our_legalNotice"];
for (const key of reviewedMemoryInvitationKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Requests|Added|Invitation|allowed|heap size|memory usage|Custom|continuing)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['remove-btn'], latin['r-remove']);
assert.match(latin['invite-people-success'], /feliciter missa/);
assert.match(latin['invite-people-error'], /^Error/);
assert.match(latin['email-domain-allowed-to-invite'], /cum propria inscriptio inactiva/);
assert.match(latin.Node_heap_peak_malloced_memory, /maxima.*malloc/);
assert.match(latin.Node_heap_does_zap_garbage, /exemplari bituum superscribitur/);
assert.match(latin.Node_memory_usage_heap_total, /acervi assignati/);
assert.match(latin.Node_memory_usage_heap_used, /re vera adhibita/);
assert.match(latin.Node_memory_usage_rss, /RSS/);
assert.notEqual(latin.Node_heap_number_of_native_contexts, latin.Node_heap_number_of_detached_contexts);
for (const kind of ['teams', 'organizations']) assert.match(latin[`to-create-${kind}-contact-admin`], /administratorem conveni/);

const reviewedChecklistStorageKeys = ["email-templates-activity-subject", "email-templates-activity-body", "legalNotice", "copied", "checklistActionsPopup-title", "moveChecklist", "moveChecklistPopup-title", "newlineBecomesNewChecklistItem", "newLineNewItem", "newlineBecomesNewChecklistItemOriginOrder", "originOrder", "copyChecklist", "copyChecklistPopup-title", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "subtaskActionsPopup-title", "attachmentActionsPopup-title", "attachment-move-storage-fs", "attachment-move-storage-gridfs", "attachment-move-storage-s3", "attachment-move", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3", "move-source", "move-destination", "move-storage-fs", "move-all-attachments", "move-attachments-none-found"];
for (const key of reviewedChecklistStorageKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Move|Copy|Each|original|Nothing|stored|filesystem|Subject)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const action of ['moveChecklist', 'copyChecklist', 'copyChecklistFromTemplate']) {
  assert.equal(latin[action], latin[`${action}Popup-title`]);
}
assert.notEqual(latin.moveChecklist, latin.copyChecklist);
assert.match(latin.newlineBecomesNewChecklistItemOriginOrder, /ordine pristino servato/);
assert.equal(`${latin.acceptance_of_our_legalNotice} ${latin.legalNotice}`, 'Pergendo accipis nostram notitiam iuridicam');
for (const [storage, name] of [['gridfs', 'GridFS'], ['s3', 'S3'], ['fs', 'systema fasciculorum']]) {
  assert.ok(latin[`attachment-move-storage-${storage}`].endsWith(name));
  assert.ok(latin[`move-all-attachments-of-board-to-${storage}`].includes('omnia adiuncta tabulae'));
}
assert.match(latin['move-attachments-none-found'], /Nihil.*electo.*nihil transferendum/);

const reviewedStorageRepairKeys = ["move-storage-collectionfs", "move-storage-gridfs", "move-storage-s3", "attachment-last-move", "attachment-repair-locations", "attachment-repair-locations-description", "attachment-repair-running", "attachment-repair-done", "attachment-repair-scanned", "attachment-repair-repaired", "attachment-repair-broken", "move-scope", "move-scope-avatars", "move-scope-both", "move-storage-all", "default-save-storage", "default-save-storage-description", "default-save-storage-saved", "default-save-storage-save-failed", "move-progress-file", "move-progress-pause", "move-progress-resume", "calculate-file-counts", "calculating-counts", "stats-scope", "stats-collectionfs", "stats-mongo-files", "stats-count", "avatars", "card-id", "attachment-id", "board-id", "gridfs-file-id", "s3-file-id", "path", "version-name", "size", "storage", "action", "board-title", "uploading", "remaining_time", "speed", "progress"];
for (const key of reviewedStorageRepairKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Searching|Repair|Avatars|Default|Choose|Failed|Calculating|Remaining)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['attachment-repair-locations-description'], /iam non congruit cum loco fasciculi/);
assert.match(latin['attachment-repair-locations-description'], /verum locum indicet/);
assert.match(latin['move-storage-all'], /ex quibus legere licet/);
assert.notEqual(latin['move-progress-pause'], latin['move-progress-resume']);
assert.match(latin['default-save-storage-description'], /adiuncta nuper immissa/);
assert.match(latin['default-save-storage-save-failed'], /non potuit/);
assert.equal(new Set(['scanned', 'repaired', 'broken'].map(suffix => latin[`attachment-repair-${suffix}`])).size, 3);
for (const key of ['move-storage-collectionfs', 'move-storage-gridfs', 'move-storage-s3', 'stats-collectionfs', 'stats-mongo-files']) {
  assert.equal(latin[key], english[key]);
}

const reviewedMaintenanceAccountKeys = ["mongodb-compact", "mongodb-compact-description", "mongodb-compact-warning", "mongodb-compact-run", "mongodb-compact-running", "mongodb-compact-success", "mongodb-compact-error", "board-status", "board-status-loading-mode", "board-status-time-summary", "board-status-time-spent-total", "board-status-cards-with-time", "board-status-overtime-cards", "password-again", "if-you-already-have-an-account", "minicardDetailsActionsPopup-title", "Mongo_sessions_count", "change-visibility", "max-upload-filesize", "allowed-upload-filetypes", "max-avatar-filesize", "allowed-avatar-filetypes", "invalid-file", "preview-pdf-not-supported", "drag-board", "drag-board-to-workspace", "translation-number", "delete-translation-confirm-popup", "newTranslationPopup-title", "editTranslationPopup-title", "settingsTranslationPopup-title", "translation", "text", "translation-text", "show-subtasks-field", "show-week-of-year", "convert-to-markdown", "import-board-zip", "collapse", "collapse-checklist", "expand-checklist", "uncollapse", "hideCheckedChecklistItems", "hideAllChecklistItems"];
for (const key of reviewedMaintenanceAccountKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:After|Warning|secondaries|completed|Password|Visibility|filename|Collapse|custom translation)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin['mongodb-compact'], english['mongodb-compact']);
assert.match(latin['mongodb-compact-description'], /non sponte minuitur/);
assert.match(latin['mongodb-compact-description'], /tantum postquam.*perfectae sunt/);
assert.match(latin['mongodb-compact-warning'], /secundaria primum.*deinde primarium/);
assert.match(latin['mongodb-compact-warning'], /unius nodi.*solum primarium/);
assert.match(latin['mongodb-compact-error'], /defecit/);
for (const key of ['max-upload-filesize', 'max-avatar-filesize']) assert.match(latin[key], /in octetis:/);
assert.match(latin['invalid-file'], /immissio vel mutatio nominis revocatur/);
assert.match(latin['delete-translation-confirm-popup'], /Revocari non potest/);
assert.equal(latin['show-week-of-year'], 'Monstra hebdomadem anni (ISO 8601)');
assert.match(latin['import-board-zip'], /\.zip.*JSON.*subdirectoria/);
assert.notEqual(latin['collapse-checklist'], latin['expand-checklist']);
assert.match(latin.hideCheckedChecklistItems, /res signatas/);
assert.match(latin.hideAllChecklistItems, /omnes res/);

const reviewedSupportLockoutKeys = ["support", "supportPopup-title", "support-page-enabled", "support-info-not-added-yet", "support-info-only-for-logged-in-users", "support-title", "support-content", "accessibility", "accessibility-page-enabled", "accessibility-info-not-added-yet", "accessibility-title", "accessibility-content", "accounts-lockout-settings", "accounts-lockout-info", "accounts-lockout-known-users", "accounts-lockout-unknown-users", "accounts-lockout-failures-before", "accounts-lockout-period", "accounts-lockout-failure-window", "accounts-lockout-settings-updated", "accounts-lockout-locked-users", "accounts-lockout-locked-users-info", "accounts-lockout-no-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-remaining-time", "accounts-lockout-user-unlocked", "accounts-lockout-confirm-unlock", "accounts-lockout-confirm-unlock-all", "accounts-lockout-show-locked-users", "accounts-lockout-user-locked", "accounts-lockout-click-to-unlock", "accounts-lockout-status", "admin-people-filter-show", "admin-people-filter-all", "admin-people-filter-locked", "admin-people-filter-active", "admin-people-filter-inactive", "admin-people-active-status", "admin-people-user-active", "admin-people-user-inactive", "accounts-lockout-all-users-unlocked", "accounts-lockout-unlock-all", "active-cron-jobs", "add-cron-job", "add-cron-job-placeholder", "attachment-storage-configuration", "attachments-path", "attachments-path-description", "avatars-path", "avatars-path-description"];
for (const key of reviewedSupportLockoutKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Support|Accessibility|Settings|known users|Lockout|Failed|Active|coming soon)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.equal(latin.support, latin['supportPopup-title']);
assert.match(latin['support-info-only-for-logged-in-users'], /tantum usoribus qui ingressi sunt/);
for (const kind of ['support', 'accessibility']) assert.match(latin[`${kind}-info-not-added-yet`], /nondum additae sunt/);
assert.match(latin['accounts-lockout-known-users'], /nomen usoris rectum, tessera falsa/);
assert.match(latin['accounts-lockout-unknown-users'], /nomen usoris quod non exstat/);
for (const kind of ['period', 'failure-window']) assert.match(latin[`accounts-lockout-${kind}`], /\(secunda\)/);
assert.notEqual(latin['accounts-lockout-period'], latin['accounts-lockout-failure-window']);
assert.match(latin['accounts-lockout-confirm-unlock-all'], /omnibus usoribus exclusis/);
assert.match(latin['admin-people-user-active'], /ut inactivum facias/);
assert.match(latin['admin-people-user-inactive'], /ut activum facias/);
assert.match(latin['add-cron-job-placeholder'], /mox aderit/);

const reviewedSchedulingCloudKeys = ["board-archive-failed", "board-archive-scheduled", "board-backup-failed", "board-backup-scheduled", "board-cleanup-failed", "board-cleanup-scheduled", "board-operations", "cron-jobs", "cron-migrations", "cron-job-delete-confirm", "cron-job-delete-failed", "cron-job-deleted", "cron-job-pause-failed", "cron-job-paused", "cron-job-resume-failed", "cron-job-resumed", "cron-job-start-failed", "cron-job-started", "cron-migration-errors", "cron-migration-warnings", "cron-no-errors", "cron-error-severity", "cron-error-message", "cron-error-details", "cron-clear-errors", "cron-retry-failed", "cron-resume-paused", "cron-errors-cleared", "cron-no-failed-migrations", "cron-no-paused-migrations", "cron-migrations-resumed", "cron-migrations-retried", "complete", "idle", "filesystem-path-description", "filesystem-enabled", "filesystem-disabled", "filesystem-enabled-description", "storage-read", "storage-enabled", "s3-minio-storage-description", "s3-force-path-style", "s3-force-path-style-description", "azure-blob-storage", "azure-blob-storage-description", "azure-account-name", "azure-account-key", "azure-connection-string", "azure-connection-string-description", "azure-container", "gcs-storage", "gcs-storage-description"];
for (const key of reviewedSchedulingCloudKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Failed|Scheduled|successfully|Retry|Paused|Enabled|Disabled|Optional|Required)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const kind of ['archive', 'backup', 'cleanup']) {
  assert.match(latin[`board-${kind}-failed`], /tempori destinari non potuit/);
  assert.match(latin[`board-${kind}-scheduled`], /feliciter tempori destinat/);
}
for (const kind of ['delete', 'pause', 'resume', 'start']) assert.match(latin[`cron-job-${kind}-failed`], /non potuit/);
assert.match(latin['cron-retry-failed'], /Itera.*quae defecerunt/);
assert.match(latin['cron-resume-paused'], /Resume.*intermissas/);
assert.notEqual(latin['filesystem-enabled'], latin['filesystem-disabled']);
assert.match(latin['azure-connection-string-description'], /Ad libitum:.*loco nominis et clavis rationis/);
assert.match(latin['s3-force-path-style-description'], /MinIO.*praeter AWS/);
for (const name of ['AWS S3', 'MinIO', 'Cloudflare R2', 'Backblaze B2', 'Wasabi', 'DigitalOcean Spaces']) assert.ok(latin['s3-minio-storage-description'].includes(name));
for (const key of ['azure-blob-storage', 'azure-blob-storage-description', 'gcs-storage', 'gcs-storage-description']) assert.equal(latin[key], english[key]);

const reviewedDatabaseMigrationKeys = ["database-migration-description", "database-migrate-to-ferretdb", "database-migrate-to-mongodb", "database-migration-confirm", "database-migration-phase", "database-migration-done", "sandstorm-migration-description", "sandstorm-migration-status", "sandstorm-migration-success", "sandstorm-migration-failed", "sandstorm-migration-pending", "sandstorm-storage-item", "sandstorm-disk-usage", "sandstorm-raw-mongodb", "sandstorm-delete-raw-mongodb", "sandstorm-delete-raw-mongodb-description", "sandstorm-delete-raw-mongodb-confirm", "sandstorm-raw-mongodb-deleted", "collections", "features-performance", "cards-loading", "cards-loading-auto", "cards-loading-all", "cards-loading-lazy", "cards-loading-description", "cards-loading-lazy-note"];
for (const key of reviewedDatabaseMigrationKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Migrate|database files|Succeeded|Failed|Automatic|experimental|currently visible)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const literal of ['mongodb://127.0.0.1:27018', 'mongodb://127.0.0.1:27019', 'WEKAN_FERRETDB_URL', 'WEKAN_MONGODB_URL', 'MONGO_URL', 'snap set wekan database=ferretdb', '=mongodb']) assert.ok(latin['database-migration-description'].includes(literal));
assert.match(latin['database-migration-confirm'], /non mutantur/);
assert.match(latin['database-migration-confirm'], /currere debet/);
for (const path of ['files/attachments', 'files/avatars']) assert.ok(latin['sandstorm-migration-description'].includes(path));
assert.match(latin['sandstorm-migration-description'], /in primo initio/);
for (const suffix of ['description', 'confirm']) assert.match(latin[`sandstorm-delete-raw-mongodb-${suffix}`], /Hoc revocari non potest/);
assert.equal(new Set(['success', 'failed', 'pending'].map(suffix => latin[`sandstorm-migration-${suffix}`])).size, 3);
for (const literal of ['CARDS_LOADING', '(all/lazy/auto)', 'CARDS_LOADING_LAZY_THRESHOLD']) assert.ok(latin['cards-loading-description'].includes(literal));
assert.match(latin['cards-loading-lazy-note'], /experimentalis.*limites WIP recti/);
assert.match(latin['cards-loading-lazy-note'], /tantum chartas adhuc oneratas/);
assert.match(latin['cards-loading-lazy-note'], /tabulas apertas denuo onera/);

const reviewedSecuritySettingKeys = ["features-security", "render-links-as-plain-text", "render-links-as-plain-text-description", "always-show-code-as-text", "always-show-code-as-text-description", "anonymized-user", "disable-all-import", "disable-all-import-description", "disable-all-export", "disable-all-export-description", "disable-import-avatars", "disable-import-avatars-description", "disable-export-avatars", "disable-export-avatars-description", "anonymize-import-users", "anonymize-import-users-description", "anonymize-export-users", "anonymize-export-users-description", "anonymize-account", "anonymize-account-confirm-popup", "disable-activities", "disable-activities-description", "disable-notifications", "disable-notifications-description", "disable-watch", "disable-watch-description"];
for (const key of reviewedSecuritySettingKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:When enabled|Default|Disable|Anonymize|never rendered|clickable|notifications)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
  if (key.endsWith('-description')) assert.match(latin[key], /Optio initio inactiva est/);
}
for (const literal of ['[label](url)', '<a href>']) assert.ok(latin['render-links-as-plain-text-description'].includes(literal));
assert.ok(latin['always-show-code-as-text-description'].includes('<!-- -->'));
for (const kind of ['import', 'export']) {
  assert.match(latin[`disable-all-${kind}-description`], /serviens quamlibet petitionem.*recusat/);
  for (const literal of ['user1, user2, ...', '@username', 'requested-by / assigned-by']) assert.ok(latin[`anonymize-${kind}-users-description`].includes(literal));
}
assert.match(latin['disable-import-avatars-description'], /Nomina et alia data adhuc importantur/);
assert.match(latin['disable-export-avatars-description'], /Nomina usorum et alia data adhuc exportantur/);
assert.match(latin['anonymize-account-confirm-popup'], /ingressum prohibet/);
assert.match(latin['anonymize-account-confirm-popup'], /historiam servant/);
assert.match(latin['anonymize-account-confirm-popup'], /revocari non potest/);
assert.match(latin['disable-notifications-description'], /Actiones adhuc notari possunt/);
assert.match(latin['disable-watch-description'], /omnis conatus gradum observationis mutandi recusatur/);

const reviewedBackupScopeKeys = ["backup-data", "backup-scope", "backup-scope-instance", "backup-scope-description", "theme-override-all-tenants", "backup-storage", "backup-now", "backup-done", "backup-schedule", "backup-frequency", "backup-frequency-off", "backup-frequency-daily", "backup-frequency-weekly", "backup-frequency-monthly", "backup-time", "backup-day-of-week", "backup-day-of-month", "backup-list", "backup-datetime", "backup-path", "backup-restore-mode", "backup-restore-add-missing", "backup-restore-replace-all", "backup-restore-select-first", "gcs-project-id", "gcs-bucket", "gcs-key-filename", "gcs-key-filename-description", "gcs-credentials", "gcs-credentials-description", "cloud-secret-keep-blank", "azure-account-name-description", "azure-container-description", "gcs-project-id-description", "gcs-bucket-description"];
for (const key of reviewedBackupScopeKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Backup|Scheduled|Whole instance|Restore|Optional|Leave blank|account key)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['backup-scope-description'], /nullas rationes usorum nec configurationes instantiae/);
assert.match(latin['backup-scope-description'], /tantum in tabulas quas illa consociatio possidet/);
assert.match(latin['backup-restore-add-missing'], /tantum data absentia/);
assert.match(latin['backup-restore-replace-all'], /omnia data/);
assert.equal(new Set(['off', 'daily', 'weekly', 'monthly'].map(suffix => latin[`backup-frequency-${suffix}`])).size, 4);
assert.ok(latin['backup-time'].includes('HH:MM'));
assert.ok(latin['backup-day-of-month'].includes('1-28'));
assert.match(latin['gcs-key-filename-description'], /Ad libitum:.*in serviente/);
assert.match(latin['gcs-credentials-description'], /fasciculo clavis vel documentis authentificationis praedefinitis/);
assert.match(latin['cloud-secret-keep-blank'], /valor praesens servetur/);

const reviewedCloudGuidanceKeys = ["gcs-permissions-note", "s3-endpoint-menu-path", "s3-region-menu-path", "s3-bucket-menu-path", "s3-access-key-menu-path", "s3-secret-key-menu-path", "azure-account-name-menu-path", "azure-account-key-menu-path", "azure-connection-string-menu-path", "azure-container-menu-path", "gcs-project-id-menu-path", "gcs-bucket-menu-path", "gcs-key-filename-menu-path", "gcs-credentials-menu-path", "cloud-secret-set", "cloud-secret-none", "test-cloud-connection", "cloud-connection-success", "cloud-connection-failed", "cloud-settings-saved", "cloud-settings-save-failed", "move-storage-azure", "move-storage-gcs", "attachment-move-storage-azure", "attachment-move-storage-gcs", "gridfs-enabled", "gridfs-disabled", "gridfs-enabled-description", "s3-disabled"];
for (const key of reviewedCloudGuidanceKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:your bucket|your account|leave blank|Connection successful|Connection failed|Storage Disabled)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const literal of ['New principals', 'client_email', 'Storage Object Admin', 'Grant access']) assert.ok(latin['gcs-permissions-note'].includes(literal));
for (const literal of ['Application running outside AWS', 'Access key ID', 'Create access key']) assert.ok(latin['s3-access-key-menu-path'].includes(literal));
assert.match(latin['s3-secret-key-menu-path'], /semel tantum cum clavis creatur/);
assert.ok(latin['s3-secret-key-menu-path'].includes('Download .csv'));
assert.match(latin['gcs-key-filename-menu-path'], /AUT insere JSON/);
assert.match(latin['gcs-credentials-menu-path'], /vel serva fasciculum et indica iter eius supra/);
assert.match(latin['cloud-secret-set'], /relinque vacuum/);
assert.notEqual(latin['cloud-connection-success'], latin['cloud-connection-failed']);
assert.notEqual(latin['gridfs-enabled'], latin['gridfs-disabled']);
for (const key of ['move-storage-azure', 'move-storage-gcs']) assert.equal(latin[key], english[key]);

const reviewedMigrationS3Keys = ["all-migrations", "select-migration", "pause", "stop", "migration-starting", "migration-pausing", "migration-stopping", "migration-pause-failed", "migration-paused", "migration-progress", "migration-start-failed", "migration-started", "migration-not-needed", "migration-status", "migration-stop-confirm", "migration-stop-failed", "migration-stopped", "mongodb-gridfs-storage", "gridfs-move-collectionfs-note", "pause-all-migrations", "s3-access-key", "s3-access-key-description", "s3-access-key-placeholder", "s3-bucket", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled", "s3-enabled-description", "s3-endpoint", "s3-endpoint-description", "s3-minio-storage", "s3-port", "s3-port-description", "s3-region", "s3-region-description", "s3-secret-key", "s3-secret-key-description", "s3-secret-key-placeholder", "s3-secret-key-required", "s3-settings-save-failed", "s3-settings-saved", "s3-ssl-enabled", "s3-ssl-enabled-description"];
for (const key of reviewedMigrationS3Keys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Migrations|Starting|Pausing|Stopping|Failed|successful|Enter|Enabled|Required)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.notEqual(latin.pause, latin.stop);
assert.equal(new Set(['starting', 'pausing', 'stopping'].map(state => latin[`migration-${state}`])).size, 3);
for (const action of ['start', 'pause', 'stop']) assert.match(latin[`migration-${action}-failed`], /non potuerunt/);
assert.match(latin['migration-stop-confirm'], /omnes migrationes/);
assert.match(latin['gridfs-move-collectionfs-note'], /ex CollectionFS in quodlibet aliud repositorium/);
assert.notEqual(latin['s3-access-key'], latin['s3-secret-key']);
assert.match(latin['s3-access-key-placeholder'], /clavem accessus/);
assert.match(latin['s3-secret-key-placeholder'], /clavem secretam/);
for (const host of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(latin['s3-endpoint-description'].includes(host));
assert.ok(latin['s3-region-description'].includes('us-east-1'));
assert.ok(latin['s3-ssl-enabled-description'].includes('SSL/TLS'));
assert.match(latin['s3-secret-key-required'], /requiritur/);
assert.notEqual(latin['s3-connection-success'], latin['s3-connection-failed']);

const reviewedBoardMigrationKeys = ["card-show-lists", "save-s3-settings", "schedule-board-archive", "schedule-board-backup", "schedule-board-cleanup", "scheduled-board-operations", "start-all-migrations", "stop-all-migrations", "test-s3-connection", "writable-path", "writable-path-description", "add-job", "attachment-migration", "attachment-monitoring", "attachment-settings", "attachment-storage-settings", "automatic-migration", "back-to-settings", "board-migration", "board-migrations", "card-show-lists-on-minicard", "comprehensive-board-migration", "comprehensive-board-migration-description", "delete-duplicate-empty-lists-migration", "delete-duplicate-empty-lists-migration-description", "lost-cards", "lost-cards-list", "restore-lost-cards-migration", "restore-lost-cards-migration-description", "restore-all-archived-migration", "restore-all-archived-migration-description", "fix-missing-lists-migration", "fix-missing-lists-migration-description", "fix-avatar-urls-migration", "fix-avatar-urls-migration-description", "fix-all-file-urls-migration", "fix-all-file-urls-migration-description", "migration-needed", "migration-complete", "migration-running", "migration-successful", "migration-failed", "migrations", "migrations-admin-only"];
for (const key of reviewedBoardMigrationKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Schedule|Migration Needed|Running|Restore|Only board|Safely|missing|storage backend)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['delete-duplicate-empty-lists-migration-description'], /nullas chartas habent ET.*eodem titulo.*chartas continet/);
for (const kind of ['restore-lost-cards', 'restore-all-archived']) {
  for (const field of ['swimlaneId', 'listId']) assert.ok(latin[`${kind}-migration-description`].includes(field));
}
assert.ok(latin['restore-lost-cards-migration-description'].includes(latin['lost-cards']));
assert.match(latin['restore-all-archived-migration-description'], /omnes semitas, indices et chartas/);
assert.match(latin['migrations-admin-only'], /^Tantum administratores tabulae/);
assert.match(latin['fix-missing-lists-migration-description'], /absentes vel corruptos/);
assert.match(latin['fix-all-file-urls-migration-description'], /huic tabulae adiunctorum/);
assert.notEqual(latin['migration-needed'], latin['migration-complete']);
assert.notEqual(latin['migration-successful'], latin['migration-failed']);
assert.match(latin['writable-path'], /scribere licet/);

const reviewedMigrationConfirmationKeys = ["migrations-description", "no-issues-found", "run-migration", "run-comprehensive-migration-confirm", "run-delete-duplicate-empty-lists-migration-confirm", "run-restore-lost-cards-migration-confirm", "run-restore-all-archived-migration-confirm", "run-fix-missing-lists-migration-confirm", "run-fix-avatar-urls-migration-confirm", "run-fix-all-file-urls-migration-confirm", "restore-lost-cards-nothing-to-restore", "migration-progress-title", "migration-progress-overall", "migration-progress-current-step", "migration-progress-status", "migration-progress-details", "migration-progress-note", "steps", "view", "has-swimlanes", "step-analyze-board-structure", "step-fix-orphaned-cards", "step-convert-shared-lists", "step-ensure-per-swimlane-lists", "step-validate-migration", "step-fix-avatar-urls", "step-fix-attachment-urls", "step-analyze-lists", "step-create-missing-lists", "step-update-cards", "step-finalize", "step-delete-duplicate-empty-lists", "step-ensure-lost-cards-swimlane", "step-restore-lists", "step-restore-cards", "step-restore-swimlanes", "step-fix-missing-ids", "step-scan-users", "step-scan-files", "step-fix-file-urls"];
for (const key of reviewedMigrationConfirmationKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:This will|Continue|Run Migration|Current Step|Fix|Analyze|Checking)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['run-delete-duplicate-empty-lists-migration-confirm'], /primum.*convertet, deinde.*delebit/);
assert.match(latin['run-delete-duplicate-empty-lists-migration-confirm'], /eodem titulo chartas continens/);
assert.match(latin['run-restore-lost-cards-migration-confirm'], /in archivum translatae non sunt/);
for (const field of ['swimlaneId', 'listId']) assert.ok(latin['run-restore-lost-cards-migration-confirm'].includes(field));
assert.match(latin['run-restore-all-archived-migration-confirm'], /OMNES semitas, indices et chartas/);
assert.match(latin['run-restore-all-archived-migration-confirm'], /facile revocari non potest/);
assert.match(latin['step-ensure-per-swimlane-lists'], /cuique semitae indices proprii/);
assert.ok(latin['step-ensure-lost-cards-swimlane'].includes(latin['lost-cards']));
assert.notEqual(latin['migration-progress-overall'], latin['migration-progress-current-step']);

const reviewedMonitoringProgressKeys = ["cleanup", "cleanup-old-jobs", "completed", "conversion-info-text", "converting-board", "converting-board-description", "cpu-cores", "cpu-usage", "current-action", "database-migrations", "days-old", "duration", "errors", "estimated-time-remaining", "every-1-day", "every-1-hour", "every-1-minute", "every-10-minutes", "every-30-minutes", "every-5-minutes", "every-6-hours", "export-monitoring", "filesystem-attachments", "filesystem-size", "filesystem-storage", "force-board-scan", "gridfs-attachments", "gridfs-size", "gridfs-storage", "hide-list-on-minicard", "idle-migration", "job-description", "job-details", "job-name", "job-queue", "last-run", "max-concurrent", "memory-usage", "migrate-all-to-filesystem", "migrate-all-to-gridfs", "migrate-all-to-s3", "migrated-attachments", "migration-batch-size", "migration-batch-size-description", "migration-cpu-threshold", "migration-cpu-threshold-description", "migration-delay-ms", "migration-delay-ms-description", "migration-detector", "migration-info-text", "migration-log", "migration-markers", "migration-resume-failed", "migration-resumed", "migration-steps", "migration-warning-text", "monitoring-export-failed", "monitoring-refresh-failed", "next", "next-run", "of", "operation-type", "overall-progress", "page", "pause-migration"];
for (const key of reviewedMonitoringProgressKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Cleanup|Completed|Converting|Current|Every|Migration Progress|background|browser|Failed)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['conversion-info-text'], /semel pro quaque tabula/);
assert.match(latin['conversion-info-text'], /more solito uti pergere potes/);
for (const [key, range] of [['migration-batch-size-description', '1-100'], ['migration-cpu-threshold-description', '10-90'], ['migration-delay-ms-description', '100-10000']]) assert.ok(latin[key].includes(range));
assert.match(latin['migration-cpu-threshold-description'], /Intermitte.*excedit/);
assert.match(latin['migration-info-text'], /in recessu pergit etiam si navigatrum claudis/);
assert.match(latin['migration-warning-text'], /ne claudas.*in recessu perget.*diutius/);
for (const n of [5, 10, 30]) assert.ok(latin[`every-${n}-minutes`].includes(String(n)));
assert.equal(latin['gridfs-storage'], 'GridFS');
assert.notEqual(latin['last-run'], latin['next-run']);
assert.notEqual(latin['monitoring-export-failed'], latin['monitoring-refresh-failed']);

const reviewedStatusAccountKeys = ["previous", "refresh", "refresh-monitoring", "remaining-attachments", "resume-migration", "run-once", "s3-attachments", "s3-size", "s3-storage", "scanning-status", "schedule", "search-boards-or-operations", "show-list-on-minicard", "showChecklistAtMinicard", "showing", "start-test-operation", "start-time", "step-progress", "stop-migration", "storage-distribution", "system-resources", "total-attachments", "total-operations", "total-size", "unmigrated-boards", "weight", "cron", "current-step", "otp", "create-account", "already-account", "available-repositories", "repositories", "repository", "repository-name", "size-bytes", "last-modified", "no-repositories", "create-repository", "upload-repository", "api-endpoints", "sign-in-to-upload", "account-locked", "otp-required", "invalid-credentials", "username-password-required", "password-mismatch", "username-too-short", "user-exists", "account-created", "account-creation-failed", "login-allow", "confirm", "error", "file", "log", "logout", "server", "protocol", "summary", "problems-summary-help", "problems-status-title", "problems-in-progress-help", "problems-none-in-progress", "no-new-problems", "repair-broken-cards", "repairing", "repair-broken-cards-done", "repair-broken-cards-done-unfixable", "restore-list-swimlanes-done"];
for (const key of reviewedStatusAccountKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Refresh|Remaining|Create Account|username or password|temporarily|No new problems|Repaired)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
assert.match(latin['account-locked'], /ad tempus.*postea conare/);
assert.match(latin['username-too-short'], /saltem 3 characteres/);
assert.match(latin['username-password-required'], /et tessera requiruntur/);
assert.match(latin['invalid-credentials'], /vel tessera/);
assert.match(latin['account-created'], /Nunc ingredi potes/);
assert.ok(latin['problems-summary-help'].includes(latin.acknowledge));
assert.match(latin['problems-summary-help'], /quas recensuisti.*ad zerum/);
assert.match(latin['repair-broken-cards-done-unfixable'], /nullam tabulam habent et automatice corrigi non possunt/);
assert.match(latin['restore-list-swimlanes-done'], /__remaining__ restitui non potuerunt/);
assert.equal(latin['s3-storage'], 'S3');

const reviewedFlowReportKeys = ["cpu-usage-current", "cpu-cores-suffix", "cpu-load-average", "event-datetime", "event-category", "event-severity", "event-action", "event-source", "event-detail", "event-ip", "event-ipv4", "event-ipv6", "event-attempts", "integrityReportTitle", "export-select-what-to-include", "export-card-details", "import-here-instruction", "import-scoped-failed", "import-not-wekan-export", "import-board-source", "import-source-heading", "import-parts-instruction", "import-wekan-file", "wip-limit-groups", "wip-limit-group-add", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "board-view-aging-wip", "board-view-blocker-analysis", "board-view-size-cycle-time", "flow-unknown", "flow-cycle-days", "flow-age-days", "flow-p85", "flow-samples", "flow-signal", "flow-unusual", "flow-blocker", "flow-episodes", "flow-active", "flow-blocked-days", "flow-unknown-start", "flow-confidence", "flow-target-count", "flow-finish-days", "flow-finish-date", "flow-target-date", "flow-history-days", "flow-beyond-horizon", "flow-size-source", "flow-size", "flow-error", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime", "time-adjustments", "stuck-sync-operation-progress", "stuck-sync-operation-reason", "stuck-sync-operation-discard", "stuck-sync-operation-refresh", "interrupted-import-discard", "interrupted-import-refresh"];
for (const key of reviewedFlowReportKeys) {
  assert.doesNotMatch(latin[key], /Latine:|\b(?:Unknown|Import failed|Blocking card|Open episodes|Could not load|Discard|Refresh)\b/, key);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]), key);
}
for (const [key, value] of Object.entries(latin)) assert.doesNotMatch(value, /Latine:/, key);
assert.match(latin['import-parts-instruction'], /Tantum partes signatae.*Eadem electio/);
assert.match(latin['flow-note-agingWip'], /85.*saltem quinque morae/);
assert.match(latin['flow-note-agingWip'], /historia ingressus deest, aetas ignota/);
assert.match(latin['flow-note-blockerAnalysis'], /tempore coincidunt separatim numerantur/);
for (const literal of ['2,000', 'UTC', '3,650']) assert.ok(latin['flow-note-monteCarlo'].includes(literal));
assert.match(latin['flow-note-monteCarlo'], /dies quibus nihil perficitur/);
assert.match(latin['flow-note-monteCarlo'], /cauda superiore.*cauda inferiore/);
assert.match(latin['flow-note-monteCarlo'], /nulla cautio.*nihil perfectum.*nulla praedictio/);
assert.match(latin['flow-note-processBehavior'], /XmR.*saltem duae completiones validae/);
assert.match(latin['flow-note-sizeCycleTime'], /Aestimationes absentes et dies invalidi omittuntur/);
assert.equal(latin['stuck-sync-operation-discard'], latin['interrupted-import-discard']);
assert.equal(latin['stuck-sync-operation-refresh'], latin['interrupted-import-refresh']);

for (const format of ['todoist', 'planner']) {
  const key = `import-board-instruction-${format}`;
  assert.match(latin[key], /aperi.*elige/);
  assert.doesNotMatch(latin[key], /\b(?:open the|then paste|Sections become|Buckets become|with their)\b/);
  assert.deepEqual(tokens(latin[key]), tokens(english[key]));
}
assert.ok(latin['import-board-instruction-todoist'].includes('Manage data > Export as CSV'));
assert.match(latin['import-board-instruction-todoist'], /@labels.*p1 ad p3/);
assert.match(latin['import-board-instruction-todoist'], /submunera fiunt index probationis/);
assert.ok(latin['import-board-instruction-planner'].includes('Export as Excel (in Planner classico: Export plan to Excel)'));
assert.match(latin['import-board-instruction-planner'], /\.xlsx/);
assert.match(latin['import-board-instruction-planner'], /Progress, Priority et Completed By fiunt campi proprii/);
