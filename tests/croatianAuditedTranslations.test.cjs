'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/hr.i18n.json'), 'utf8'));
const english = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/en.i18n.json'), 'utf8'));
const { translationTokens } = require('../releases/translations/placeholder-tokens.mjs');
const correctedControls = ["activity-moved", "activity-checklist-uncompleted-card", "allboards.starred", "allboards.remaining", "allboards.workspaces", "allboards.add-workspace", "allboards.add-workspace-prompt", "allboards.add-subworkspace", "allboards.add-subworkspace-prompt", "allboards.edit-workspace-name", "addWorkspacePopup-title", "add-template", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "convertChecklistItemToCardPopup-title", "add-cover", "add-after-list", "memberPopup-title", "and-n-other-card", "and-n-other-card_plural", "template-container", "board-change-background-image", "board-background-image-url", "remove-background-image", "board_members", "board-private-info", "board-public-info", "boardChangeColorPopup-title", "allBoardsChangeBackgroundImagePopup-title", "boardChangeViewPopup-title", "board-view", "zoom-level", "enter-zoom-level", "board-view-collapse", "board-view-gantt", "board-view-table", "calendar-previous-month-label", "calendar-next-month-label", "due-today", "positiveVoteMembersPopup-title", "negativeVoteMembersPopup-title", "vote-question", "card-edit-planning-poker", "poker-question", "poker-finish", "poker-result-votes", "poker-result-who", "poker-replay", "set-estimation", "cardArchivePopup-title", "cardDetailsActionsPopup-title", "cardAssigneePopup-title", "deleteAvatarPopup-title", "close-card", "color-indigo", "color-lime", "color-magenta", "color-mistyrose", "color-orange", "color-paleturquoise", "color-peachpuff", "color-plum", "color-saddlebrown", "color-sky", "color-slateblue", "unset-color", "comments", "comment-only", "comment-only-desc", "comment-assigned-only"];
for (const key of correctedControls) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.equal(data['allboards.workspaces'], 'Radni prostori');
assert.match(data['activity-checklist-uncompleted-card'], /nedovršenu/);
assert.match(data['add-card-to-top-of-list'], /vrh popisa/);
assert.match(data['add-card-to-bottom-of-list'], /dno popisa/);
assert.match(data['board-private-info'], /<strong>privatna<\/strong>/);
assert.match(data['board-public-info'], /<strong>javna<\/strong>/);
assert.match(data['enter-zoom-level'], /50-300%/);
assert.equal(data['board-view-table'], 'Tablica');
assert.equal(data['poker-result-who'], 'Tko');
assert.equal(data['calendar-previous-month-label'], 'Prethodni mjesec');
assert.equal(data['calendar-next-month-label'], 'Sljedeći mjesec');
assert.match(data['comment-only-desc'], /samo komentirati/);
const correctedPermissions = ["deleteCommentPopup-title", "read-only", "read-assigned-only", "worker", "worker-desc", "computer", "confirm-subtask-delete-popup", "copy-card-link-to-clipboard", "copy-text-to-clipboard", "linkCardPopup-title", "copyManyCardsPopup-title", "current", "custom-field-currency-option", "custom-field-dropdown-none", "date-format", "date-format-yyyy-mm-dd", "date-format-dd-mm-yyyy", "date-format-mm-dd-yyyy", "deleteCustomFieldPopup-title", "deleteLabelPopup-title", "done", "edit-wip-limit", "soft-wip-limit", "addReactionPopup-title", "editCardSpentTimePopup-title", "editNotificationPopup-title", "email", "email-address", "email-enrollAccount-subject", "email-fail", "email-fail-text", "email-invalid", "email-invite", "email-invite-subject", "push-invite-title", "enable-wip-limit", "error-board-doesNotExist", "error-board-notAdmin", "error-board-notAMember", "error-json-malformed", "error-json-schema", "error-list-doesNotExist", "error-user-doesNotExist", "error-user-notAllowSelf", "error-user-notCreated", "error-username-taken", "error-email-taken", "export-board", "export-card", "export-card-attachment-size", "exportBoardPopup-title", "exportCardPopup-title", "sort", "sorted", "remove-sort", "list-label-modifiedAt", "list-label-title", "list-label-sort", "list-label-short-modifiedAt", "list-label-short-title", "list-label-short-sort", "filter", "filter-cards", "filter-dates-label", "filter-no-due-date"];
for (const key of correctedPermissions) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
for (const key of ['date-format-yyyy-mm-dd', 'date-format-dd-mm-yyyy', 'date-format-mm-dd-yyyy']) {
  assert.equal(data[key], english[key], 'literal date format: ' + key);
}
assert.match(data['worker-desc'], /samo premještati.*dodijeliti sebe.*komentirati/);
assert.equal(data['read-only'], 'Samo za čitanje');
assert.equal(data.computer, 'Računalo');
assert.match(data['error-board-notAdmin'], /administrator/);
assert.match(data['error-board-notAMember'], /član/);
assert.match(data['error-user-notAllowSelf'], /Ne možete pozvati sami sebe/);
assert.match(data['email-fail'], /nije uspjelo/);
assert.match(data['error-json-malformed'], /JSON/);
assert.match(data['list-label-modifiedAt'], /posljednjeg pristupa/);
assert.equal(data['filter-no-due-date'], 'Bez roka');
const correctedFilters = ["filter-overdue", "filter-due-today", "filter-due-tomorrow", "filter-clear", "filter-labels-label", "filter-assignee-label", "filter-creator-label", "filter-no-assignee", "filter-custom-fields-label", "filter-no-custom-fields", "filter-hide-empty", "filter-on-desc", "filter-to-selection", "other-filters-label", "advanced-filter-label", "fullname", "header-logo-title", "show-activities", "import-board", "import-json-placeholder", "import-map-members", "invalid-date", "invalid-time", "invalid-user", "joined", "just-invited", "keyboard-shortcuts", "label-default", "link-card", "list-archive-cards", "list-archive-cards-pop", "list-move-cards", "set-color-list", "settingsUserPopup-title", "settingsTeamPopup-title", "settingsOrgPopup-title", "listImportCardPopup-title", "listImportCardsTsvPopup-title", "link-list", "list-delete-suggest-archive", "gantt", "log-out", "log-in", "loginPopup-title", "memberMenuPopup-title", "menu", "move-selection", "copy-selection", "moveCardPopup-title", "moveCardToBottom-title", "moveCardToTop-title", "moveSelectionPopup-title", "copySelectionPopup-title", "selection-color", "multi-selection", "multi-selection-member", "multi-selection-on", "normal-assigned-only", "notify-watch", "participating", "remove-cover", "search-example", "select-color", "select-board", "setWipLimitPopup-title", "shortcut-add-self", "shortcut-assign-self", "shortcut-autocomplete-emoji", "shortcut-autocomplete-members", "shortcut-clear-filters"];
for (const key of correctedFilters) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.equal(data['filter-due-today'], 'Rok danas');
assert.equal(data['filter-due-tomorrow'], 'Rok sutra');
assert.match(data['filter-hide-empty'], /prazne popise/);
assert.match(data['list-archive-cards-pop'], /povratak na ploču/);
assert.match(data['list-delete-suggest-archive'], /sačuvali aktivnosti/);
assert.equal(data['move-selection'], 'Premjesti odabir');
assert.equal(data['copy-selection'], 'Kopiraj odabir');
assert.match(data['moveCardToBottom-title'], /na dno/);
assert.match(data['moveCardToTop-title'], /na vrh/);
assert.equal(data['log-in'], 'Prijava');
assert.equal(data['log-out'], 'Odjava');
assert.match(data['shortcut-add-self'], /Dodaj sebe/);
assert.match(data['shortcut-assign-self'], /Dodijeli sebe/);
assert.match(data['search-example'], /Enter/);
assert.match(data['listImportCardsTsvPopup-title'], /Excel CSV\/TSV/);
const correctedSidebar = ["shortcut-close-dialog", "shortcut-filter-my-cards", "shortcut-toggle-filterbar", "shortcut-toggle-searchbar", "shortcut-toggle-sidebar", "show-cards-minimum-count", "sidebar-open", "sidebar-close", "signupPopup-title", "starred-boards", "starred-boards-description", "team", "this-board", "this-card", "spent-time-hours", "overtime-hours", "has-overtime-cards", "has-spenttime-cards", "tracking", "unassign-member", "unsaved-description", "unwatch", "upload", "upload-avatar", "uploaded-avatar", "uploading-files", "upload-failed", "upload-completed", "import-usernames", "view-it", "warn-list-archived", "watching", "welcome-board", "welcome-swimlane", "card-templates-swimlane", "list-templates-swimlane", "board-templates-swimlane", "what-to-do", "wipLimitErrorPopup-title", "wipLimitErrorPopup-dialog-pt2", "people", "invite-people", "to-boards", "email-addresses", "smtp-host-description", "smtp-port-description", "smtp-tls-description", "smtp-host", "smtp-port", "smtp-tls", "send-smtp-test", "email-templates-title", "email-templates-invite-subject", "email-templates-invite-body", "email-templates-activity-subject", "email-templates-activity-body", "invitation-code", "email-invite-register-subject", "email-smtp-test-subject", "email-smtp-test-text", "error-invitation-code-not-exist", "error-notAuthorized", "webhook-title", "webhook-token", "outgoing-webhooks", "bidirectional-webhooks", "outgoingWebhooksPopup-title", "boardCardTitlePopup-title", "disable-webhook", "global-webhook", "new-outgoing-webhook", "MongoDB_storage_engine", "MongoDB_Oplog_enabled", "OS_Arch", "OS_Cpus"];
for (const key of correctedSidebar) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.equal(data['sidebar-open'], 'Otvori bočnu traku');
assert.equal(data['sidebar-close'], 'Zatvori bočnu traku');
assert.match(data['upload-failed'], /nije uspio/);
assert.match(data['upload-completed'], /je dovršen/);
assert.match(data['unsaved-description'], /nespremljen opis/);
assert.match(data['wipLimitErrorPopup-dialog-pt2'], /Premjestite.*ili.*veće WIP/);
assert.match(data['smtp-port-description'], /odlaznu e-poštu/);
assert.match(data['smtp-tls-description'], /TLS.*SMTP/);
assert.match(data['email-templates-invite-subject'], /Predmet/);
assert.match(data['email-templates-invite-body'], /Sadržaj/);
assert.match(data['disable-webhook'], /Onemogući/);
assert.match(data['bidirectional-webhooks'], /Dvosmjerni/);
assert.match(data['error-notAuthorized'], /Nemate ovlasti/);
assert.equal(data['welcome-swimlane'], 'Prekretnica 1');
const correctedCardSettings = ["OS_Freemem", "OS_Loadavg", "OS_Platform", "OS_Release", "OS_Totalmem", "OS_Type", "OS_Uptime", "show-field-on-card", "showLabel-field-on-card", "tableVisibilityMode", "createdAt", "modifiedAt", "verified", "active", "card-received", "card-received-on", "card-end", "card-end-on", "editCardReceivedDatePopup-title", "editCardEndDatePopup-title", "setCardColorPopup-title", "setSelectionColorPopup-title", "setCardActionsColorPopup-title", "setSwimlaneColorPopup-title", "setListColorPopup-title", "board-delete-notice", "delete-board-confirm-popup", "delete-all-notifications", "default-subtasks-board", "queue", "subtask-settings", "card-settings", "minicard-settings", "boardSubtaskSettingsPopup-title", "boardCardSettingsPopup-title", "boardMinicardSettingsPopup-title", "deposit-subtasks-board", "show-parent-in-minicard", "description-on-minicard", "cover-attachment-on-minicard", "badge-attachment-on-minicard", "prefix-with-full-path", "prefix-with-parent", "subtext-with-full-path", "subtext-with-parent", "change-card-parent", "parent-card", "source-board", "no-parent", "activity-added-label", "activity-removed-label", "activity-delete-attach", "activity-added-label-card", "activity-removed-label-card", "activity-delete-attach-card", "r-rule", "r-add-trigger", "r-add-action", "r-board-rules", "r-view-rule", "r-delete-rule", "r-new-rule-name", "r-no-rules", "r-edit-rule-trigger-action", "r-w-assignee-added", "r-w-assignee-removed", "r-board", "r-sort-by", "r-trigger", "r-action"];
for (const key of correctedCardSettings) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.match(data['board-delete-notice'], /Brisanje je trajno/);
assert.match(data['delete-board-confirm-popup'], /nije moguće poništiti/);
assert.match(data['activity-added-label'], /dodao/);
assert.match(data['activity-removed-label'], /uklonio/);
assert.match(data['prefix-with-full-path'], /punom putanjom/);
assert.match(data['prefix-with-parent'], /nadređenom karticom/);
assert.equal(data['r-trigger'], 'Okidač');
assert.equal(data['r-action'], 'Radnja');
const correctedRuleActions = ["r-when-a-card", "set-filter", "r-moved-to", "r-moved-from", "r-archived", "r-unarchived", "r-when-the-label", "r-when-a-member", "r-when-the-member", "r-when-a-assignee", "r-when-the-assignee", "r-when-a-attach", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-when-a-checklist", "r-when-the-checklist", "r-completed", "r-made-incomplete", "r-when-a-item", "r-when-the-item", "r-move-card-to", "r-top-of", "r-bottom-of", "r-its-list", "r-unarchive", "r-card", "r-label", "r-member", "r-remove-all", "r-set-color", "r-checklist", "r-check-all", "r-uncheck-all", "r-items-check", "r-item", "r-of-checklist", "r-send-email", "r-rule-details", "r-d-send-email", "r-d-archive", "r-d-unarchive", "r-d-add-label", "r-d-remove-label", "r-create-card", "r-in-list", "r-in-swimlane", "r-d-add-member", "r-d-remove-member", "r-d-remove-all-member", "r-d-check-one", "r-d-uncheck-one", "r-d-check-of-list", "r-d-add-checklist", "r-d-remove-checklist", "r-by", "r-add-checklist", "r-with-items", "r-items-list", "r-add-swimlane", "r-swimlane-name", "r-set", "r-update", "r-df-start-at", "r-df-due-at", "r-df-end-at", "r-df-received-at", "custom-product-name", "layout", "hide-logo", "error-undefined", "duplicate-board", "team-number", "restore-all", "delete-all", "previous_as", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt", "above-selected-card"];
for (const key of correctedRuleActions) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.match(data['r-d-archive'], /u arhivu/);
assert.match(data['r-d-unarchive'], /iz arhive/);
assert.match(data['r-d-add-member'], /Dodaj/);
assert.match(data['r-d-remove-member'], /Ukloni/);
assert.match(data['r-check-all'], /Označi sve/);
assert.match(data['r-uncheck-all'], /Poništi/);
assert.equal(data['r-top-of'], 'Vrh');
assert.equal(data['r-bottom-of'], 'Dno');
assert.equal(data['r-items-list'].split(',').length, 3);
assert.match(data['r-when-a-end-date-changed'], /završetka/);
assert.match(data['r-when-a-received-date-changed'], /primitka/);
const correctedSearchControls = ["below-selected-card", "duenow", "assignee", "no-assignee", "cardAssigneesPopup-title", "addmore-detail", "show-on-card", "show-on-minicard", "new", "editOrgPopup-title", "newOrgPopup-title", "editTeamPopup-title", "newTeamPopup-title", "editUserPopup-title", "newUserPopup-title", "notifications", "view-all", "filter-by-unread", "mark-all-as-read", "remove-all-read", "allow-rename", "allowRenamePopup-title", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "status", "owner", "last-modified-at", "last-activity", "voting", "archived", "task", "create-task", "ok", "organizations", "teams", "displayName", "shortName", "website", "person", "my-attachments", "list", "myCardsViewChange-title", "myCardsViewChange-choice-table", "myCardsSortChange-choice-dueat", "dueCards-title", "dueCardsViewChange-title", "dueCardsViewChangePopup-title", "dueCardsViewChange-choice-me", "dueCardsViewChange-choice-all", "globalSearch-title", "n-n-of-n-cards-found", "operator-board", "operator-board-abbrev", "operator-swimlane", "operator-swimlane-abbrev", "operator-list-abbrev", "operator-label", "operator-user", "operator-member", "operator-member-abbrev", "operator-assignee", "operator-assignee-abbrev", "operator-creator", "operator-status", "operator-due", "operator-created", "operator-modified", "operator-sort", "operator-comment", "operator-has", "operator-limit", "operator-debug", "operator-org", "operator-team", "operator-description"];
for (const key of correctedSearchControls) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
const searchAbbreviations = Object.entries(data).filter(([key]) => /^operator-.*-abbrev$/.test(key)).map(([, value]) => value);
assert.equal(new Set(searchAbbreviations).size, searchAbbreviations.length);
for (const key of correctedSearchControls.filter(key => key.startsWith('operator-'))) {
  assert.match(data[key], /^[\p{Letter}\p{Mark}]+$/u, key + ': searchable operator syntax');
}
assert.equal(data['operator-board'], 'ploča');
assert.equal(data['operator-swimlane'], 'traka');
assert.equal(data['operator-member'], 'član');
assert.equal(data['operator-assignee'], 'zaduženi');
assert.match(data['filter-by-unread'], /nepročitano/);
assert.match(data['mark-all-as-read'], /Označi.*pročitano/);
assert.match(data['remove-all-read'], /Ukloni.*pročitano/);
assert.equal(data['wednesday'], 'Srijeda');
assert.equal(data['myCardsViewChange-choice-table'], 'Tablica');
const correctedPredicates = ["operator-attachment-text", "operator-checklist-text", "predicate-archived", "predicate-open", "predicate-ended", "predicate-all", "predicate-overdue", "predicate-week", "predicate-month", "predicate-quarter", "predicate-year", "predicate-due", "predicate-modified", "predicate-created", "predicate-attachment", "predicate-description", "predicate-checklist", "predicate-start", "predicate-end", "predicate-assignee", "predicate-member", "predicate-public", "predicate-private", "predicate-selector", "predicate-projection", "operator-unknown-error", "operator-status-invalid", "next-page", "previous-page", "heading-notes", "globalSearch-instructions-status-archived", "link-to-search", "excel-font", "label-colors", "label-names", "archived-at", "sort-cards", "sort-is-on", "cardsSortPopup-title", "due-date", "server-error", "title-alphabetically", "links-heading", "move-swimlane", "moveSwimlanePopup-title", "custom-field-stringtemplate", "creator", "creator-on-minicard", "reports", "boardsReportTitle", "office-people", "copy-swimlane", "copySwimlanePopup-title", "wait-spinner", "Bounce", "Cube", "Dot", "Scaleout", "Wave", "maximize-card", "minimize-card", "subject", "details", "carbon-copy", "ticket"];
for (const key of correctedPredicates) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
for (const key of correctedPredicates.filter(key => key.startsWith('predicate-') || key.endsWith('-text'))) {
  assert.match(data[key], /^[\p{Letter}\p{Mark}]+$/u, key + ': searchable token syntax');
}
assert.equal(data['excel-font'], 'Arial');
assert.match(data['carbon-copy'], /Cc:/);
assert.equal(data['predicate-public'], 'javno');
assert.equal(data['predicate-private'], 'privatno');
assert.equal(data['predicate-quarter'], 'tromjesečje');
assert.match(data['move-swimlane'], /Premjesti/);
assert.match(data['copy-swimlane'], /Kopiraj/);
assert.match(data['maximize-card'], /Povećaj/);
assert.match(data['minimize-card'], /Smanji/);
assert.match(data['next-page'], /Sljedeća/);
assert.match(data['previous-page'], /Prethodna/);
const correctedAdminControls = ["tickets", "ticket-number", "open", "pending", "closed", "resolved", "cancelled", "history", "request", "requests", "help-request", "cardDetailsPopup-title", "add-teams", "confirm-btn", "add-organizations", "legalNotice", "copied", "moveChecklist", "moveChecklistPopup-title", "newLineNewItem", "originOrder", "copyChecklist", "copyChecklistPopup-title", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "card-show-lists", "attachment-move", "move-progress-pause", "path", "version-name", "size", "storage", "action", "board-title", "uploading", "remaining_time", "speed", "progress", "password-again", "register", "forgot-password", "minicardDetailsActionsPopup-title", "Mongo_sessions_count", "allowed-avatar-filetypes", "drag-board", "newTranslationPopup-title", "editTranslationPopup-title", "translation", "translation-text", "collapse", "uncollapse", "support", "supportPopup-title", "support-title", "support-content", "accessibility-title", "accessibility-content", "accounts-lockout-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-remaining-time", "accounts-lockout-user-locked", "accounts-lockout-status", "admin-people-filter-show", "admin-people-filter-active", "admin-people-active-status", "accounts-lockout-unlock-all", "add-cron-job", "attachments-path", "board-operations", "cron-jobs", "cron-error-severity", "cron-error-message", "cron-error-details", "cron-retry-failed", "complete"];
for (const key of correctedAdminControls) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.equal(data['pending'], 'Na čekanju');
assert.equal(data['resolved'], 'Riješeno');
assert.equal(data['cancelled'], 'Otkazano');
assert.match(data['moveChecklist'], /Premjesti/);
assert.match(data['copyChecklist'], /Kopiraj/);
assert.match(data['copyChecklistFromTemplate'], /iz predloška/);
assert.equal(data['collapse'], 'Sažmi');
assert.equal(data['uncollapse'], 'Proširi');
assert.match(data['accounts-lockout-locked-users'], /Zaključani/);
assert.match(data['accounts-lockout-unlock-all'], /Otključaj sve/);
assert.match(data['cron-retry-failed'], /neuspjele migracije/);
assert.match(data['Mongo_sessions_count'], /Mongo/);
const correctedMigrationControls = ["idle", "sandstorm-storage-item", "anonymized-user", "features-notifications", "backup-restore", "all-migrations", "select-migration", "pause", "stop", "migration-progress", "migration-status", "mongodb-gridfs-storage", "pause-all-migrations", "s3-access-key", "s3-connection-failed", "s3-endpoint", "s3-minio-storage", "s3-port-description", "s3-secret-key", "s3-secret-key-placeholder", "s3-secret-key-required", "s3-settings-saved", "save-s3-settings", "schedule-board-archive", "schedule-board-cleanup", "start-all-migrations", "stop-all-migrations", "test-s3-connection", "writable-path", "add-job", "attachment-settings", "automatic-migration", "back-to-settings", "board-migration", "card-show-lists-on-minicard", "comprehensive-board-migration", "lost-cards", "lost-cards-list", "migration-needed", "migration-complete", "migration-running", "migration-failed", "migrations", "no-issues-found", "run-migration", "migration-progress-overall", "migration-progress-status", "migration-progress-details", "steps", "view", "has-swimlanes", "step-analyze-board-structure", "step-validate-migration", "step-analyze-lists", "step-update-cards", "step-finalize", "step-restore-cards", "cleanup", "cleanup-old-jobs", "completed", "converting-board", "cpu-cores", "cpu-usage", "current-action", "database-migrations", "days-old", "duration", "errors", "every-1-day", "every-1-hour", "every-1-minute", "every-10-minutes", "every-30-minutes", "every-5-minutes", "every-6-hours", "export-monitoring", "filesystem-attachments", "filesystem-storage", "force-board-scan", "gridfs-size"];
for (const key of correctedMigrationControls) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.match(data['s3-access-key'], /Pristupni ključ S3/);
assert.match(data['s3-secret-key'], /Tajni ključ S3/);
assert.match(data['s3-secret-key-required'], /obvezan/);
assert.match(data['s3-connection-failed'], /nije uspjelo/);
assert.match(data['mongodb-gridfs-storage'], /MongoDB GridFS/);
assert.match(data['s3-minio-storage'], /S3\/MinIO/);
assert.match(data['start-all-migrations'], /Pokreni sve/);
assert.match(data['pause-all-migrations'], /Pauziraj sve/);
assert.match(data['stop-all-migrations'], /Zaustavi sve/);
assert.match(data['migration-failed'], /nije uspjela/);
assert.equal(data['migration-complete'], 'Dovršeno');
assert.match(data['every-6-hours'], /6 sati/);
assert.match(data['every-30-minutes'], /30 minuta/);
assert.match(data['export-monitoring'], /Izvezi podatke/);
const correctedFlowMessages = ["idle-migration", "job-description", "job-details", "job-name", "job-queue", "last-run", "max-concurrent", "memory-usage", "migration-batch-size", "migration-delay-ms", "migration-detector", "migration-log", "migration-markers", "migration-resumed", "migration-steps", "next", "next-run", "operation-type", "overall-progress", "page", "pause-migration", "previous", "refresh", "resume-migration", "run-once", "s3-size", "scanning-status", "schedule", "showing", "start-test-operation", "start-time", "step-progress", "stop-migration", "storage-distribution", "system-resources", "total-operations", "total-size", "unmigrated-boards", "weight", "cron", "current-step", "confirm", "problems-status-title", "wip-limit-group-select-swimlane", "wip-limit-group-apply-swimlane", "board-view-aging-wip", "board-view-size-cycle-time", "flow-age-days", "flow-p85", "flow-samples", "flow-episodes", "flow-active", "flow-finish-days", "flow-finish-date", "flow-history-days", "flow-size-source", "flow-size", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "flow-note-processBehavior", "flow-note-sizeCycleTime", "move-reason", "ask-move-reason", "time-adjustment-note"];
for (const key of correctedFlowMessages) {
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.equal(data['cron'], 'Cron');
assert.match(data['migration-delay-ms'], /\(ms\)/);
assert.match(data['resume-migration'], /Nastavi/);
assert.match(data['stop-migration'], /Zaustavi/);
assert.match(data['flow-note-agingWip'], /85.*najmanje pet/);
assert.match(data['flow-note-agingWip'], /nepoznato/);
assert.match(data['flow-note-blockerAnalysis'], /preklapaju.*zasebno/);
assert.match(data['flow-note-monteCarlo'], /2\.000.*UTC/);
assert.match(data['flow-note-monteCarlo'], /bez dovršenih stavki/);
assert.match(data['flow-note-monteCarlo'], /nije jamstvo.*3\.650/);
assert.match(data['flow-note-processBehavior'], /XmR.*najmanje dva/);
assert.match(data['flow-note-sizeCycleTime'], /nevaljani datumi izostavljaju/);
assert.match(data['time-adjustment-note'], /Negativne vrijednosti.*ispravke/);
assert.match(data['time-adjustment-note'], /neevidentirano vrijeme ne može/);
const syncRecoveryKeys = Object.keys(english).filter(key => key.startsWith('stuck-sync-operation-'));
assert.equal(syncRecoveryKeys.length, 23);
for (const key of syncRecoveryKeys) {
  assert.notEqual(data[key], english[key], key);
  assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
assert.match(data['stuck-sync-operation-description'], /već primijenjene promjene ostaju/);
assert.match(data['stuck-sync-operation-description'], /preostale spremljene promjene nikada se ne zapisuju/);
assert.match(data['stuck-sync-operation-replayable-now'], /ne može odbaciti/);
assert.match(data['stuck-sync-operation-not-stuck'], /ne može odbaciti/);
assert.match(data['stuck-sync-operation-reason-access-denied'], /pravo pisanja za cijeli popis/);
assert.match(data['stuck-sync-operation-truncated'], /50 najstarijih/);
assert.match(data['stuck-sync-operation-busy'], /upravo sinkronizira/);
const translatedPlanningControls = ["board-announcement", "board-announcement-enabled", "cards-use-list-color", "import-board-instruction-opml", "import-board-instruction-orgmode", "import-board-instruction-todoist", "external-link-rules", "external-link-rules-description", "external-link-identifier-aliases", "read-only-field", "r-moved-forward", "r-moved-back", "r-assignee", "r-add-actinguser-assignee", "r-remove-all-assignees", "ldap-sync-now", "ldap-sync-now-done", "ldap-sync-now-error", "ldap-sync-now-nothing", "oauth-providers-allowed-email-domains", "login-origin-mismatch", "scrum-release-scope", "scrum-releases-select-help", "scrum-import-into-board", "scrum-import-into-board-hint", "scrum-import-preview", "scrum-import-choose-file", "scrum-import-invalid-file", "scrum-import-preview-sprints", "scrum-import-preview-releases", "scrum-import-preview-cards", "scrum-import-preview-nothing", "scrum-import-into-board-done", "scrum-import-card-not-matched", "scrum-import-card-ambiguous", "scrum-import-card-on-another-board", "scrum-import-record-ambiguous", "scrum-import-record-not-imported", "scrum-import-sprint-finished", "sync-planning-sprint", "sync-planning-releases", "sync-planning-fields", "sync-planning-hint", "scrum-history-checkpoint-stuck", "scrum-history-checkpoint-counts", "scrum-history-checkpoint-hint", "scrum-history-checkpoint-rollback", "scrum-history-checkpoint-discard", "scrum-history-checkpoint-discard-confirm", "scrum-history-checkpoint-ask-admin", "login-setting-env-only"];
for (const key of translatedPlanningControls) {
  assert.notEqual(data[key], english[key], key);
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
}
for (const literal of ['TODO', 'DONE', 'SCHEDULED', 'DEADLINE', 'CLOSED']) {
  assert.ok(data['import-board-instruction-orgmode'].includes(literal), literal);
}
for (const literal of ['@labels', 'p1', 'p3', 'CSV']) {
  assert.ok(data['import-board-instruction-todoist'].includes(literal), literal);
}
assert.ok(data['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
assert.ok(data['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
for (const literal of ['LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED']) {
  assert.ok(data['ldap-sync-now-nothing'].includes(literal), literal);
}
assert.match(data['login-origin-mismatch'], /ROOT_URL/);
assert.match(data['sync-planning-hint'], /prva sinkronizacija nikada ne uklanja/);
assert.match(data['scrum-import-into-board-hint'], /nikada se ne udvostručuju/);
assert.match(data['scrum-history-checkpoint-hint'], /nitko drugi.*nije promijenio/);
assert.match(data['scrum-history-checkpoint-hint'], /ne mijenja zapise/);
assert.match(data['login-setting-env-only'], /samo za čitanje/);
assert.equal(data.board, 'Ploča');
assert.equal(data.swimlane, 'Traka');
assert.deepEqual(Object.keys(data), Object.keys(english));
for (const key of Object.keys(english)) {
  assert.deepEqual(translationTokens(data[key]), translationTokens(english[key]), key);
  if (key.startsWith('interrupted-import-')) {
    assert.notEqual(data[key], english[key], key);
    assert.doesNotMatch(data[key], /[\p{Script=Cyrillic}]/u, key);
  }
}
assert.match(data['interrupted-import-description'], /ne može nastaviti/);
assert.match(data['interrupted-import-description'], /uključujući sve što je dodano nakon toga/);
assert.match(data['interrupted-import-keep-confirm'], /Ništa se ne uklanja/);
assert.match(data['interrupted-import-discard-confirm'], /trajno se uklanjaju/);
assert.match(data['interrupted-import-foreign-board'], /nije izmijenjena/);
assert.match(data['interrupted-import-truncated'], /50 najstarijih/);
const corrections = JSON.parse(fs.readFileSync(path.join(root, 'releases/translations/audited-corrections.json'), 'utf8')).filter(row => row.locale === 'hr');
assert.ok(corrections.length >= 18);
for (const row of corrections) assert.doesNotMatch(data[row.key], /[\p{Script=Cyrillic}]/u);
assert.match(data.Node_heap_does_zap_garbage, /prepisivanje .* uzorkom bitova/);
assert.doesNotMatch(data.Node_heap_does_zap_garbage, /skupljanje|kupи/);
assert.match(data.Node_memory_usage_rss, /rezidentna/);
assert.match(data.Node_heap_malloced_memory, /funkcijom malloc/);
assert.match(data['Double-Bounce'], /dvostrukim poskakivanjem/);
assert.doesNotMatch(data['Double-Bounce'], /tri točkice/);
assert.match(data['admin-people-user-active'], /kliknite za deaktivaciju/);
assert.match(data['admin-people-user-inactive'], /kliknite za aktivaciju/);
assert.doesNotMatch(data['admin-people-user-active'], /platn|plać/);
assert.equal(data.allowNonBoardMembers, 'Dopusti sve prijavljene korisnike');
assert.match(data['app-is-offline'], /uzrokovat će gubitak podataka/);
assert.doesNotMatch(data['attachment-move-storage-s3'], /Amazon|oblak/);
assert.match(data['automatic-linked-url-schemes'], /Jedna URL shema po retku/);
assert.doesNotMatch(data['automatic-linked-url-schemes'], /Internetu/);
assert.match(data['automatically-field-on-card'], /novim karticama/);
assert.match(data['board-drag-drop-reorder-or-click-open'], /Kliknite ikonu ploče/);
for (const key of ['board-archive-scheduled', 'board-backup-scheduled', 'board-cleanup-scheduled']) assert.match(data[key], /zakazan/);
assert.equal(data['board-info-on-my-boards'], 'Postavke svih ploča');
assert.match(data['checklistItemDeletePopup-title'], /stavku kontrolnog popisa/);
assert.doesNotMatch(data['checklistDeletePopup-title'], /stavku/);
assert.match(data.card_members, /Svi članovi/);
assert.match(data.card_assignees, /Svi zaduženi korisnici/);
assert.match(data['card-archive-suggest-cancel'], /vratiti iz arhive/);
assert.match(data['comment-assigned-only-desc'], /samo dodijeljene kartice/);
assert.match(data['comment-assigned-only-desc'], /Može samo komentirati/);
assert.doesNotMatch(data['comment-assigned-only-desc'], /uređivati/);
for (const key of ['created-at-newest-first', 'created-at-oldest-first']) assert.match(data[key], /Datum stvaranja/);
assert.match(data['conversion-info-text'], /nastaviti normalno koristiti/);
assert.match(data['close-edit-checklist-item'], /obrazac za uređivanje stavke/);
assert.ok(data['custom-field-stringtemplate-format'].includes('%{value}'));
assert.doesNotMatch(data['custom-field-stringtemplate-format'], /%\{vrijednost\}/);
for (const entity of ['&#32;', '&nbsp;']) assert.ok(data['custom-field-stringtemplate-separator'].includes(entity));
assert.match(data['custom-field-delete-pop'], /ne može poništiti/);
assert.match(data['custom-field-delete-pop'], /sa svih kartica/);
assert.match(data['custom-field-delete-pop'], /povijest biti izbrisana/);
assert.match(data['custom-top-left-corner-logo-height'], /Zadano: 27/);
assert.doesNotMatch(data['custom-login-logo-image-url'], /Internet/);
assert.match(data['delete-all-notifications-confirm'], /ne može poništiti/);
assert.match(data['delete-duplicate-empty-lists-migration-description'], /nemaju kartice I imaju drugi popis istog naslova koji sadrži kartice/);
assert.match(data['delete-linked-cards-before-this-list'], /prije nego što izbrišete povezane kartice/);
for (const key of ['delete-org-confirm-popup', 'delete-team-confirm-popup', 'delete-translation-confirm-popup', 'delete-user-confirm-popup']) assert.match(data[key], /ne može poništiti/);
for (const key of ['delete-org-warning-message', 'delete-team-warning-message']) assert.match(data[key], /barem jedan korisnik/);
assert.match(data['deposit-subtasks-list'], /Odredišni popis za podzadatke/);
assert.doesNotMatch(data['delete-team-confirm-popup'], /pravni/);
assert.match(data['email-verifyEmail-text'], /adrese e-pošte svojeg računa/);
assert.match(data['error-csv-schema'], /CSV.*TSV.*ispravnom formatu/);
assert.match(data['filter-due-next-week'], /sljedeći tjedan/);
assert.match(data['filter-due-this-week'], /ovaj tjedan/);
assert.match(data['fix-all-file-urls-migration'], /URL-ove datoteka/);
assert.doesNotMatch(data['error-teamname-taken'], /pravni/);
assert.match(data['globalSearch-instructions-description'], /`list:Blocked`/);
assert.match(data['globalSearch-instructions-description'], /`__operator_list__:"To Review"`/);
assert.match(data['globalSearch-instructions-notes-2'], /\*ILI\*/);
assert.match(data['globalSearch-instructions-notes-3'], /\*I\*/);
assert.match(data['globalSearch-instructions-notes-3'], /`__operator_list__:Available __operator_label__:red`/);
assert.match(data['globalSearch-instructions-notes-4'], /ne razlikuje velika i mala slova/);
assert.doesNotMatch(data['globalSearch-instructions-notes-4'], /Pretraživanje teksta razlikuje/);
assert.match(data['globalSearch-instructions-operator-at'], /`__operator_user_abbrev__username`/);
assert.match(data['globalSearch-instructions-operator-at'], /`user:<username>`/);
assert.match(data['globalSearch-instructions-operator-created'], /prije najviše/);
assert.match(data['globalSearch-instructions-operator-due'], /sljedećih najviše/);
assert.doesNotMatch(data['globalSearch-instructions-operator-assignee'], /punomoć/);
assert.match(data['globalSearch-instructions-operator-has'], /`has:-due`/);
assert.doesNotMatch(data['globalSearch-instructions-operator-has'], /ima:-/);
assert.match(data['globalSearch-instructions-operator-label'], /boji .* ili nazivu/);
assert.match(data['globalSearch-instructions-operator-limit'], /pozitivan cijeli broj/);
assert.match(data['globalSearch-instructions-status-ended'], /s datumom završetka/);
assert.doesNotMatch(data['globalSearch-instructions-status-ended'], /dovršene kartice/);
assert.match(data['globalSearch-instructions-status-private'], /samo na privatnim pločama/);
assert.match(data['globalSearch-instructions-status-public'], /samo na javnim pločama/);
assert.match(data['globalSearch-instructions-operator-sort'], /silazno.*`-`/);
assert.match(data['globalSearch-instructions-operator-org'], /ploči dodijeljenoj organizaciji/);
assert.match(data['import-board-instruction-wekan'], /'Izvezi ploču'/);
assert.doesNotMatch(data['import-board-instruction-wekan'], /'Uvezi/);
for (const menu of ['Menu', 'More', 'Print and Export', 'Export JSON']) assert.ok(data['import-board-instruction-trello'].includes("'" + menu + "'"));
assert.match(data['hideCheckedChecklistItems'], /označene stavke kontrolnog popisa/);
assert.match(data['import-members-map-note'], /trenutačnom korisniku/);
assert.match(data['invite-people-success'], /registraciju/);
assert.match(data['keyboard-shortcuts-disabled'], /Kliknite za omogućavanje/);
assert.match(data['keyboard-shortcuts-enabled'], /Kliknite za onemogućavanje/);
assert.doesNotMatch(data['keyboard-shortcuts-disabled'], /Kliknite za onemogućavanje/);
assert.match(data['label-delete-pop'], /povijest biti izbrisana/);
assert.match(data['list-delete-pop'], /nećete moći vratiti popis/);
assert.match(data['list-delete-pop'], /ne može poništiti/);
assert.match(data['leave-board-pop'], /sa svih kartica na ovoj ploči/);
assert.match(data['migration-batch-size-description'], /\(1-100\)/);
for (const key of ['max-avatar-filesize', 'max-upload-filesize']) assert.match(data[key], /bajtovima/);
assert.doesNotMatch(data['migrate-all-to-s3'], /Amazon|oblak/);
assert.match(data['migration-cpu-threshold-description'], /premaši ovaj postotak \(10-90\)/);
assert.match(data['migration-delay-ms-description'], /milisekundama \(100-10000\)/);
assert.match(data['migration-info-text'], /čak i ako zatvorite preglednik/);
assert.match(data['migration-warning-text'], /Nemojte zatvarati preglednik/);
assert.match(data['migrations-admin-only'], /^Samo administratori ploče/);
assert.doesNotMatch(data['migration-started'], /oštećenih spisa/);
assert.equal(data['my-cards'], 'Moje kartice');
assert.equal(data['myCardsSortChange-choice-board'], 'Prema ploči');
assert.match(data['move-all-attachments-of-board-to-s3'], /sve privitke ploče/);
for (const key of ['move-all-attachments-to-s3', 'move-all-attachments-of-board-to-s3']) assert.doesNotMatch(data[key], /Amazon|oblak/);
assert.match(data['multi-selection-active'], /potvrdne okvire/);
assert.match(data['public-desc'], /Samo osobe dodane na ploču mogu je uređivati/);
assert.match(data['push-invite-text'], /vas poziva da se pridružite/);
assert.doesNotMatch(data['push-invite-text'], /pun uvid|potpun pristup/);
assert.match(data['r-d-move-to-bottom-gen'], /dno njezina popisa/);
assert.match(data['r-d-move-to-top-gen'], /vrh njezina popisa/);
assert.match(data['r-d-uncheck-all'], /Ukloni oznake/);
for (const key of ['read-assigned-only-desc', 'read-only-desc']) assert.match(data[key], /Ne može ih uređivati/);
assert.match(data['read-assigned-only-desc'], /samo dodijeljene kartice/);
assert.match(data['remove-labels-multiselect'], /1-9/);
assert.match(data['remove-member-pop'], /Primit će obavijest/);
assert.doesNotMatch(data['remove-organization-from-board'], /zabran/);
assert.match(data['restore-all-archived-migration-description'], /staze, popise i kartice/);
assert.match(data['run-restore-lost-cards-migration-confirm'], /samo na nearhivirane stavke/);
assert.match(data['run-restore-all-archived-migration-confirm'], /SVE arhivirane staze, popise i kartice/);
assert.match(data['run-restore-all-archived-migration-confirm'], /nije lako poništiti/);
for (const field of ['swimlaneId', 'listId']) assert.ok(data['restore-lost-cards-migration-description'].includes(field));
assert.doesNotMatch(data['run-restore-lost-cards-migration-confirm'], /samo na arhivirane/);
assert.match(data['s3-enabled-description'], /AWS S3 ili MinIO/);
assert.doesNotMatch(data['s3-ssl-enabled-description'], /Amazon/);
assert.match(data['search-cards'], /opise i prilagođena polja/);
for (const endpoint of ['s3.amazonaws.com', 'minio.example.com']) assert.ok(data['s3-endpoint-description'].includes(endpoint));
for (const command of ['sudo snap logs wekan.wekan', 'sudo docker logs wekan-app']) assert.ok(data['server-error-troubleshooting'].includes('`' + command + '`'));
assert.match(data['set-swimlane-height-value'], /pikseli/);
assert.match(data['showSum-field-on-list'], /zbroj polja/);
assert.doesNotMatch(data['showSum-field-on-list'], /\bbroj polja/);
assert.match(data['show-at-all-boards-page'], /Sve ploče/);
assert.match(data['shortcut-filter-my-assigned-cards'], /dodijeljene meni/);
assert.match(data['star-board-title'], /na vrhu vašeg popisa ploča/);
assert.match(data['support-info-only-for-logged-in-users'], /samo prijavljenim korisnicima/);
assert.equal(data['step-restore-lists'], 'Vrati popise');
assert.equal(data['step-restore-swimlanes'], 'Vrati staze');
assert.doesNotMatch(data['subtaskDeletePopup-title'], /predmet/);
assert.equal(data.accessibility, 'Pristupačnost');
assert.match(data['accounts-lockout-known-users'], /ispravno korisničko ime, pogrešna lozinka/);
assert.match(data['accounts-lockout-failure-window'], /neuspjelih pokušaja \(sekunde\)/);
assert.match(data['accounts-lockout-period'], /\(sekunde\)/);
assert.doesNotMatch(data['accounts-lockout-info'], /lozinkef/);
assert.equal(data['support-page-enabled'], 'Stranica podrške omogućena');
assert.match(data['swimlane-delete-pop'], /nećete moći oporaviti stazu/);
assert.match(data['swimlane-delete-pop'], /Poništavanje nije moguće/);
assert.match(data['swimlane-height-error-message'], /pozitivan cijeli broj/);
assert.doesNotMatch(data['team-name-not-found'], /pravni/);
assert.match(data['toggle-assignees'], /1-9.*redoslijedu dodavanja na ploču/);
assert.match(data['toggle-labels'], /Višestruki odabir dodaje oznake 1-9/);
assert.equal(data['vote-public'], 'Prikaži tko je kako glasovao');
assert.doesNotMatch(data['vote-public'], /rezultate/);
assert.match(data['wipLimitErrorPopup-dialog-pt1'], /veći je od WIP ograničenja/);
assert.match(data['calendar-system-islamic-rgsa'], /opažanje Mjeseca/);
assert.match(data['calendar-system-islamic-tbla'], /tablični, astronomska epoha/);
for (const example of ['== != <= >= && || ( )', 'Field1 == Value1', "'Field 1' == 'Value 1'", 'F1 == V1 || F1 == V2', 'F1 == V1 && ( F2 == V2 || F2 == V3 )', 'F1 == /Tes.*/i']) {
  assert.ok(data['advanced-filter-description'].includes(example), example);
}
const escapedExample = english['advanced-filter-description'].match(/Field1 == I.*?m/)[0];
assert.ok(data['advanced-filter-description'].includes(escapedExample));
assert.match(data['advanced-filter-description'], /slijeva nadesno/);
assert.doesNotMatch(data['advanced-filter-description'], /Advanced Filter allows/);
console.log('croatianAuditedTranslations: target script, V8 metrics and indicator meanings passed');

(async () => {
  const translator = require('i18next').createInstance().use(require('i18next-sprintf-postprocessor'));
  await translator.init({ lng: 'hr', fallbackLng: false, keySeparator: false, interpolation: { prefix: '__', suffix: '__', escapeValue: false }, resources: { hr: { translation: data } }, postProcess: ['sprintf'] });
  assert.equal(translator.t('act-a-endAt', { timeValue: 'NEW', timeOldValue: 'OLD' }), 'promijenio vrijeme završetka na NEW s (OLD)');
  assert.equal(translator.t('activity-dueDate', { sprintf: ['DATE', 'CARD'] }), 'promijenio rok na DATE za karticu CARD');
  for (const [key, date] of [['activity-endDate', 'završetka'], ['activity-receivedDate', 'primitka'], ['activity-startDate', 'početka']]) {
    assert.equal(translator.t(key, { sprintf: ['DATE', 'CARD'] }), `promijenio datum ${date} na DATE za karticu CARD`);
  }
  assert.match(data['activity-unset-customfield'], /uklonio vrijednost/);
  assert.doesNotMatch(data['admin-people-filter-inactive'], /plać|platn/);
  assert.match(data['admin-desc'], /uklanjati članove/);
  assert.ok(data['add-custom-html-after-body-start'].includes('<body>'));
  assert.ok(data['add-custom-html-before-body-end'].includes('</body>'));
  assert.equal(translator.t('email-resetPassword-subject', { siteName: 'SITE' }), 'Ponovno postavite lozinku na SITE');
  const invitation = translator.t('email-invite-text', { user: 'USER', inviter: 'INVITER', board: 'BOARD', url: 'LOCAL_URL' });
  for (const value of ['USER', 'INVITER', 'BOARD', 'LOCAL_URL']) assert.ok(invitation.includes(value));
  assert.match(invitation, /vas poziva da se pridružite/);
  assert.doesNotMatch(invitation, /pun uvid|potpun pristup/);
  assert.match(data['dueCardsViewChange-choice-all-description'], /nedovršene kartice/);
  assert.match(data['dueCardsViewChange-choice-all-description'], /korisnik ima dopuštenje/);
  assert.equal(translator.t('swimlane-title-not-found', { sprintf: ['LANE'] }), "Staza 'LANE' nije pronađena.");
  assert.equal(translator.t('n-cards-found', { sprintf: ['7'] }), 'Pronađeno je 7 kartica');
  assert.match(data['normal-assigned-only-desc'], /samo dodijeljene kartice/);
  assert.doesNotMatch(data['normal-assigned-only-desc'], /sve kartice|puna prava/);
  assert.match(data['notify-participate'], /autor ili član/);
  assert.match(data['newlineBecomesNewChecklistItemOriginOrder'], /izvornim redoslijedom/);
  assert.equal(translator.t('operator-number-expected', { operator: 'LIMIT', value: 'BAD' }), "Operator LIMIT očekivao je broj, a dobio je 'BAD'");
  assert.equal(translator.t('page-maybe-private', { sprintf: ['/login'] }), "Ova je stranica možda privatna. Možda je možete pregledati ako se <a href='/login'>prijavite</a>.");
  assert.match(data['operator-limit-invalid'], /pozitivan cijeli broj/);
  assert.match(data['private-desc'], /Samo osobe dodane na ploču/);
  assert.doesNotMatch(data['private-desc'], /svi korisnici/);
  assert.match(data['act-newDue'], /prvi podsjetnik/);
  assert.match(data['act-duenow'], /upravo sada/);
  assert.doesNotMatch(data['act-duenow'], /danas/);
  console.log('croatianAuditedTranslations: real activity rendering and reminder meanings passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
