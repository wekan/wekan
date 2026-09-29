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
  assert.equal(bg.swimlane, 'Коридор');
  assert.equal(bg['welcome-swimlane'], 'Етап 1');
  assert.match(bg['swimlane-height-error-message'], /положително цяло число/);
  assert.match(bg['swimlane-delete-pop'], /няма да можете да възстановите.*необратимо/);
  assert.match(bg['globalSearch-instructions-operator-swimlane'], /карти в коридори/);
  assert.notEqual(bg['move-swimlane'], bg['copy-swimlane']);
  console.log('Bulgarian swimlane corrections preserve tokens and replace Serbian vocabulary');
})().catch(error => { console.error(error); process.exitCode = 1; });
