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
  assert.equal(bg.swimlane, 'Коридор');
  assert.equal(bg['welcome-swimlane'], 'Етап 1');
  assert.match(bg['swimlane-height-error-message'], /положително цяло число/);
  assert.match(bg['swimlane-delete-pop'], /няма да можете да възстановите.*необратимо/);
  assert.match(bg['globalSearch-instructions-operator-swimlane'], /карти в коридори/);
  assert.notEqual(bg['move-swimlane'], bg['copy-swimlane']);
  console.log('Bulgarian corrections preserve tokens, meanings and native vocabulary');
})().catch(error => { console.error(error); process.exitCode = 1; });
