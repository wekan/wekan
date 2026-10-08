'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty", "scrum-observed-scope", "scrum-daily-observations-export-help", "scrum-import-pending"];
test('Konkani Scrum translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Konkani Scrum planning distinguishes policies, events and actions',()=>{
 assert.equal(locale['board-view-product-backlog'],locale['scrum-product-backlog']);
 assert.equal(locale['board-view-sprints'],locale['scrum-sprints']);
 assert.equal(new Set(['start','close','cancel'].map(k=>locale['scrum-'+k+'-sprint'])).size,3);
 assert.notEqual(locale['scrum-policy-dueComplete'],locale['scrum-policy-doneLists']);
 assert.ok(locale['scrum-source-customField'].includes('\u0938\u0902\u0916\u094d\u092f\u093e\u0924\u094d\u092e\u0915'));
 assert.notEqual(locale['scrum-estimate-source'],locale['scrum-estimate-unit']);
 assert.ok(locale['scrum-timebox'].includes('\u092e\u093f\u0928\u091f\u093e\u0902'));
 assert.ok(locale['scrum-backlog-help'].includes('\u0928\u093f\u092f\u094b\u091c\u093f\u0924 \u0935\u093e \u0938\u0915\u094d\u0930\u093f\u092f'));
 assert.equal(new Set(['planning','daily','review','retrospective'].map(k=>locale['scrum-event-'+k])).size,4);
});
test('Konkani sprint reports retain estimate and membership caveats',()=>{
 assert.ok(locale['scrum-report-help'].includes('\u0936\u0942\u0928\u094d\u092f \u0905\u0902\u0926\u093e\u091c \u0928\u094d\u0939\u092f'));
 assert.ok(locale['scrum-report-help'].includes('\u090f\u0915\u0915\u093e\u0902 \u0906\u0928\u0940 \u0927\u094b\u0930\u0923\u093e\u0902 \u091c\u0941\u0933\u0924\u093e\u0924 \u0924\u0947\u0928\u094d\u0928\u093e\u091a'));
 assert.equal(new Set(['planned','active','closed','cancelled'].map(k=>locale['scrum-state-'+k])).size,4);
 assert.notEqual(locale['scrum-added'],locale['scrum-removed']);
 assert.ok(locale['scrum-confirm-close'].includes('\u0935\u0947\u0902\u091a\u093f\u0932\u094d\u0932\u094d\u092f\u093e \u091c\u093e\u0917\u094d\u092f\u093e\u0930'));
 assert.ok(locale['scrum-confirm-cancel'].includes('\u0938\u0926\u0938\u094d\u092f\u0924\u094d\u0935 \u0930\u093e\u0916\u0942\u0928'));
 assert.ok(locale['scrum-partial-report'].includes('\u0938\u0926\u094d\u092f\u093e \u0924\u0941\u092e\u0915\u093e\u0902 \u0928\u0947\u092e\u093f\u0932\u094d\u0932\u0940\u0902 \u0915\u093e\u0930\u094d\u0921\u093e\u0902 \u092b\u0915\u0924'));
 assert.equal(locale['scrum-category-backlog'],locale['scrum-backlog']);
});
test('Konkani daily observations retain sampling and export limits',()=>{
 assert.ok(locale['scrum-daily-truncated'].includes('366'));
 for(const key of ['scrum-daily-observations-help','scrum-daily-observations-export-help']){
  for(const term of ['UTC','\u092a\u092f\u0932\u0947\u0902 \u0928\u094b\u0902\u0926 \u0915\u0947\u0932\u094d\u0932\u0947\u0902 \u0928\u093f\u0930\u0940\u0915\u094d\u0937\u0923','\u0928\u094b\u0902\u0926 \u0928\u093e\u0936\u093f\u0932\u094d\u0932\u0947 \u0926\u0940\u0938 \u0938\u094b\u0921\u0932\u094d\u092f\u093e\u0924','\u0936\u0942\u0928\u094d\u092f \u0928\u094d\u0939\u092f','\u0915\u0930\u093f\u0928\u093e\u0924']) assert.ok(locale[key].includes(term),key+term);
 }
 assert.ok(locale['scrum-daily-observations-help'].includes('\u0926\u093f\u0938\u093e\u091a\u094d\u092f\u093e \u0936\u0947\u0935\u091f\u093e\u091a\u0940 \u092c\u0947\u0930\u0940\u091c \u0926\u093e\u0916\u092f\u0928\u093e\u0924'));
 assert.ok(locale['scrum-daily-observations-help'].includes('\u0938\u093e\u0927\u0928\u092a\u091f\u094d\u091f\u0940\u091a\u0940 \u0928\u093f\u0930\u094d\u092f\u093e\u0924 \u0915\u0943\u0924\u0940 \u0938\u094d\u092a\u094d\u0930\u093f\u0902\u091f\u093e\u091a\u0947 \u0928\u093f\u0915\u093e\u0932'));
 assert.ok(locale['scrum-import-pending'].includes('\u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u093e\u0924'));
 assert.ok(locale['scrum-partial-snapshot'].includes('\u092b\u0915\u0924 \u090f\u0915 \u092d\u093e\u0917'));
});
