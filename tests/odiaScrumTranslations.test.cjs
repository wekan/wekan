'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/or_IN.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog","board-view-sprints","board-view-sprint-report","board-view-velocity","scrum-settings","scrum-product-owner","scrum-master","scrum-developers","scrum-working-days","scrum-enabled","scrum-product-goal","scrum-definition-of-done","scrum-estimate-source","scrum-estimate-unit","scrum-completion-policy","scrum-source-poker","scrum-source-customField","scrum-policy-dueComplete","scrum-policy-doneLists","scrum-sprints","scrum-sprint","scrum-start-sprint","scrum-close-sprint","scrum-cancel-sprint","scrum-rollover-sprint","scrum-cancel-reason","scrum-product-backlog","scrum-edit-sprint"];
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
