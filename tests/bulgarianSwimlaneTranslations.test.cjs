'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = code => JSON.parse(fs.readFileSync(path.join(__dirname, '../imports/i18n/data/' + code + '.i18n.json'), 'utf8'));
(async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = read('en'), bg = read('bg');
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
  assert.equal(bg.swimlane, 'Коридор');
  assert.equal(bg['welcome-swimlane'], 'Етап 1');
  assert.match(bg['swimlane-height-error-message'], /положително цяло число/);
  assert.match(bg['swimlane-delete-pop'], /няма да можете да възстановите.*необратимо/);
  assert.match(bg['globalSearch-instructions-operator-swimlane'], /карти в коридори/);
  assert.notEqual(bg['move-swimlane'], bg['copy-swimlane']);
  console.log('Bulgarian corrections preserve tokens, meanings and native vocabulary');
})().catch(error => { console.error(error); process.exitCode = 1; });
