'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help"];
test('Odia Scrum translations preserve source order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0b00-\u0b7f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Odia Scrum settings preserve role and policy distinctions',()=>{
 assert.equal(locale['board-view-product-backlog'],locale['scrum-product-backlog']);
 assert.equal(locale['board-view-sprints'],locale['scrum-sprints']);
 assert.equal(new Set(['start','close','cancel'].map(action=>locale['scrum-'+action+'-sprint'])).size,3);
 for(const pair of [['scrum-estimate-source','scrum-estimate-unit'],['scrum-policy-dueComplete','scrum-policy-doneLists'],['scrum-product-owner','scrum-master']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
});

test('Odia sprint reports preserve unknown estimates and distinct events',()=>{
 assert.ok(locale['scrum-report-help'].includes('\u0b36\u0b42\u0b28\u0b4d\u0b5f \u0b06\u0b15\u0b33\u0b28 \u0b28\u0b41\u0b39\u0b47\u0b01'));
 assert.ok(locale['scrum-report-help'].includes('\u0b38\u0b2e\u0b3e\u0b28 \u0b06\u0b15\u0b33\u0b28 \u0b0f\u0b15\u0b15 \u0b0f\u0b2c\u0b02 \u0b28\u0b40\u0b24\u0b3f'));
 assert.ok(locale['scrum-timebox'].includes('\u0b2e\u0b3f\u0b28\u0b3f\u0b1f\u0b4d'));
 assert.equal(new Set(['planning','daily','review','retrospective'].map(kind=>locale['scrum-event-'+kind])).size,4);
 for(const pair of [['scrum-added','scrum-removed'],['scrum-completed','scrum-incomplete'],['scrum-state-planned','scrum-state-active']]) assert.notEqual(locale[pair[0]],locale[pair[1]]);
});

test('Odia sprint observations preserve temporal limits and partial-report caveats',()=>{
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  assert.ok(locale[key].includes('UTC'));
  assert.ok(locale[key].includes('\u0b05\u0b1c\u0b23\u0b3e \u0b06\u0b15\u0b33\u0b28 \u0b36\u0b42\u0b28\u0b4d\u0b5f \u0b28\u0b41\u0b39\u0b47\u0b01'));
  assert.ok(locale[key].includes('\u0b26\u0b3f\u0b28\u0b17\u0b41\u0b21\u0b3c\u0b3f\u0b15 \u0b1b\u0b3e\u0b21\u0b3c\u0b3f \u0b26\u0b3f\u0b06\u0b2f\u0b3e\u0b0f'));
 }
 assert.ok(locale['scrum-daily-truncated'].includes('366'));
 assert.ok(locale['scrum-partial-report'].includes('\u0b15\u0b47\u0b2c\u0b33'));
 assert.notEqual(locale['scrum-confirm-close'],locale['scrum-confirm-cancel']);
 assert.notEqual(locale['scrum-state-closed'],locale['scrum-state-cancelled']);
 assert.equal(locale['scrum-category-backlog'],locale['scrum-backlog']);
});
