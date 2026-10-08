'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["r-rule", "r-add-trigger", "r-add-action", "r-board-rules", "r-add-rule", "r-view-rule", "r-delete-rule", "r-new-rule-name", "r-no-rules", "r-import-export", "r-select-all", "r-unselect-all", "r-delete-selected", "r-export-selected", "r-edit-rule", "r-edit-rule-trigger-action", "r-rule-enabled", "r-toggle-rule-enabled", "r-workflow-view", "r-list-view", "r-when", "r-workflow-help", "r-drop-trigger", "r-drop-action", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-assignee-added", "r-w-assignee-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-w-set-received-now", "r-export-json", "r-export-csv", "r-import-json", "r-import-csv", "r-import-trello", "r-import-paste", "r-import-done", "r-import-trello-note", "r-import-target"];
test('Tatar rule corrections preserve source keys and all placeholders',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(locale[key],/\u041a\u0443\u0440\u0430\u043b|\u0422\u0435\u0442\u0438\u043a\u043b\u0435\u0439|\u0433\u04e9\u0441\u0442\u0435\u0440|\u0441\u0435\u0447\u0438\u043c/i,key);
 }
});
test('Tatar rule vocabulary distinguishes actions, events and import directions',()=>{
 assert.match(locale['r-rule'],/^\u041a\u0430\u0433\u044b\u0439\u0434\u04d9$/);
 for(const entity of ['label','member','assignee']) assert.notEqual(locale['r-w-'+entity+'-added'],locale['r-w-'+entity+'-removed']);
 assert.notEqual(locale['r-w-card-archived'],locale['r-w-card-unarchived']);
 assert.notEqual(locale['r-select-all'],locale['r-unselect-all']);
 for(const format of ['json','csv']) {
  assert.ok(locale['r-import-'+format].includes(format.toUpperCase()));
  assert.notEqual(locale['r-import-'+format],locale['r-export-'+format]);
 }
 assert.match(locale['r-import-trello-note'],/\u043a\u0435\u0440\u0442\u0435\u043b\u043c\u0438/);
 assert.match(locale['r-rule-title-required'],/^\u041a\u0430\u0433\u044b\u0439\u0434\u04d9/);
});
