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
  assert.equal(bg.swimlane, 'Коридор');
  assert.equal(bg['welcome-swimlane'], 'Етап 1');
  assert.match(bg['swimlane-height-error-message'], /положително цяло число/);
  assert.match(bg['swimlane-delete-pop'], /няма да можете да възстановите.*необратимо/);
  assert.match(bg['globalSearch-instructions-operator-swimlane'], /карти в коридори/);
  assert.notEqual(bg['move-swimlane'], bg['copy-swimlane']);
  console.log('Bulgarian swimlane corrections preserve tokens and replace Serbian vocabulary');
})().catch(error => { console.error(error); process.exitCode = 1; });
