'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["r-rule", "r-add-trigger", "r-add-action", "r-board-rules", "r-add-rule", "r-view-rule", "r-delete-rule", "r-new-rule-name", "r-no-rules", "r-import-export", "r-select-all", "r-unselect-all", "r-delete-selected", "r-export-selected", "r-edit-rule", "r-edit-rule-trigger-action", "r-rule-enabled", "r-toggle-rule-enabled", "r-workflow-view", "r-list-view", "r-when", "r-workflow-help", "r-drop-trigger", "r-drop-action", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-assignee-added", "r-w-assignee-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-w-set-received-now", "r-export-json", "r-export-csv", "r-import-json", "r-import-csv", "r-import-trello", "r-import-paste", "r-import-done", "r-import-trello-note", "r-import-target", "r-all-boards", "r-import-workflow", "r-workflow-format", "r-format-auto", "r-import-workflow-note", "r-import-unmapped", "r-set-scheduled-triggers", "r-set-button-triggers", "r-when-scheduled", "r-schedule-type", "r-schedule-once", "r-schedule-daily", "r-schedule-weekday", "r-schedule-weekly", "r-schedule-monthly", "r-schedule-at-time", "r-schedule-on-weekday", "r-schedule-on-day", "r-schedule-on-date", "r-of-cards-in-list", "r-when-due", "r-due-is-set", "r-due-soon", "r-due-overdue", "r-days-before", "r-days-after", "r-when-card-in-list", "r-for-n-days", "r-card-button", "r-board-button", "r-button-label", "r-run", "r-sort-list", "r-sort-by", "r-sort-due", "r-sort-name", "r-mark-complete", "r-mark-incomplete", "r-move-all-cards", "r-set-date-relative", "r-later", "r-unit-minutes", "r-unit-hours"];
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


test('Tatar scheduled rules preserve recurrence, date direction and completion polarity',()=>{
 assert.equal(new Set(['once','daily','weekday','weekly','monthly'].map(kind=>locale['r-schedule-'+kind])).size,5);
 assert.match(locale['r-schedule-weekly'],/\u0430\u0442\u043d\u0430/);
 assert.match(locale['r-schedule-daily'],/\u043a\u04e9\u043d/);
 assert.notEqual(locale['r-days-before'],locale['r-days-after']);
 assert.notEqual(locale['r-mark-complete'],locale['r-mark-incomplete']);
 assert.match(locale['r-mark-incomplete'],/\u0442\u04d9\u043c\u0430\u043c\u043b\u0430\u043d\u043c\u0430\u0433\u0430\u043d/);
 assert.ok(locale['r-for-n-days'].includes('N'));
 for(const name of ['n8n','Node-RED','WeKan']) assert.ok(locale['r-import-workflow-note'].includes(name));
 assert.match(locale['r-set-button-triggers'],/^\u0422\u04e9\u0439\u043c\u04d9\u043b\u04d9\u0440$/);
});
