'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/mai.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog","board-view-sprints","board-view-sprint-report","board-view-velocity","scrum-settings","scrum-product-owner","scrum-master","scrum-developers","scrum-working-days","scrum-enabled","scrum-product-goal","scrum-definition-of-done","scrum-estimate-source","scrum-estimate-unit","scrum-completion-policy","scrum-source-poker","scrum-source-customField","scrum-policy-dueComplete","scrum-policy-doneLists","scrum-sprints","scrum-sprint","scrum-start-sprint","scrum-close-sprint","scrum-cancel-sprint","scrum-rollover-sprint","scrum-cancel-reason","scrum-product-backlog","scrum-edit-sprint","scrum-sprint-goal","scrum-capacity"];
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
