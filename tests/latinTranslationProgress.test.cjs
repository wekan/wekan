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
