'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tk_TM.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog","board-view-sprints","board-view-sprint-report","board-view-velocity","scrum-settings","scrum-product-owner","scrum-master","scrum-developers","scrum-working-days","scrum-enabled","scrum-product-goal","scrum-definition-of-done","scrum-estimate-source","scrum-estimate-unit","scrum-completion-policy","scrum-source-poker","scrum-source-customField","scrum-policy-dueComplete","scrum-policy-doneLists","scrum-sprints","scrum-sprint","scrum-start-sprint","scrum-close-sprint","scrum-cancel-sprint","scrum-rollover-sprint","scrum-cancel-reason","scrum-product-backlog","scrum-edit-sprint","scrum-sprint-goal","scrum-capacity","scrum-new-sprint","scrum-releases","scrum-release","scrum-select-sprint","scrum-backlog","scrum-backlog-help"];
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
