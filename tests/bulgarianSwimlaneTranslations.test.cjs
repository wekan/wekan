'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), bg = read('bg');
  for (const key of Object.keys(en).filter(key => /^(interrupted-import-|stuck-sync-operation-|scrum-import-|sync-planning-|scrum-history-checkpoint-|ldap-sync-now)/.test(key))) {
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЏ]/, key);
  }
  assert.match(bg['interrupted-import-description'], /не може да продължи/);
  assert.match(bg['interrupted-import-description'], /включително всичко добавено оттогава/);
  assert.match(bg['interrupted-import-keep-confirm'], /Нищо не се премахва/);
  assert.match(bg['interrupted-import-discard-confirm'], /премахват окончателно/);
  assert.match(bg['interrupted-import-foreign-board'], /не е променено/);
  assert.match(bg['interrupted-import-truncated'], /50-те най-стари/);
  assert.match(bg['stuck-sync-operation-description'], /вече приложените промени се запазват/);
  assert.match(bg['stuck-sync-operation-description'], /никога не се записват/);
  assert.match(bg['stuck-sync-operation-replayable-now'], /не може да бъде отхвърлена/);
  assert.match(bg['stuck-sync-operation-replayable'], /не беше отхвърлена/);
  assert.match(bg['scrum-import-into-board-hint'], /никога не се дублират/);
  assert.match(bg['scrum-import-card-on-another-board'], /оставена непроменена/);
  assert.match(bg['scrum-import-sprint-finished'], /не е преместена/);
  assert.match(bg['sync-planning-hint'], /първо по ID в източника, после по име/);
  assert.match(bg['sync-planning-hint'], /първото синхронизиране никога не премахва/);
  assert.match(bg['scrum-history-checkpoint-hint'], /никой друг не е променил/);
  assert.match(bg['scrum-history-checkpoint-hint'], /не променя нито един запис/);
  assert.match(bg['scrum-history-checkpoint-discard-confirm'], /вече е записала/);
  assert.match(bg['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS/);
  assert.match(bg['ldap-sync-now-nothing'], /LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED/);
  assert.ok(bg['external-link-rules-description'].includes('[{identifier}:{number}] = https://tracker.example.com/{identifier}/{number}'));
  assert.ok(bg['external-link-identifier-aliases'].includes('TK=Task, IN=Incident'));
  assert.match(bg['r-moved-forward'], /напред/);
  assert.match(bg['r-moved-back'], /назад/);
  assert.match(bg['login-origin-mismatch'], /ROOT_URL/);
  assert.match(bg['login-setting-env-only'], /само от средата на сървъра/);
  const keys = ['act-createSwimlane', 'act-archivedSwimlane', 'setSwimlaneHeightPopup-title',
    'set-swimlane-height', 'set-swimlane-height-value', 'swimlane-height-error-message',
    'swimlaneActionPopup-title', 'swimlaneAddPopup-title', 'welcome-swimlane',
    'r-in-swimlane', 'swimlaneDeletePopup-title', 'swimlane-delete-pop', 'swimlane',
    'swimlane-title-not-found', 'operator-swimlane', 'globalSearch-instructions-operator-swimlane',
    'move-swimlane', 'moveSwimlanePopup-title', 'copy-swimlane', 'copySwimlanePopup-title',
    'has-swimlanes', 'step-ensure-per-swimlane-lists', 'step-ensure-lost-cards-swimlane',
    'step-restore-swimlanes', 'wip-limit-group-select-swimlane', 'wip-limit-group-apply-swimlane'];
  for (const key of keys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЏ]|поступ|врста|списи|опорав/i, key);
    if (key !== 'welcome-swimlane') assert.match(bg[key], /коридор/i, key);
  }
  const activityKeys = ["act-deleteComment", "act-createCard", "act-createCustomField", "act-deleteCustomField", "act-createList", "act-addBoardMember", "act-archivedCard", "act-archivedList", "act-joinMember", "act-moveCardToOtherBoard", "activity-changedListTitle", "activity-receivedDate", "activity-startDate", "allboards.remaining", "allboards.add-subworkspace", "allboards.edit-workspace", "multi-selection-active", "activity-dueDate", "activity-endDate", "add-template", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled", "add-existing-card-as-subtask-empty", "close-add-checklist-item", "close-edit-checklist-item", "convertChecklistItemToCardPopup-title", "add-cover", "add-after-list", "admin-desc", "app-is-offline", "archive-board-confirm", "add-template-container", "avatar-too-big", "board-info-on-my-boards", "boardInfoOnMyBoardsPopup-title", "boardInfoOnMyBoards-title", "show-card-counter-per-list", "board_assignees", "card_assignees", "board-drag-drop-reorder-or-click-open", "boardChangeBackgroundImagePopup-title", "desktop-mode", "mobile-mode", "mobile-desktop-toggle", "enter-zoom-level", "bucket-example", "card-delete-notice", "card-delete-pop", "card-archive-pop", "card-archive-suggest-cancel", "allowNonBoardMembers", "vote-question", "vote-public"];
  for (const key of activityKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['card-delete-pop'], /няма да можете.*необратимо/);
  assert.match(bg['card-archive-suggest-cancel'], /можете да възстановите/);
  assert.match(bg['keyboard-shortcuts-enabled'], /включени.*изключите/);
  assert.match(bg['keyboard-shortcuts-disabled'], /изключени.*включите/);
  assert.match(bg['add-card-to-top-of-list'], /началото/);
  assert.match(bg['add-card-to-bottom-of-list'], /края/);
  assert.equal(bg['allowNonBoardMembers'], 'Разрешаване на всички влезли потребители');
  const controlKeys = ["deleteVotePopup-title", "vote-delete-pop", "cardStartPlanningPokerPopup-title", "card-edit-planning-poker", "editPokerEndDatePopup-title", "deletePokerPopup-title", "poker-delete-pop", "cardArchivePopup-title", "cardAssigneePopup-title", "casSignIn", "samlSignIn", "deleteAvatarPopup-title", "color-magenta", "color-mistyrose", "comment-assigned-only", "comment-assigned-only-desc", "comment-delete", "deleteCommentPopup-title", "read-assigned-only", "read-assigned-only-desc", "confirm-checklist-delete-popup", "subtaskDeletePopup-title", "checklistDeletePopup-title", "checklistItemDeletePopup-title", "copy-text-to-clipboard", "copyManyCardsPopup-title", "copyManyCardsPopup-instructions", "copyManyCardsPopup-format", "createTemplateContainerPopup-title", "custom-field-delete-pop", "custom-field-dropdown-options", "disambiguateMultiLabelPopup-title", "disambiguateMultiMemberPopup-title", "addReactionPopup-title", "email-enrollAccount-text", "email-invite-subject", "email-invite-text", "push-invite-title", "push-invite-text", "email-resetPassword-subject", "email-resetPassword-text", "email-verifyEmail-text", "error-csv-schema", "error-orgname-taken", "error-teamname-taken"];
  for (const key of controlKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['read-assigned-only-desc'], /само възложените карти.*Не може да редактира/);
  assert.match(bg['comment-assigned-only-desc'], /само възложените карти.*само да коментира/);
  assert.match(bg['custom-field-delete-pop'], /необратимо.*всички карти.*историята/);
  assert.match(bg['card-edit-planning-poker'], /планиране/);
  assert.match(bg['email-invite-subject'], /^__inviter__ ви изпрати покана$/);
  const example = JSON.parse(bg['copyManyCardsPopup-format']);
  assert.equal(example.length, 3);
  for (const card of example) assert.deepEqual(Object.keys(card), ['title', 'description']);
  const importKeys = ["user-can-not-export-card-to-pdf", "remove-sort", "list-sort-by", "list-label-modifiedAt", "list-label-sort", "filter-dates-label", "filter-no-due-date", "filter-overdue", "filter-due-this-week", "filter-due-next-week", "list-filter-label", "filter-member-label", "filter-assignee-label", "filter-creator-label", "filter-custom-fields-label", "import-board-instruction-trello", "import-board-instruction-csv", "import-board-instruction-wekan", "import-board-instruction-about-errors", "import-map-members", "import-members-map", "import-members-map-note", "import-show-user-mapping", "import-user-select", "label-delete-pop", "last-admin-desc", "leave-board-pop", "listActionPopup-title", "list-delete-pop", "selection-color", "muted-info", "normal-desc", "normal-assigned-only", "normal-assigned-only-desc", "not-accepted-yet", "notify-participate", "page-maybe-private", "participating", "private-desc", "public-desc", "quick-access-description", "remove-member-pop", "rescue-card-description", "rescue-card-description-dialogue", "set-wip-limit-value", "shortcut-filter-my-assigned-cards", "shortcut-show-shortcuts", "star-board-title", "toggle-assignees", "toggle-labels"];
  for (const key of importKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['import-board-instruction-wekan'], /Експортиране на табло/);
  assert.match(bg['public-desc'], /Само хората.*могат да го редактират/);
  assert.match(bg['normal-desc'], /Не може да променя настройките/);
  assert.match(bg['last-admin-desc'], /поне един администратор/);
  assert.match(bg['import-members-map-note'], /текущия потребител/);
  assert.match(bg['page-maybe-private'], /<a href='%s'>.*<\/a>/);
  assert.equal((bg['toggle-labels'].match(/1-9/g) || []).length, 2);
  assert.match(bg['toggle-assignees'], /1-9/);
  const notificationKeys = ["remove-labels-multiselect", "tracking-info", "unassign-member", "uploading-files", "upload-failed", "upload-completed", "custom-top-left-corner-logo-image-url", "custom-top-left-corner-logo-link-url", "custom-top-left-corner-logo-height", "custom-login-logo-image-url", "custom-login-logo-link-url", "custom-help-link-url", "text-below-custom-login-logo", "automatic-linked-url-schemes", "watching-info", "wipLimitErrorPopup-dialog-pt1", "email-invite-register-subject", "email-invite-register-text", "automatically-field-on-card", "always-field-on-card", "showSum-field-on-list", "tableVisibilityMode-allowPrivateOnly", "tableVisibilityMode", "setSelectionColorPopup-title", "card-sorting-by-number", "delete-all-notifications-confirm", "delete-duplicate-lists-confirm", "deposit-subtasks-list", "cover-attachment-on-minicard", "badge-attachment-on-minicard", "card-sorting-by-number-on-minicard", "activity-set-customfield", "activity-unset-customfield", "r-w-assignee-added", "r-w-assignee-removed", "r-when-a-label-is", "r-when-a-assignee", "r-when-the-assignee", "r-send-email", "r-d-send-email", "r-d-check-all", "r-d-uncheck-all", "r-d-check-one", "r-d-uncheck-one", "r-board-note"];
  for (const key of notificationKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['delete-duplicate-lists-confirm'], /едно и също име и не съдържат карти/);
  assert.match(bg['delete-all-notifications-confirm'], /всички известия.*необратимо/);
  assert.match(bg['tracking-info'], /създател или член/);
  assert.match(bg['watching-info'], /всяка промяна в това табло/);
  assert.match(bg['automatically-field-on-card'], /новите карти/);
  assert.match(bg['always-field-on-card'], /всички карти/);
  assert.match(bg['remove-labels-multiselect'], /1-9/);
  assert.match(bg['automatic-linked-url-schemes'], /една URL схема на ред/);
  assert.match(bg['r-d-check-all'], /като изпълнени$/);
  assert.match(bg['r-d-uncheck-all'], /като неизпълнени$/);
  assert.match(bg['r-d-check-one'], /като изпълнен$/);
  assert.match(bg['r-d-uncheck-one'], /като неизпълнен$/);
  const deadlineKeys = ["r-checklist-note", "r-when-a-card-is-moved", "r-datefield", "r-to-current-datetime", "r-remove-value-from", "r-link-card", "authentication-method", "authentication-type", "add-custom-html-after-body-start", "add-custom-html-before-body-end", "error-ldap-login", "display-authentication-method", "default-authentication-method", "org-number", "team-number", "people-number", "loading", "act-a-dueAt", "act-a-endAt", "act-a-startAt", "act-a-receivedAt", "a-dueAt", "a-endAt", "a-startAt", "a-receivedAt", "almostdue", "pastdue", "duenow", "act-newDue", "act-withDue", "act-almostdue", "act-pastdue", "act-duenow", "delete-user-confirm-popup", "delete-team-confirm-popup", "delete-org-confirm-popup", "accounts-allowUserDelete", "hide-minicard-label-text", "show-desktop-drag-handles", "assignee", "cardAssigneesPopup-title", "addmore-detail", "show-on-card", "show-on-minicard", "filter-by-unread"];
  for (const key of deadlineKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg.almostdue, /наближава$/);
  assert.match(bg.pastdue, /е изтекъл$/);
  assert.match(bg.duenow, /е днес$/);
  assert.match(bg['act-duenow'], /настъпва сега$/);
  assert.match(bg['act-newDue'], /първо напомняне/);
  for (const entity of ['user', 'team', 'org']) {
    assert.match(bg['delete-' + entity + '-confirm-popup'], /необратимо/);
  }
  assert.equal(bg.assignee, 'Изпълнител');
  assert.equal(bg['cardAssigneesPopup-title'], bg.assignee);
  assert.match(bg['r-checklist-note'], /разделени със запетаи/);
  assert.match(bg['add-custom-html-after-body-start'], /след.*<body>/);
  assert.match(bg['add-custom-html-before-body-end'], /преди.*<\/body>/);
  const searchKeys = ["allow-rename", "allowRenamePopup-title", "start-day-of-week", "last-modified-at", "last-activity", "voting", "delete-linked-card-before-this-card", "delete-linked-cards-before-this-list", "hide-checked-items", "hide-finished-checklist", "autoAddUsersWithDomainName", "myCardsSortChange-title", "myCardsSortChangePopup-title", "myCardsSortChange-choice-board", "myCardsSortChange-choice-dueat", "dueCardsViewChange-choice-me", "dueCardsViewChange-choice-all-description", "dueCards-noResults-title", "dueCards-noResults-description", "broken-cards", "board-title-not-found", "list-title-not-found", "label-not-found", "label-color-not-found", "user-username-not-found", "comment-not-found", "org-name-not-found", "team-name-not-found", "no-cards-found", "one-card-found", "n-cards-found", "n-n-of-n-cards-found", "operator-assignee", "operator-modified", "operator-limit", "operator-debug", "predicate-week", "predicate-year", "predicate-public", "predicate-private", "predicate-projection", "operator-unknown-error", "operator-number-expected", "operator-sort-invalid", "operator-status-invalid", "operator-has-invalid", "operator-limit-invalid", "operator-debug-invalid", "next-page", "globalSearch-instructions-heading", "globalSearch-instructions-description", "globalSearch-instructions-operators", "globalSearch-instructions-operator-list", "globalSearch-instructions-operator-comment", "globalSearch-instructions-operator-label", "globalSearch-instructions-operator-hash", "globalSearch-instructions-operator-user", "globalSearch-instructions-operator-at", "globalSearch-instructions-operator-member", "globalSearch-instructions-operator-assignee"];
  for (const key of searchKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['dueCardsViewChange-choice-all-description'], /незавършени карти.*краен срок.*има разрешение/);
  assert.match(bg['comment-not-found'], /карта с коментар.*'%s'/);
  assert.match(bg['operator-limit-invalid'], /положително цяло число/);
  assert.match(bg['globalSearch-instructions-description'], /`list:Blocked`.*\*Blocked\*/);
  assert.match(bg['globalSearch-instructions-description'], /двоеточие.*интервали.*кавички/);
  assert.match(bg['globalSearch-instructions-operator-label'], /или/);
  assert.match(bg['globalSearch-instructions-operator-user'], /член.*или.*изпълнител/);
  assert.match(bg['globalSearch-instructions-operator-member'], /е \*член\*/);
  assert.match(bg['globalSearch-instructions-operator-assignee'], /е \*изпълнител\*/);
  assert.match(bg['delete-linked-cards-before-this-list'], /преди първо да изтриете свързаните карти/);
  const helpKeys = ["globalSearch-instructions-operator-creator", "globalSearch-instructions-operator-org", "globalSearch-instructions-operator-team", "globalSearch-instructions-operator-due", "globalSearch-instructions-operator-created", "globalSearch-instructions-operator-modified", "globalSearch-instructions-operator-status", "globalSearch-instructions-status-public", "globalSearch-instructions-status-private", "globalSearch-instructions-operator-has", "globalSearch-instructions-operator-sort", "globalSearch-instructions-operator-limit", "globalSearch-instructions-notes-2", "globalSearch-instructions-notes-3", "globalSearch-instructions-notes-3-2", "globalSearch-instructions-notes-4", "globalSearch-instructions-notes-5", "label-colors", "archived-at", "due-date", "server-error-troubleshooting", "created-at-newest-first", "created-at-oldest-first", "custom-field-stringtemplate-separator", "custom-field-stringtemplate-item-placeholder", "filesReportTitle", "reports", "rulesReportTitle", "boardsReportTitle", "cardsReportTitle", "display-card-creator", "wait-spinner", "Bounce", "Cube", "Cube-Grid", "Dot", "Double-Bounce", "Rotateplane", "Scaleout", "Wave"];
  for (const key of helpKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['globalSearch-instructions-notes-2'], /логическо \*ИЛИ\*.*поне едно/);
  assert.match(bg['globalSearch-instructions-notes-3'], /логическо \*И\*.*всички/);
  assert.match(bg['globalSearch-instructions-operator-has'], /`has:-due`.*без краен срок/);
  assert.match(bg['globalSearch-instructions-operator-sort'], /низходящо.*`-` пред/);
  assert.match(bg['globalSearch-instructions-notes-5'], /архивираните карти не се включват/);
  assert.match(bg['globalSearch-instructions-notes-4'], /не се прави разлика между малки и главни букви/);
  assert.match(bg['created-at-newest-first'], /най-новите/);
  assert.match(bg['created-at-oldest-first'], /най-старите/);
  for (const command of ['sudo snap logs wekan.wekan', 'sudo docker logs wekan-app']) {
    assert.ok(bg['server-error-troubleshooting'].includes('`' + command + '`'));
  }
  for (const entity of ['&#32;', '&nbsp;']) assert.ok(bg['custom-field-stringtemplate-separator'].includes(entity));
  const teamKeys = ["delete-org-warning-message", "delete-team-warning-message", "details", "carbon-copy", "ticket", "tickets", "ticket-number", "pending", "history", "help-request", "editCardSortOrderPopup-title", "cardDetailsPopup-title", "add-teams", "filter-card-title-label", "invite-people-success", "invite-people-error", "to-create-teams-contact-admin", "Node_heap_used_heap_size", "Node_heap_heap_size_limit", "Node_heap_malloced_memory", "Node_heap_peak_malloced_memory", "Node_heap_does_zap_garbage", "Node_heap_number_of_native_contexts", "Node_heap_number_of_detached_contexts", "Node_memory_usage_rss", "Node_memory_usage_heap_total", "Node_memory_usage_heap_used", "Node_memory_usage_external", "add-organizations", "add-organizations-label", "remove-organization-from-board", "to-create-organizations-contact-admin", "custom-legal-notice-link-url", "acceptance_of_our_legalNotice", "legalNotice"];
  for (const key of teamKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  for (const entity of ['org', 'team']) {
    assert.match(bg['delete-' + entity + '-warning-message'], /не може.*поне един потребител/);
  }
  assert.match(bg['invite-people-success'], /регистрация.*успешно/);
  assert.match(bg['invite-people-error'], /Грешка.*регистрация/);
  assert.match(bg['carbon-copy'], /Cc:/);
  assert.match(bg['Node_heap_malloced_memory'], /malloc/);
  assert.match(bg['Node_heap_peak_malloced_memory'], /пиков.*malloc/);
  assert.match(bg['Node_heap_does_zap_garbage'], /презаписване.*zap/);
  assert.match(bg['Node_memory_usage_rss'], /резидентната памет/);
  const attachmentKeys = ["checklistActionsPopup-title", "moveChecklist", "moveChecklistPopup-title", "newlineBecomesNewChecklistItem", "newLineNewItem", "newlineBecomesNewChecklistItemOriginOrder", "subtaskActionsPopup-title", "attachmentActionsPopup-title", "attachment-move-storage-fs", "attachment-move-storage-gridfs", "attachment-move-storage-s3", "attachment-move", "move-all-attachments-to-fs", "move-all-attachments-to-gridfs", "move-all-attachments-to-s3", "move-all-attachments-of-board-to-fs", "move-all-attachments-of-board-to-gridfs", "move-all-attachments-of-board-to-s3", "path", "version-name", "board-title", "password-again", "if-you-already-have-an-account", "forgot-password", "Mongo_sessions_count", "max-upload-filesize", "allowed-upload-filetypes", "max-avatar-filesize", "allowed-avatar-filetypes", "invalid-file", "preview-pdf-not-supported", "translation-number", "delete-translation-confirm-popup", "show-subtasks-field", "import-board-zip", "hideCheckedChecklistItems", "hideAllChecklistItems", "support-page-enabled", "support-info-not-added-yet", "support-info-only-for-logged-in-users", "support-content", "accessibility", "accessibility-page-enabled", "accessibility-info-not-added-yet", "accessibility-content"];
  for (const key of attachmentKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  for (const backend of ['gridfs', 's3']) {
    const name = backend === 'gridfs' ? 'GridFS' : 'S3';
    for (const prefix of ['attachment-move-storage-', 'move-all-attachments-to-', 'move-all-attachments-of-board-to-']) {
      assert.ok(bg[prefix + backend].includes(name));
    }
  }
  assert.match(bg['move-all-attachments-of-board-to-fs'], /всички.*на таблото/);
  assert.match(bg['max-upload-filesize'], /байтове/);
  assert.match(bg['max-avatar-filesize'], /аватара в байтове/);
  assert.match(bg['invalid-file'], /качването или преименуването се отменя/);
  assert.match(bg['import-board-zip'], /\.zip.*JSON.*подпапки.*прикачените файлове/);
  assert.match(bg['delete-translation-confirm-popup'], /необратимо/);
  assert.match(bg['support-info-only-for-logged-in-users'], /само за влезли потребители/);
  assert.match(bg['hideCheckedChecklistItems'], /отметнатите/);
  assert.match(bg['hideAllChecklistItems'], /всички/);
  assert.match(bg['newlineBecomesNewChecklistItemOriginOrder'], /първоначалния ред/);
  const lockoutKeys = ["accounts-lockout-info", "accounts-lockout-known-users", "accounts-lockout-unknown-users", "accounts-lockout-failures-before", "accounts-lockout-period", "accounts-lockout-failure-window", "accounts-lockout-settings-updated", "accounts-lockout-locked-users-info", "accounts-lockout-no-locked-users", "accounts-lockout-failed-attempts", "accounts-lockout-user-unlocked", "accounts-lockout-confirm-unlock", "accounts-lockout-user-locked", "accounts-lockout-click-to-unlock", "admin-people-filter-show", "admin-people-filter-inactive", "admin-people-user-active", "admin-people-user-inactive", "accounts-lockout-all-users-unlocked", "active-cron-jobs", "add-cron-job-placeholder", "attachment-storage-configuration", "attachments-path", "attachments-path-description", "avatars-path", "avatars-path-description", "board-archive-failed", "board-archive-scheduled", "board-backup-failed", "board-backup-scheduled", "board-cleanup-failed", "board-cleanup-scheduled", "board-operations", "cron-migrations", "cron-job-delete-failed"];
  for (const key of lockoutKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет|платн/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['accounts-lockout-known-users'], /правилно потребителско име, грешна парола/);
  assert.match(bg['accounts-lockout-unknown-users'], /несъществуващо потребителско име/);
  assert.match(bg['accounts-lockout-period'], /секунди/);
  assert.match(bg['accounts-lockout-failure-window'], /секунди/);
  assert.match(bg['admin-people-user-active'], /е активен.*деактивирате/);
  assert.match(bg['admin-people-user-inactive'], /е неактивен.*го активирате/);
  assert.match(bg['accounts-lockout-all-users-unlocked'], /Всички.*отблокирани/);
  for (const operation of ['archive', 'backup', 'cleanup']) {
    assert.match(bg['board-' + operation + '-failed'], /Неуспешно планиране/);
    assert.match(bg['board-' + operation + '-scheduled'], /планирано успешно/);
  }
  assert.notEqual(bg['board-backup-scheduled'], bg['board-archive-scheduled']);
  const migrationKeys = ["cron-job-deleted", "cron-job-pause-failed", "cron-job-paused", "cron-migration-warnings", "cron-error-details", "cron-errors-cleared", "cron-no-failed-migrations", "cron-no-paused-migrations", "cron-migrations-resumed", "complete", "idle", "filesystem-path-description", "gridfs-enabled-description", "migration-pause-failed", "migration-paused", "migration-start-failed", "migration-started", "migration-status", "migration-stop-confirm", "migration-stop-failed", "migration-stopped", "s3-access-key", "s3-access-key-description", "s3-access-key-placeholder", "s3-bucket-description", "s3-connection-failed", "s3-connection-success", "s3-enabled-description", "s3-port-description", "s3-secret-key", "s3-secret-key-description", "s3-secret-key-placeholder", "s3-secret-key-required", "s3-settings-save-failed", "s3-settings-saved", "s3-ssl-enabled", "save-s3-settings", "schedule-board-archive", "schedule-board-cleanup", "scheduled-board-operations"];
  for (const key of migrationKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
    if (key.startsWith('s3-') || key === 'save-s3-settings') assert.match(bg[key], /S3/);
  }
  assert.match(bg['migration-paused'], /на пауза/);
  assert.match(bg['migration-stopped'], /спрени/);
  assert.match(bg['migration-started'], /стартирани/);
  assert.match(bg['cron-migrations-resumed'], /възобновени/);
  assert.match(bg['migration-stop-confirm'], /всички миграции/);
  assert.match(bg['cron-no-failed-migrations'], /Няма неуспешни миграции/);
  assert.match(bg['cron-no-paused-migrations'], /Няма миграции на пауза/);
  assert.match(bg['s3-access-key'], /Ключ за достъп/);
  assert.match(bg['s3-secret-key'], /Таен ключ/);
  assert.match(bg['s3-enabled-description'], /AWS S3 или MinIO/);
  assert.match(bg['gridfs-enabled-description'], /MongoDB GridFS/);
  const recoveryKeys = ["writable-path", "writable-path-description", "add-job", "attachment-migration", "attachment-monitoring", "attachment-settings", "attachment-storage-settings", "automatic-migration", "board-migration", "board-migrations", "card-show-lists-on-minicard", "comprehensive-board-migration-description", "delete-duplicate-empty-lists-migration", "delete-duplicate-empty-lists-migration-description", "lost-cards", "lost-cards-list", "restore-lost-cards-migration", "restore-lost-cards-migration-description", "restore-all-archived-migration-description", "fix-missing-lists-migration", "fix-missing-lists-migration-description", "fix-avatar-urls-migration-description", "fix-all-file-urls-migration", "fix-all-file-urls-migration-description", "migration-needed", "migration-complete", "migration-running", "migration-successful", "migration-failed", "migrations-admin-only", "migrations-description", "no-issues-found", "run-comprehensive-migration-confirm", "run-delete-duplicate-empty-lists-migration-confirm", "run-restore-lost-cards-migration-confirm", "run-restore-all-archived-migration-confirm", "run-fix-missing-lists-migration-confirm", "run-fix-avatar-urls-migration-confirm", "run-fix-all-file-urls-migration-confirm", "restore-lost-cards-nothing-to-restore"];
  for (const key of recoveryKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
    for (const field of ['swimlaneId', 'listId']) {
      if (en[key].includes(field)) assert.ok(bg[key].includes(field), key + ':' + field);
    }
  }
  assert.match(bg['delete-duplicate-empty-lists-migration-description'], /нямат карти И.*същото заглавие, съдържащ карти/);
  assert.match(bg['run-delete-duplicate-empty-lists-migration-confirm'], /първо.*всеки коридор.*след което/);
  assert.match(bg['run-restore-lost-cards-migration-confirm'], /само неархивирани елементи/);
  assert.match(bg['run-restore-all-archived-migration-confirm'], /ВСИЧКИ архивирани коридори, списъци и карти/);
  assert.match(bg['run-restore-all-archived-migration-confirm'], /не може лесно да бъде отменено/);
  assert.match(bg['migrations-admin-only'], /Само администраторите на таблото/);
  assert.match(bg['restore-lost-cards-nothing-to-restore'], /коридори, списъци или карти/);
  const progressKeys = ["migration-progress-details", "migration-progress-note", "step-fix-orphaned-cards", "step-convert-shared-lists", "step-validate-migration", "step-fix-avatar-urls", "step-fix-attachment-urls", "step-create-missing-lists", "step-update-cards", "step-restore-lists", "step-restore-cards", "step-fix-missing-ids", "step-scan-files", "step-fix-file-urls", "cleanup-old-jobs", "conversion-info-text", "converting-board", "converting-board-description", "cpu-cores", "cpu-usage", "current-action", "database-migrations", "duration", "estimated-time-remaining", "every-1-day", "export-monitoring", "filesystem-attachments", "force-board-scan", "gridfs-attachments", "hide-list-on-minicard", "job-details", "last-run", "memory-usage", "migrated-attachments", "migration-batch-size-description", "migration-cpu-threshold", "migration-cpu-threshold-description", "migration-delay-ms-description", "migration-info-text", "migration-markers"];
  for (const key of progressKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['conversion-info-text'], /веднъж за всяко табло.*продължите да използвате/);
  assert.match(bg['migration-info-text'], /веднъж.*продължава във фонов режим.*затворите браузъра/);
  assert.match(bg['migration-batch-size-description'], /1-100/);
  assert.match(bg['migration-cpu-threshold-description'], /на пауза.*надвиши.*10-90/);
  assert.match(bg['migration-delay-ms-description'], /милисекунди.*100-10000/);
  const analyticsKeys = ["migration-resume-failed", "migration-resumed", "migration-warning-text", "next", "operation-type", "refresh-monitoring", "remaining-attachments", "run-once", "s3-attachments", "s3-size", "scanning-status", "search-boards-or-operations", "showChecklistAtMinicard", "showing", "start-test-operation", "step-progress", "total-attachments", "total-operations", "unmigrated-boards", "weight", "current-step", "flow-age-days", "flow-samples", "flow-episodes", "flow-history-days", "flow-details", "flow-note-agingWip", "flow-note-blockerAnalysis", "flow-note-monteCarlo", "time-adjustment-note"];
  for (const key of analyticsKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /[јћђљњџЈЋЂЉЊЋЏ]|поступ|списи|опорав|предмет/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['migration-warning-text'], /не затваряйте.*продължи във фонов режим.*повече време/);
  assert.match(bg['flow-note-agingWip'], /85-и персентил.*поне пет престоя.*неизвестна/);
  assert.match(bg['flow-note-blockerAnalysis'], /неизвестно начало.*изтрити карти.*отделно/);
  assert.match(bg['flow-note-monteCarlo'], /2 000.*UTC.*дни без завършени карти/);
  assert.match(bg['flow-note-monteCarlo'], /горната опашка.*долната опашка/);
  assert.match(bg['flow-note-monteCarlo'], /не е гаранция.*3 650.*няма прогноза/);
  assert.match(bg['time-adjustment-note'], /не са отделни работни сесии.*Отрицателните стойности са корекции/);
  assert.match(bg['time-adjustment-note'], /незаписано време не може да се отнесе/);
  for (const [key, value] of Object.entries(bg)) assert.doesNotMatch(value, /[јћђљњџЈЋЂЉЊЋЏ]/, key);
  const vocabularyKeys = ["act-editComment", "act-importCard", "act-importList", "act-moveCard", "act-removeBoardMember", "act-restoredCard", "act-unjoinMember", "allboards.add-workspace-prompt", "allboards.add-subworkspace-prompt", "allboards.edit-workspace-name", "board-change-background-image", "add-background-image", "show-at-all-boards-page", "show-board_members-avatar", "board_members", "card_members", "deleteDuplicateListsPopup-title", "close-card", "read-only-desc", "user-can-not-export-excel", "export-card", "export-card-pdf", "exportCardPopup-title", "sort-desc", "list-label-title", "filter-show-archive", "impersonate-user", "import-csv-placeholder", "settingsTeamPopup-title", "settingsOrgPopup-title", "copySelectionPopup-title", "multi-selection-label", "multi-selection-member", "paste-or-dragdrop", "remove-from-board", "remove-label", "search-cards", "shortcut-autocomplete-members", "shortcut-toggle-sidebar", "unsaved-description", "import-usernames", "delete-duplicate-lists", "minicard-settings", "boardMinicardSettingsPopup-title", "r-when-the-label", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "above-selected-card", "below-selected-card", "act-atUserComment", "editOrgPopup-title", "newOrgPopup-title", "editTeamPopup-title"];
  for (const key of vocabularyKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /предмет|спис[иа]|поступ|сарад|налеп|корис|назив|правни/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['read-only-desc'], /само да преглежда.*Не може да редактира/);
  assert.match(bg['search-cards'], /карти и списъци, описанията и персонализираните полета/);
  assert.match(bg['act-moveCard'], /от списък __oldList__.*към списък __list__/);
  assert.match(bg['shortcut-toggle-sidebar'], /Показване или скриване/);
  assert.match(bg['r-d-move-to-top-gen'], /началото на нейния списък/);
  assert.match(bg['r-d-move-to-bottom-gen'], /края на нейния списък/);
  assert.match(bg['above-selected-card'], /^Над/);
  assert.match(bg['below-selected-card'], /^Под/);
  assert.match(bg['import-csv-placeholder'], /CSV\/TSV/);
  const remainingVocabularyKeys = ["editUserPopup-title", "newUserPopup-title", "view-all", "my-cards", "my-attachments", "myCardsViewChange-title", "myCardsViewChangePopup-title", "dueCards-title", "globalSearch-title", "operator-user", "operator-org", "globalSearch-instructions-operator-board", "globalSearch-instructions-status-archived", "globalSearch-instructions-status-ended", "label-names", "sort-cards", "sort-is-on", "cardsSortPopup-title", "maximize-card", "minimize-card", "remove-team-from-table", "copyChecklist", "copyChecklistPopup-title", "copyChecklistFromTemplate", "copyChecklistFromTemplatePopup-title", "card-show-lists", "minicardDetailsActionsPopup-title", "accounts-lockout-show-locked-users", "admin-people-filter-all", "cron-migration-errors", "anonymized-user", "gridfs-enabled", "select-migration", "s3-enabled", "s3-ssl-enabled-description", "stop-all-migrations", "restore-all-archived-migration", "fix-avatar-urls-migration", "step-analyze-board-structure", "step-analyze-lists", "step-delete-duplicate-empty-lists", "step-scan-users", "show-list-on-minicard"];
  for (const key of remainingVocabularyKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /предмет|спис[иа]|поступ|сарад|налеп|корис|назив|правни/i, key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.equal(bg['dueCards-title'], 'Карти с краен срок');
  assert.match(bg['globalSearch-instructions-status-ended'], /с дата на приключване/);
  assert.match(bg['accounts-lockout-show-locked-users'], /само на блокираните/);
  assert.match(bg['stop-all-migrations'], /всички миграции/);
  assert.match(bg['restore-all-archived-migration'], /всичко архивирано/);
  assert.match(bg['copyChecklistFromTemplate'], /от шаблон/);
  assert.match(bg['s3-ssl-enabled-description'], /SSL\/TLS.*S3/);
  assert.notEqual(bg['maximize-card'], bg['minimize-card']);
  const filterFillKeys = ["auto-archive-days", "auto-archive-off", "auto-archive-hint", "filter-recency-any", "filter-recency-day", "filter-recency-week", "filter-recency-month", "filter-recency-older", "filter-movement-range", "filter-date-range-field", "filter-date-range-from", "filter-date-range-to", "filter-date-range-missing", "filter-date-range-list-entry", "filter-date-range-invalid", "filter-due-any", "filter-due-previous-week", "filter-due-next-month", "filter-column-age", "filter-column-age-disabled", "filter-column-age-days", "filter-column-age-hint", "advanced-filter-card-dates-hint", "instance", "instance-desc", "board-instance-info", "automatic-linked-url-schemes-hint", "r-when-card-date", "r-trigger-vars-hint", "r-vars-people-hint", "r-rule-any-trigger-help", "r-add-trigger-to-rule", "r-add-action-to-rule", "r-remove-rule-part", "notification-activity-heading", "notification-activity-description", "notification-activity-labels", "notification-activity-members", "notification-activity-assignees", "notification-activity-comments", "notification-activity-moves", "notification-activity-dates", "notification-activity-checklists", "notification-activity-attachments", "notification-activity-customFields"];
  for (const key of filterFillKeys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  for (const key of ['r-trigger-vars-hint', 'r-vars-people-hint']) {
    assert.deepEqual(bg[key].match(/\{[^}]+\}/g), en[key].match(/\{[^}]+\}/g), key);
  }
  assert.match(bg['filter-date-range-from'], /включително/);
  assert.match(bg['filter-date-range-to'], /включително/);
  assert.match(bg['filter-column-age-hint'], /неизвестна дата.*остават видими.*не нулира/);
  assert.match(bg['auto-archive-hint'], /всеки час.*шаблоните никога.*празно/);
  assert.match(bg['instance-desc'], /не са влезли.*Само хората, добавени към таблото.*редактират/);
  assert.match(bg['board-instance-info'], /<strong>.*<\/strong>/);
  assert.match(bg['r-rule-any-trigger-help'], /което и да е.*по ред/);
  assert.match(bg['notification-activity-description'], /краен срок и @mentions винаги/);
  const dateHelp = bg['advanced-filter-card-dates-hint'];
  for (const token of ['@createdAt', '@receivedAt', '@startAt', '@dueAt', '@endAt', '@listEnteredAt', "@endAt >= '2026-01-01'", '@endAt = none']) assert.ok(dateHelp.includes(token));
  for (const scheme of ['thunderlink', 'onenote', 'javascript', 'data', 'vbscript']) assert.ok(bg['automatic-linked-url-schemes-hint'].includes(scheme));
  const workspaceKeys = ["allboards.workspaces", "allboards.add-workspace", "allboards.edit-workspace-icon", "addWorkspacePopup-title", "app-try-reconnect", "template-container", "board-background-image-url", "remove-background-image"];
  for (const key of workspaceKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /радни|простор|Слика|Прошири|Покушавам|Сандук|Веза|Уклони/);
  }
  assert.match(bg['allboards.edit-workspace-icon'], /Markdown/);
  assert.match(bg['app-try-reconnect'], /свържете отново/);
  assert.equal(bg['allboards.add-workspace'], bg['addWorkspacePopup-title']);
  const planningFillKeys = ["notification-activity-archive", "notification-activity-created", "due-reminder-heading", "due-reminder-days-label", "due-reminder-off", "due-reminder-webhook", "due-reminder-invalid", "due-reminder-saved", "dependency-type-duplicates", "dependency-type-is-duplicated-by", "custom-field-stringtemplate-context-hint", "filter-presets", "filter-preset-choose", "filter-preset-name", "filter-preset-save", "filter-preset-replace-hint", "filter-preset-saved", "filter-preset-applied", "filter-preset-deleted", "filter-preset-error", "filter-card-text-label", "import-report-heading", "import-report-description", "import-report-open-board", "draggable", "blockly-CONTEXT_MENU_KEY", "blockly-SPACE_KEY", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox"];
  for (const key of planningFillKeys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['due-reminder-days-label'], /0.*положителните.*преди.*отрицателните.*след.*празно/);
  assert.match(bg['due-reminder-invalid'], /до десет.*-14 до 14/);
  assert.match(bg['filter-preset-replace-hint'], /Лични за вас.*същото име ги заменя/);
  assert.match(bg['import-report-description'], /Таблото е създадено, но.*Административен панел → Проблеми → Възстановяване/);
  assert.deepEqual(bg['custom-field-stringtemplate-context-hint'].match(/%\{[^}]+\}/g), en['custom-field-stringtemplate-context-hint'].match(/%\{[^}]+\}/g));
  assert.notEqual(bg['dependency-type-duplicates'], bg['dependency-type-is-duplicated-by']);
  assert.notEqual(bg['scrum-close-sprint'], bg['scrum-cancel-sprint']);
  assert.match(bg['scrum-policy-dueComplete'], /отбелязана като завършена/);
  assert.match(bg['scrum-policy-doneLists'], /списък от категория/);
  assert.match(bg['scrum-backlog-help'], /планиран или активен спринт/);
  assert.match(bg['scrum-timebox'], /минути/);
  const reportFillKeys = ["scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending", "sync-conflict-heading", "sync-conflict-hint", "sync-conflict-local", "sync-conflict-keep-local", "sync-conflict-use-source", "sync-conflict-refresh", "sync-conflict-review-complete", "sync-conflict-duplicate", "sync-conflict-keep-mapping", "sync-conflict-detach", "sync-conflict-detach-hint", "sync-conflict-archive", "sync-conflict-archive-hint", "sync-conflict-keep-card-local"];
  for (const key of reportFillKeys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['scrum-report-help'], /не са нулеви оценки.*еднакви мерни единици/);
  assert.match(bg['scrum-confirm-close'], /Незавършените карти ще се преместят/);
  assert.match(bg['scrum-confirm-cancel'], /остават в него.*преназначени/);
  assert.match(bg['scrum-partial-report'], /само картите.*възложени на вас/);
  assert.match(bg['scrum-daily-observations-help'], /първото записано.*UTC.*Липсващите дни се пропускат/);
  assert.match(bg['scrum-daily-observations-help'], /не записват всяка промяна.*не са нула/);
  assert.match(bg['scrum-daily-truncated'], /366/);
  assert.match(bg['scrum-import-pending'], /не са достъпни/);
  assert.match(bg['sync-conflict-hint'], /Нищо не се изпраща към изходната система/);
  assert.match(bg['sync-conflict-review-complete'], /Не е извършена синхронизация на целия списък/);
  assert.match(bg['sync-conflict-detach-hint'], /Съдържанието му остава в WeKan/);
  assert.match(bg['sync-conflict-archive-hint'], /Подкартите не се променят/);
  const syncFillKeys = ["sync-conflict-creation", "sync-conflict-creation-hint", "sync-conflict-create-replacement", "sync-preview-button", "sync-preview-heading", "sync-preview-saved", "sync-preview-unavailable", "sync-preview-blocked", "sync-preview-create", "sync-preview-update", "sync-preview-archive", "sync-preview-baseline", "sync-preview-truncated", "sync-preview-omissions", "sync-preview-scope", "sync-preview-excluded", "sync-preview-unmapped", "sync-preview-parser-warnings", "sync-preview-parser-unsupported", "sync-source-heading", "sync-source-scope", "sync-source-unmapped", "sync-source-excluded", "sync-source-converted", "sync-source-fallback", "sync-source-excluded-item", "sync-source-occurrences", "sync-source-truncated", "sync-source-omitted", "sync-report-button", "sync-report-retention", "sync-report-partial", "sync-report-unfinished", "sync-report-failed", "sync-report-completed", "sync-report-completed-with-warnings", "sync-report-skipped", "sync-report-review-only", "sync-report-unavailable", "sync-report-empty", "sync-recovery-heading", "sync-recovery-description", "sync-recovery-unavailable", "sync-recovery-all", "sync-estimate-field"];
  for (const key of syncFillKeys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['sync-conflict-creation-hint'], /предишната карта непроменена.*същата заместваща карта/);
  assert.match(bg['sync-preview-saved'], /извлича и проверява източника отново/);
  assert.match(bg['sync-preview-truncated'], /първите 100/);
  assert.match(bg['sync-source-truncated'], /100 пътя.*съкратени/);
  assert.match(bg['sync-source-scope'], /стойностите им не се показват/);
  assert.match(bg['sync-report-retention'], /20.*30 дни/);
  assert.match(bg['sync-report-partial'], /може да са променили.*не възобновяват и не отменят/);
  assert.match(bg['sync-report-unavailable'], /право на запис за целия списък/);
  assert.match(bg['sync-recovery-description'], /още да работи или да е прекъснато.*Обновете/);
  assert.match(bg['sync-recovery-unavailable'], /администраторския достъп/);
  const emailFillKeys = ["sync-estimate-field-hint", "email-recovery-heading", "email-recovery-description", "email-recovery-saving", "email-recovery-queued", "email-recovery-retrying", "email-recovery-attempts", "email-recovery-oldest", "email-recovery-next", "email-recovery-changed", "email-recovery-pause", "email-recovery-resume", "email-recovery-cancel", "email-recovery-paused", "email-recovery-pending", "email-recovery-empty", "email-recovery-unavailable", "email-recovery-busy", "email-recovery-failed", "email-recovery-superseded", "email-recovery-confirm-cancel", "email-recovery-attention", "email-recovery-stopped", "email-recovery-retry", "email-failure-smtp-temporary", "email-failure-smtp-rejected", "email-failure-smtp-authentication", "email-failure-smtp-configuration", "email-failure-recipient-unavailable", "email-failure-delivery-unconfirmed", "email-failure-acknowledgement-failed", "email-failure-delivery-failed", "email-failure-retry-limit", "sync-original-time", "sync-remaining-time"];
  for (const key of emailFillKeys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['sync-estimate-field-hint'], /Липсващите стойности.*игнорират.*null изчиства/);
  assert.match(bg['email-recovery-description'], /имейл адресите.*не се показват/);
  assert.match(bg['email-recovery-description'], /съществуващите и бъдещите съобщения/);
  assert.match(bg['email-recovery-description'], /не може да бъде оттеглено.*изпратено повторно/);
  assert.match(bg['email-recovery-description'], /нов цикъл от опити и спазва съществуващата пауза/);
  assert.match(bg['email-recovery-confirm-cancel'], /не може да бъде възстановено.*след тази заявка, се запазват/);
  assert.match(bg['email-recovery-failed'], /повторете същото действие/);
  assert.match(bg['email-failure-smtp-temporary'], /Временен/);
  assert.match(bg['email-failure-smtp-rejected'], /Постоянен/);
  assert.match(bg['email-failure-delivery-unconfirmed'], /прегледайте преди повторен опит/);
  assert.match(bg['sync-original-time'], /часове/);
  assert.match(bg['sync-remaining-time'], /часове/);
  const recoveryFillKeys = ["sync-time-estimate-hint", "activity-recovery-heading", "activity-recovery-description", "activity-recovery-empty", "activity-recovery-unavailable", "activity-recovery-retry", "activity-recovery-retrying", "activity-recovery-status-pending", "activity-recovery-status-preparing", "activity-recovery-status-processing", "activity-recovery-status-missing", "activity-recovery-status-changed", "activity-recovery-status-invalid", "activity-recovery-status-inconsistent", "activity-recovery-busy", "activity-recovery-denied", "activity-recovery-source-unavailable", "activity-recovery-disabled", "activity-recovery-failed", "activity-recovery-pause", "activity-recovery-resume", "activity-recovery-paused", "activity-recovery-control-conflict", "activity-recovery-control-failed", "activity-recovery-status-cancelled", "activity-recovery-cancel", "activity-recovery-cancel-confirm", "rule-email-recovery-heading", "rule-email-recovery-description", "rule-email-recovery-all", "rule-email-recovery-unconfirmed", "rule-email-recovery-sent", "rule-email-recovery-invalid", "rule-email-recovery-identifiers", "rule-email-recovery-started", "rule-email-recovery-finished", "rule-email-recovery-empty", "rule-email-recovery-unavailable", "saml-login-not-started", "move-selection-before", "move-selection-after"];
  for (const key of recoveryFillKeys) {
    assert.ok(bg[key]?.trim(), key);
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.match(bg[key], /[А-Яа-я]/, key);
  }
  assert.match(bg['sync-time-estimate-hint'], /точно едно.*игнорират.*null изчиства/);
  assert.match(bg['activity-recovery-description'], /никога не създава дейността отново/);
  assert.match(bg['activity-recovery-denied'], /вече не позволяват доставка/);
  assert.match(bg['activity-recovery-failed'], /Чакащата работа е запазена/);
  assert.match(bg['activity-recovery-cancel-confirm'], /не може да бъде възобновена.*не се оттеглят/);
  assert.match(bg['rule-email-recovery-description'], /още да изпращат или да са прекъснати.*не повтаря и не отменя/);
  assert.match(bg['rule-email-recovery-sent'], /Прието от пощенския сървър/);
  assert.match(bg['saml-login-not-started'], /SAML.*този раздел.*влезте отново/);
  assert.equal(bg['move-selection-before'], 'Преди');
  assert.equal(bg['move-selection-after'], 'След');
  const uiAuditKeys = ["allBoardsChangeBackgroundImagePopup-title", "board-view-table", "calendar-previous-month-label", "calendar-next-month-label", "due-today", "editVoteEndDatePopup-title", "poker-question", "poker-result-votes", "poker-result-who", "poker-replay", "set-estimation", "cardTemplatePopup-title", "delete-avatar-confirm", "click-to-star", "color-crimson", "color-slateblue", "comments", "no-comments-desc", "read-only", "date-format-yyyy-mm-dd", "date-format-dd-mm-yyyy", "date-format-mm-dd-yyyy", "email-address", "email-verifyEmail-subject", "filter-due-tomorrow", "advanced-filter-label", "show-activities"];
  for (const key of uiAuditKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /Осликани|Приказани|Претходни|Наредни|Где|Играмо|Гласови|Понови|прогнозу|образац|слику|звездицом|тамно|загасито|Расправа|Читалац|поште|Потврдите|сутрадан|филтер|записник/i, key);
  }
  assert.match(bg['calendar-previous-month-label'], /Предишен/);
  assert.match(bg['calendar-next-month-label'], /Следващ/);
  assert.match(bg['due-today'], /днес/);
  assert.match(bg['filter-due-tomorrow'], /утре/);
  assert.equal(bg['date-format-yyyy-mm-dd'], 'година-месец-ден');
  assert.equal(bg['date-format-dd-mm-yyyy'], 'ден-месец-година');
  assert.equal(bg['date-format-mm-dd-yyyy'], 'месец-ден-година');
  assert.match(bg['no-comments-desc'], /Не може да вижда/);
  assert.match(bg['email-verifyEmail-subject'], /__siteName__/);
  const shortcutAuditKeys = ["listImportCardsTsvPopup-title", "remove-cover", "shortcut-add-self", "shortcut-autocomplete-emoji", "shortcut-toggle-searchbar", "what-to-do", "modifiedAt", "delete-all-notifications", "description-on-minicard"];
  for (const key of shortcutAuditKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /Унеси|Уклони|слику|омота|Доделите|надлежност|себи|попуни|Алат|претрагу|Шта|желите|урадите|измене|Избриши|сва|Пун/i, key);
  }
  assert.match(bg['remove-cover'], /изображението.*миникартата/);
  assert.match(bg['shortcut-add-self'], /себе си.*текущата карта/);
  assert.match(bg['shortcut-toggle-searchbar'], /Показване или скриване.*страничната лента.*търсене/);
  assert.match(bg['delete-all-notifications'], /всички известия/);
  assert.match(bg['description-on-minicard'], /Описание.*миникартата/);
  const ruleSearchAuditKeys = ["r-items-check","r-of-checklist","r-of","r-in-list","r-d-check-of-list","r-set","oidc-button-text","mark-all-as-read","mark-all-as-unread","remove-all-read","myCardsViewChange-choice-table","dueCardsViewChange-title","dueCardsViewChangePopup-title","dueCardsViewChange-choice-all","operator-creator","operator-description","operator-attachment-text","predicate-ended","predicate-all","predicate-overdue","predicate-quarter","predicate-modified","predicate-attachment","predicate-description","predicate-assignee","previous-page","heading-notes","globalSearch-instructions-status-all","globalSearch-instructions-notes-1","link-to-search","excel-font","server-error","title-alphabetically","links-heading","custom-field-stringtemplate","creator","creator-on-minicard","cancelled","request","requests","add-teams-label","confirm-btn","Node_heap_total_heap_size","Node_heap_total_heap_size_executable","Node_heap_total_physical_size","Node_heap_total_available_size","copied"];
  for (const key of ruleSearchAuditKeys) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /са списка|обавити|Унеси|дугмету|Означи|сва|прочитана|Избриши|Приказани|Надлежност|увида|завео|описао|приложио|окончан|све|истекао|тромесечно|изменио|овластио|Претходна|Додатак|задаци|истовремено|задати|Повежи|претраге|словни|серверу|наслову|абучним|Везе|Оснивач|Поништено|Захтев|Додати|Потврди|укупни|извршни|физички|доступни|Умножено/i, key);
  }
  assert.match(bg['mark-all-as-read'], /като прочетени/);
  assert.match(bg['mark-all-as-unread'], /като непрочетени/);
  assert.match(bg['globalSearch-instructions-status-all'], /всички архивирани и неархивирани карти/);
  assert.match(bg['dueCardsViewChange-choice-all'], /Всички потребители/);
  assert.equal(bg['excel-font'], 'Arial'); // Used as the actual Excel font name.
  for (const key of ['operator-creator', 'operator-description', 'operator-attachment-text', 'predicate-ended', 'predicate-all', 'predicate-overdue', 'predicate-quarter', 'predicate-modified', 'predicate-attachment', 'predicate-description', 'predicate-assignee']) {
    assert.doesNotMatch(bg[key], /\s/, key);
  }
  assert.match(bg.Node_heap_total_heap_size_executable, /изпълним код/);
  assert.match(bg.Node_heap_total_physical_size, /физически/);
  assert.match(bg.Node_heap_total_available_size, /наличен/);
  const storageAdminAuditKeys = ["originOrder","move-progress-pause","board-id","s3-file-id","storage","uploading","remaining_time","speed","progress","register","drag-board","newTranslationPopup-title","editTranslationPopup-title","settingsTranslationPopup-title","convert-to-markdown","uncollapse","support","supportPopup-title","support-title","accessibility-title","accounts-lockout-settings","accounts-lockout-locked-users","accounts-lockout-remaining-time","accounts-lockout-confirm-unlock-all","admin-people-filter-locked","admin-people-active-status","accounts-lockout-unlock-all","add-cron-job","cron-jobs","cron-job-delete-confirm","cron-no-errors","cron-error-severity","cron-error-message","cron-clear-errors","cron-retry-failed","cron-resume-paused","cron-migrations-retried","sandstorm-storage-item"];
  for (const key of storageAdminAuditKeys) {
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /изворни|редослед|Предах|Складиште|Подижем|Преостало|Брзина|Напредак|Упиши|Пребаци|списе|исправка|Исправи|Обриши|исправку|Претвори|структуирани|Рашири|Подршка|Наслов|такве|Заштитне|насилног|упада|Налози|мерама|сигурни|желите|скинете|налоге|приступа|Радни|однос|Скини|Закажи|посао|Заказани|послови|уклоните|Нису|догодиле|никакве|грешке|Учесталост|Порука|грешци|Избриши|наведене|Понови|обнове|Настави|обнову|након|Неуспеле|управо|покренуте/i, key);
  }
  assert.match(bg['accounts-lockout-confirm-unlock-all'], /отблокирате всички блокирани потребители/);
  assert.match(bg['admin-people-filter-locked'], /Само блокирани/);
  assert.match(bg['cron-job-delete-confirm'], /изтриете тази планирана задача/);
  assert.match(bg['cron-retry-failed'], /Повторен опит.*неуспешните миграции/);
  assert.match(bg['cron-resume-paused'], /Възобновяване.*миграциите на пауза/);
  assert.match(bg['cron-migrations-retried'], /стартирани повторно успешно/);
  assert.match(bg['s3-file-id'], /S3/);
  assert.match(bg['convert-to-markdown'], /Markdown/);
  assert.match(bg['remaining_time'], /Оставащо време/);
  assert.equal(bg.storage, bg['sandstorm-storage-item']);
  const monitoringAuditKeys = ["all-migrations","pause","stop","migration-progress","mongodb-gridfs-storage","pause-all-migrations","s3-bucket","s3-endpoint","s3-endpoint-description","s3-minio-storage","s3-port","s3-region","s3-region-description","schedule-board-backup","start-all-migrations","test-s3-connection","back-to-settings","comprehensive-board-migration","migrations","run-migration","migration-progress-overall","steps","step-finalize","days-old","errors","every-1-hour","every-1-minute","every-10-minutes","every-30-minutes","every-5-minutes","every-6-hours","filesystem-size","filesystem-storage","idle-migration","job-description","job-name","job-queue","migrate-all-to-filesystem","migrate-all-to-gridfs","migrate-all-to-s3","migration-batch-size","migration-delay-ms","migration-log","migration-steps","monitoring-export-failed","monitoring-refresh-failed","next-run","of","overall-progress","pause-migration","previous","resume-migration","schedule","start-time","stop-migration","storage-distribution","system-resources","total-size"];
  for (const key of monitoringAuditKeys) {
    assert.notEqual(bg[key], en[key], key);
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /Све|обнове|Предах|Заустави|Напредак|складиште|тачка|нпр|Закажи|израду|резервног|примерка|Пуна|везе|Натраг|поставку|Свеобухватна|Радионица|Покрени|опоравак|Укупни|кораци|Завршавам|дана стар|Грешке|сваки|сваких|сати|локалног|складишта|обнова|посла|Посао|Пресели|издели|захвата|Задршка|Записник|обнови|Не могу|податаке|податке|Наредни|покрет|Измерени|Претходна|Настави|Распоред|штоперицу|Расподела|Системска|снага|Укупна/i, key);
  }
  for (const [key, count] of [['every-1-hour', 1], ['every-1-minute', 1], ['every-10-minutes', 10], ['every-30-minutes', 30], ['every-5-minutes', 5], ['every-6-hours', 6]]) {
    assert.ok(bg[key].includes(String(count)), key);
  }
  assert.match(bg['pause-all-migrations'], /всички миграции на пауза/);
  assert.match(bg['start-all-migrations'], /Стартиране на всички миграции/);
  assert.match(bg['resume-migration'], /Възобновяване/);
  assert.match(bg['stop-migration'], /Спиране/);
  assert.match(bg['s3-endpoint-description'], /s3\.amazonaws\.com.*minio\.example\.com/);
  assert.match(bg['s3-region-description'], /us-east-1/);
  assert.match(bg['migration-delay-ms'], /\(ms\)/);
  assert.match(bg['start-time'], /Начален час/);
  for (const key of ['cron', 'confirm', 'flow-note-sizeCycleTime']) {
    assert.deepEqual(translationTokens(bg[key]), translationTokens(en[key]), key);
    assert.doesNotMatch(bg[key], /послови|Потврди|Играмо карте/i, key);
  }
  assert.match(bg['flow-note-sizeCycleTime'], /покер за планиране.*числово персонализирано поле/);
  assert.match(bg['flow-note-sizeCycleTime'], /Липсващите оценки и невалидните дати се пропускат/);
  assert.match(bg['flow-note-sizeCycleTime'], /липсващо начало.*създаване.*липсващ край.*архивиране/);
  assert.equal(bg.swimlane, 'Коридор');
  assert.equal(bg['welcome-swimlane'], 'Етап 1');
  assert.match(bg['swimlane-height-error-message'], /положително цяло число/);
  assert.match(bg['swimlane-delete-pop'], /няма да можете да възстановите.*необратимо/);
  assert.match(bg['globalSearch-instructions-operator-swimlane'], /карти в коридори/);
  assert.notEqual(bg['move-swimlane'], bg['copy-swimlane']);
  console.log('Bulgarian corrections preserve tokens, meanings and native vocabulary');
})().catch(error => { console.error(error); process.exitCode = 1; });
