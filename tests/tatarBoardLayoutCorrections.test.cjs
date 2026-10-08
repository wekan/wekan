'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["no-boards-selected", "select-only-one-board", "selected-label", "set-selected-starred", "set-selected-unstarred", "set-selected-home", "unset-selected-home", "home-board-badge", "home-board-empty", "home-board-remove", "home-board-remove-confirm", "activity-dueDate", "activity-endDate", "add-card-to-top-of-list", "add-card-to-bottom-of-list", "setListWidthPopup-title", "set-list-width", "set-list-width-value", "list-width-shared-note", "list-width-personal-note", "personal-list-width", "personal-list-width-description", "fixed-list-width", "click-to-enable-fixed-list-width", "click-to-disable-fixed-list-width", "fixed-list-width-note", "keyboard-shortcuts-enabled", "keyboard-shortcuts-disabled", "setSwimlaneHeightPopup-title", "set-swimlane-height", "set-swimlane-height-value", "swimlane-height-error-message", "add-subtask", "add-existing-card-as-subtask-empty", "add-checklist", "close-add-checklist-item", "close-edit-checklist-item", "convertChecklistItemToCardPopup-title", "add-cover", "add-after-list", "added", "admin", "admin-desc", "admin-announcement", "admin-announcement-active", "admin-announcement-title", "all-boards-hide", "public-boards", "and-n-other-card", "and-n-other-card_plural", "apply", "app-is-offline", "app-try-reconnect", "archive-board-confirm", "archive-list", "archive-swimlane"];
test('Tatar board layout corrections preserve keys and placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(locale[key],/\u0433\u0435\u043d\u0438\u0448\u043b\u0438\u043a|\u0441\u0435\u0447\u0438\u043b|\u0441\u0440\u04e9\u0445\u0441\u04d9\u0442/i,key);
 }
});
test('Tatar layout controls preserve personal scope, switch polarity and dimensions',()=>{
 assert.equal(locale['setListWidthPopup-title'],locale['set-list-width']);
 assert.equal(locale['setSwimlaneHeightPopup-title'],locale['set-swimlane-height']);
 assert.match(locale['set-list-width-value'],/\u043a\u0438\u04a3\u043b\u0435\u0433\u0435/);
 assert.match(locale['set-swimlane-height-value'],/\u0431\u0438\u0435\u043a\u043b\u0435\u0433\u0435/);
 for(const key of ['list-width-personal-note','fixed-list-width-note']) assert.match(locale[key],/\u0441\u0435\u0437\u043d\u0435\u04a3 \u04e9\u0447\u0435\u043d \u0433\u0435\u043d\u04d9/);
 assert.match(locale['home-board-remove-confirm'],/\u0431\u0435\u0442\u0435\u0440\u0435\u043b\u043c\u0438/);
 assert.notEqual(locale['keyboard-shortcuts-enabled'],locale['keyboard-shortcuts-disabled']);
 assert.notEqual(locale['click-to-enable-fixed-list-width'],locale['click-to-disable-fixed-list-width']);
 for(const kind of ['dueDate','endDate']) assert.match(locale['activity-'+kind],/^%s \u0438\u0442\u0435\u043f %s/);
});


test('Tatar common controls preserve empty results, form actions and loading warning',()=>{
 assert.match(locale['add-existing-card-as-subtask-empty'],/\u0442\u0430\u0431\u044b\u043b\u043c\u0430\u0434\u044b/);
 assert.notEqual(locale['close-add-checklist-item'],locale['close-edit-checklist-item']);
 assert.equal(locale['add-checklist'],locale['r-add-checklist']);
 assert.equal(locale['and-n-other-card'],locale['and-n-other-card_plural']);
 assert.match(locale['app-is-offline'],/\u043c\u04d9\u0433\u044a\u043b\u04af\u043c\u0430\u0442 \u044e\u0433\u0430\u043b\u0443\u0433\u0430/);
 assert.match(locale['app-is-offline'],/\u0442\u0443\u043a\u0442\u0430\u043c\u0430\u0433\u0430\u043d\u044b\u043d/);
 assert.notEqual(locale['archive-list'],locale['archive-swimlane']);
 assert.match(locale['admin'],/^\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440$/);
});
