'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending"];
test('Turkmen Scrum translations preserve order and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Turkmen Scrum planning preserves policy and lifecycle distinctions',()=>{
 assert.equal(locale['board-view-product-backlog'],locale['scrum-product-backlog']);
 assert.equal(locale['board-view-sprints'],locale['scrum-sprints']);
 assert.equal(new Set(['start','close','cancel'].map(k=>locale['scrum-'+k+'-sprint'])).size,3);
 assert.notEqual(locale['scrum-policy-dueComplete'],locale['scrum-policy-doneLists']);
 assert.notEqual(locale['scrum-estimate-source'],locale['scrum-estimate-unit']);
 assert.ok(locale['scrum-source-customField'].includes('San g\u00f6rn\u00fc\u015fli'));
 assert.ok(locale['scrum-backlog-help'].includes('me\u00fdille\u015fdirilen \u00fda-da i\u015fje\u0148'));
 assert.ok(locale['scrum-rollover-sprint'].includes('Tamamlanmadyk'));
});
test('Turkmen sprint reports preserve unknown estimates and lifecycle caveats',()=>{
 assert.ok(locale['scrum-report-help'].includes('nol \u00e7aklamalar d\u00e4ldir'));
 assert.ok(locale['scrum-report-help'].includes('\u00f6l\u00e7eg birlikleri we d\u00fczg\u00fcnleri gabat gelende'));
 assert.ok(locale['scrum-confirm-close'].includes('sa\u00fdlanan \u00fdere'));
 assert.ok(locale['scrum-confirm-cancel'].includes('agzalygyny saklar'));
 assert.ok(locale['scrum-partial-report'].includes('di\u0148e h\u00e4zirki wagtda size bellenen'));
 assert.equal(new Set(['planned','active','closed','cancelled'].map(k=>locale['scrum-state-'+k])).size,4);
 assert.equal(new Set(['planning','daily','review','retrospective'].map(k=>locale['scrum-event-'+k])).size,4);
 assert.notEqual(locale['scrum-added'],locale['scrum-removed']);
 assert.ok(locale['scrum-timebox'].includes('minut'));
 assert.equal(locale['scrum-category-backlog'],locale['scrum-backlog']);
});
test('Turkmen daily observations preserve sampling and export limitations',()=>{
 assert.ok(locale['scrum-daily-truncated'].includes('366'));
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  for(const term of ['UTC','ilkinji \u00fdazga alnan','g\u00fcnler go\u00fdberil\u00fd\u00e4r','\u00fdazga alma\u00fdar','nol d\u00e4ldir']) assert.ok(locale[key].includes(term),key+term);
 }
 assert.ok(locale['scrum-daily-observations-help'].includes('g\u00fcn\u00fc\u0148 ahyryndaky jemi bahalary g\u00f6rkezme\u00fd\u00e4r'));
 assert.ok(locale['scrum-daily-observations-help'].includes('gurallar panelini\u0148 Eksport hereketi sprinti\u0148 netijelerini'));
 assert.ok(locale['scrum-partial-snapshot'].includes('di\u0148e bir b\u00f6legini'));
 assert.ok(locale['scrum-import-pending'].includes('el\u00fdeterli d\u00e4l'));
});
