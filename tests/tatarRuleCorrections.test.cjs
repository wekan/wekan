'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["r-rule", "r-add-trigger", "r-add-action", "r-board-rules", "r-add-rule", "r-view-rule", "r-delete-rule", "r-new-rule-name", "r-no-rules", "r-import-export", "r-select-all", "r-unselect-all", "r-delete-selected", "r-export-selected", "r-edit-rule", "r-edit-rule-trigger-action", "r-rule-enabled", "r-toggle-rule-enabled", "r-workflow-view", "r-list-view", "r-when", "r-workflow-help", "r-drop-trigger", "r-drop-action", "r-w-card-created", "r-w-card-archived", "r-w-card-unarchived", "r-w-label-added", "r-w-label-removed", "r-w-member-added", "r-w-member-removed", "r-w-assignee-added", "r-w-assignee-removed", "r-w-checklist-added", "r-w-attachment-added", "r-w-every-day-at", "r-w-set-received-now", "r-export-json", "r-export-csv", "r-import-json", "r-import-csv", "r-import-trello", "r-import-paste", "r-import-done", "r-import-trello-note", "r-import-target", "r-all-boards", "r-import-workflow", "r-workflow-format", "r-format-auto", "r-import-workflow-note", "r-import-unmapped", "r-set-scheduled-triggers", "r-set-button-triggers", "r-when-scheduled", "r-schedule-type", "r-schedule-once", "r-schedule-daily", "r-schedule-weekday", "r-schedule-weekly", "r-schedule-monthly", "r-schedule-at-time", "r-schedule-on-weekday", "r-schedule-on-day", "r-schedule-on-date", "r-of-cards-in-list", "r-when-due", "r-due-is-set", "r-due-soon", "r-due-overdue", "r-days-before", "r-days-after", "r-when-card-in-list", "r-for-n-days", "r-card-button", "r-board-button", "r-button-label", "r-run", "r-sort-list", "r-sort-by", "r-sort-due", "r-sort-name", "r-mark-complete", "r-mark-incomplete", "r-move-all-cards", "r-set-date-relative", "r-later", "r-unit-minutes", "r-unit-hours", "r-unit-days", "r-unit-weeks", "r-trigger", "r-action", "r-when-a-card", "r-is", "r-is-moved", "r-added-to", "r-attachment-added-to", "r-removed-from", "r-attachment-removed-from", "set-filter", "r-moved-to", "r-moved-from", "r-archived", "r-unarchived", "r-when-a-label-is", "r-when-the-label", "r-list-name", "r-when-a-member", "r-when-the-member", "r-when-a-assignee", "r-when-the-assignee", "r-name", "r-when-a-attach", "r-when-a-card-matches-advanced-filter", "r-when-a-due-date-changed", "r-when-a-start-date-changed", "r-when-a-end-date-changed", "r-when-a-received-date-changed", "r-when-a-checklist", "r-when-the-checklist", "r-completed", "r-made-incomplete", "r-when-a-item", "r-when-the-item", "r-checked", "r-unchecked", "r-move-card-to", "r-top-of", "r-bottom-of", "r-its-list", "r-unarchive", "r-remove", "r-remove-all", "r-remove-all-labels", "r-set-color", "r-checklist", "r-check-all", "r-uncheck-all", "r-items-check", "r-check", "r-uncheck", "r-item", "r-of-checklist", "r-send-email", "r-to", "r-of", "r-subject", "r-rule-details", "r-d-move-to-top-gen", "r-d-move-to-top-spec", "r-d-move-to-bottom-gen", "r-d-move-to-bottom-spec", "r-d-send-email", "r-d-send-email-to", "r-d-send-email-subject", "r-d-send-email-message", "r-d-archive", "r-d-unarchive", "r-d-remove-label", "r-create-card", "r-in-list", "r-in-swimlane", "r-d-remove-all-member", "r-d-check-all", "r-d-uncheck-all", "r-d-check-one", "r-d-uncheck-one", "r-d-check-of-list", "r-d-add-checklist", "r-d-remove-checklist", "r-by", "r-add-checklist", "r-with-items", "r-items-list", "r-add-swimlane", "r-swimlane-name", "r-board-note", "r-checklist-note", "r-when-a-card-is-moved", "r-set", "r-update", "r-datefield", "r-df-due-at", "r-df-end-at", "r-to-current-datetime", "r-remove-value-from", "r-link-card"];
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


