'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help", "scrum-estimate", "scrum-backlog-rank", "scrum-issue-type", "scrum-acceptance-criteria", "scrum-events", "scrum-event-kind", "scrum-timebox", "scrum-notes", "scrum-event-planning", "scrum-event-daily", "scrum-event-review", "scrum-event-retrospective", "scrum-committed", "scrum-completed", "scrum-added", "scrum-removed", "scrum-incomplete", "scrum-no-closed-sprints", "scrum-report-help", "scrum-total", "scrum-state-planned", "scrum-state-active", "scrum-state-closed", "scrum-state-cancelled", "scrum-unknown-estimate", "scrum-confirm-close", "scrum-confirm-cancel", "scrum-past-sprints", "scrum-list-category", "scrum-swimlane-purpose", "scrum-category-backlog", "scrum-category-todo", "scrum-category-doing", "scrum-category-done", "scrum-partial-report", "scrum-state-released", "scrum-released-at", "scrum-follow-up-cards", "scrum-import-reference-omitted", "scrum-partial-snapshot", "scrum-resume-close", "scrum-daily-observations", "scrum-daily-observations-help", "scrum-daily-truncated", "scrum-daily-empty"];
test('Maithili Scrum translations preserve order, script and tokens',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0900-\u097f]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Maithili Scrum labels distinguish policies and sprint actions',()=>{
 assert.equal(locale['board-view-product-backlog'],locale['scrum-product-backlog']);
 assert.equal(locale['board-view-sprints'],locale['scrum-sprints']);
 assert.equal(new Set(['start','close','cancel'].map(k=>locale['scrum-'+k+'-sprint'])).size,3);
 assert.notEqual(locale['scrum-policy-dueComplete'],locale['scrum-policy-doneLists']);
 assert.ok(locale['scrum-source-customField'].includes('\u0938\u0902\u0916\u094d\u092f\u093e\u0924\u094d\u092e\u0915'));
 assert.notEqual(locale['scrum-estimate-source'],locale['scrum-estimate-unit']);
});

test('Maithili sprint reports retain unknown estimates and comparable units',()=>{
 assert.ok(locale['scrum-timebox'].includes('\u092e\u093f\u0928\u091f'));
 assert.ok(locale['scrum-report-help'].includes('\u0936\u0942\u0928\u094d\u092f \u0905\u0928\u0941\u092e\u093e\u0928 \u0928\u0939\u093f'));
 assert.ok(locale['scrum-report-help'].includes('\u0938\u092e\u093e\u0928 \u0905\u0928\u0941\u092e\u093e\u0928 \u0907\u0915\u093e\u0908 \u0906 \u0928\u0940\u0924\u093f'));
 assert.equal(new Set(['planned','active','closed','cancelled'].map(k=>locale['scrum-state-'+k])).size,4);
 assert.notEqual(locale['scrum-added'],locale['scrum-removed']);
 assert.ok(locale['scrum-total'].includes('__unknown__ \u0905\u091c\u094d\u091e\u093e\u0924'));
 assert.ok(locale['scrum-backlog-help'].includes('\u0928\u093f\u092f\u094b\u091c\u093f\u0924 \u0935\u093e \u0938\u0915\u094d\u0930\u093f\u092f'));
});

test('Maithili sprint observations preserve reporting limits',()=>{
 assert.ok(locale['scrum-daily-truncated'].includes('366'));
 for(const term of ['UTC','\u092a\u0939\u093f\u0932 \u0926\u0930\u094d\u091c \u0905\u0935\u0932\u094b\u0915\u0928','\u092a\u094d\u0930\u0924\u094d\u092f\u0947\u0915 \u092c\u0926\u0932\u093e\u0935 \u0926\u0930\u094d\u091c \u0928\u0939\u093f','\u0926\u093f\u0928\u0915 \u0905\u0902\u0924\u0915 \u0915\u0941\u0932 \u092e\u093e\u0928 \u0928\u0939\u093f','\u0936\u0942\u0928\u094d\u092f \u0928\u0939\u093f','\u091f\u0942\u0932\u092c\u093e\u0930\u0915 \u0928\u093f\u0930\u094d\u092f\u093e\u0924']) assert.ok(locale['scrum-daily-observations-help'].includes(term));
 assert.ok(locale['scrum-partial-report'].includes('\u0915\u0947\u0935\u0932 \u090f\u0916\u0928 \u0905\u0939\u093e\u0901 \u0915\u0947\u0901 \u0938\u094c\u0902\u092a\u0932'));
 assert.ok(locale['scrum-confirm-cancel'].includes('\u0938\u0926\u0938\u094d\u092f\u0924\u093e \u092c\u0928\u0932 \u0930\u0939\u0924'));
 assert.ok(locale['scrum-confirm-close'].includes('\u091a\u0941\u0928\u0932 \u0917\u0902\u0924\u0935\u094d\u092f'));
 assert.equal(locale['scrum-category-backlog'],locale['scrum-backlog']);
});
