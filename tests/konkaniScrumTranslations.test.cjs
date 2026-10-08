'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/kok.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog","board-view-sprints","board-view-sprint-report","board-view-velocity","scrum-settings","scrum-product-owner","scrum-master","scrum-developers","scrum-working-days","scrum-enabled","scrum-product-goal","scrum-definition-of-done","scrum-estimate-source","scrum-estimate-unit","scrum-completion-policy","scrum-source-poker","scrum-source-customField","scrum-policy-dueComplete","scrum-policy-doneLists","scrum-sprints","scrum-sprint","scrum-start-sprint","scrum-close-sprint","scrum-cancel-sprint","scrum-rollover-sprint","scrum-cancel-reason","scrum-product-backlog","scrum-edit-sprint","scrum-sprint-goal","scrum-capacity","scrum-new-sprint","scrum-releases","scrum-release","scrum-select-sprint","scrum-backlog","scrum-backlog-help","scrum-estimate","scrum-backlog-rank","scrum-issue-type","scrum-acceptance-criteria","scrum-events","scrum-event-kind","scrum-timebox","scrum-notes","scrum-event-planning","scrum-event-daily","scrum-event-review","scrum-event-retrospective"];
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