test('Tatar date triggers retain set-or-change semantics and distinct date kinds',()=>{
 const dates=['due','start','end','received'].map(kind=>locale['r-when-a-'+kind+'-date-changed']);
 assert.equal(new Set(dates).size,4);
 for(const value of dates) {
  assert.match(value,/\u0431\u0438\u043b\u0433\u0435\u043b\u04d9\u043d\u0433\u04d9\u043d\u0434\u04d9/);
  assert.match(value,/\u044f\u043a\u0438 \u04af\u0437\u0433\u04d9\u0440\u0433\u04d9\u043d\u0434\u04d9/);
 }
 assert.notEqual(locale['r-moved-to'],locale['r-moved-from']);
 assert.notEqual(locale['r-archived'],locale['r-unarchived']);
 assert.notEqual(locale['r-completed'],locale['r-made-incomplete']);
 assert.equal(locale['r-added-to'],locale['r-attachment-added-to']);
 assert.equal(locale['r-removed-from'],locale['r-attachment-removed-from']);
 assert.match(locale['r-when-a-attach'],/^\u0411\u0435\u0440\u043a\u0435\u0442\u043c\u04d9$/);
});


test('Tatar rule actions distinguish removal, checking and list position',()=>{
 assert.equal(locale['r-remove'],locale['r-remove-rule-part']);
 assert.notEqual(locale['r-check'],locale['r-uncheck']);
 assert.notEqual(locale['r-check-all'],locale['r-uncheck-all']);
 assert.notEqual(locale['r-remove-all'],locale['r-remove-all-labels']);
 for(const kind of ['gen','spec']) assert.notEqual(locale['r-d-move-to-top-'+kind],locale['r-d-move-to-bottom-'+kind]);
 assert.match(locale['r-top-of'],/^\u0411\u0430\u0448\u044b\u043d\u0430$/);
 assert.match(locale['r-bottom-of'],/^\u0410\u0445\u044b\u0440\u044b\u043d\u0430$/);
 assert.equal(locale['r-send-email'],locale['r-d-send-email']);
 assert.equal(locale['r-to'],locale['r-d-send-email-to']);
 assert.equal(locale['r-subject'],locale['r-d-send-email-subject']);
 for(const tag of ['{card}','{cardLink}','{list}','{board}','{member}']) assert.ok(locale['r-email-vars-hint'].includes(tag));
});


test('Tatar action descriptions preserve checklist syntax and empty-field matching',()=>{
 assert.equal(locale['r-add-checklist'],locale['r-d-add-checklist']);
 assert.equal(locale['r-of-checklist'],locale['r-d-check-of-list']);
 for(const size of ['all','one']) assert.notEqual(locale['r-d-check-'+size],locale['r-d-uncheck-'+size]);
 assert.notEqual(locale['r-d-archive'],locale['r-d-unarchive']);
 assert.notEqual(locale['r-df-due-at'],locale['r-df-end-at']);
 assert.equal(locale['r-items-list'].split(',').length,3);
 assert.doesNotMatch(locale['r-items-list'],/\s/);
 assert.match(locale['r-checklist-note'],/\u04e9\u0442\u0435\u0440/);
 assert.match(locale['r-board-note'],/\u0431\u0430\u0440\u043b\u044b\u043a/);
 assert.match(locale['r-board-note'],/\u0431\u0443\u0448/);
 assert.match(locale['r-swimlane-name'],/^\u044e\u043b\u0430\u043a/);
});
