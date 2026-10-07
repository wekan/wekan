 'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const data=require('../imports/i18n/data/ak.i18n.json');

test('Akan rule editing and planning preserve distinct controls and source arguments', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["r-blocks-view", "r-blocks-help", "r-blocks-discard", "r-blocks-unavailable", "r-blocks-invalid", "r-blocks-conflict", "r-blocks-permission", "r-blocks-unsaved", "r-blocks-saved", "r-blocks-reload", "board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "rules"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(data.rules,'Mmara');
 assert.notEqual(data.rules,'Nsɛm a ɛfa dwumadi yi ho');
 assert.match(data['r-blocks-invalid'],/biako pɛ.*biako pɛ/);
 assert.match(data['r-blocks-permission'],/bɔɔd sohwɛfo/);
 assert.match(data['r-blocks-conflict'],/ans[a] na woasie/);
 assert.equal(new Set(['start','close','cancel'].map(v=>data['scrum-'+v+'-sprint'])).size,3);
 assert.notEqual(data['r-blocks-unsaved'],data['r-blocks-saved']);
 assert.equal(data['board-view-product-backlog'],data['scrum-product-backlog']);
 assert.equal(data['board-view-sprints'],data['scrum-sprints']);
 assert.match(data['scrum-timebox'],/simma/);
 assert.notEqual(data['scrum-policy-dueComplete'],data['scrum-policy-doneLists']);
});

test('Akan sprint reports preserve unknown estimates, partial data and lifecycle distinctions', async()=>{
 const {translationTokens}=await import('../releases/translations/placeholder-tokens.mjs');
 const keys=["scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending"];
 for(const key of keys){
  assert.notEqual(data[key],english[key],key);
  assert.deepEqual(translationTokens(data[key]),translationTokens(english[key]),key);
 }
 assert.equal(new Set(['planned','active','closed','cancelled','released'].map(s=>data['scrum-state-'+s])).size,5);
 for(const key of ['scrum-report-help','scrum-daily-observations-help','scrum-daily-observations-export-help']) assert.match(data[key],/n[n]?im.*nyɛ.*0/);
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  assert.match(data[key],/edi kan/);
  assert.match(data[key],/UTC/);
  assert.match(data[key],/nna a enni hɔ/i);
 }
 assert.match(data['scrum-daily-truncated'],/366/);
 assert.match(data['scrum-partial-report'],/nkutoo/);
 assert.match(data['scrum-confirm-close'],/bɛkɔ baabi a woapaw/);
 assert.match(data['scrum-confirm-cancel'],/bɛkɔ so aka ho kosi/);
 assert.equal(data['scrum-category-backlog'],data['scrum-backlog']);
 assert.equal(data['scrum-category-done'],data['scrum-completed']);
 assert.notEqual(data['scrum-completed'],data['scrum-incomplete']);
});
