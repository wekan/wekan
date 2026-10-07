'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/ku.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["board-view-product-backlog", "board-view-sprints", "board-view-sprint-report", "board-view-velocity", "scrum-settings", "scrum-product-owner", "scrum-master", "scrum-developers", "scrum-working-days", "scrum-enabled", "scrum-product-goal", "scrum-definition-of-done", "scrum-estimate-source", "scrum-estimate-unit", "scrum-completion-policy", "scrum-source-poker", "scrum-source-customField", "scrum-policy-dueComplete", "scrum-policy-doneLists", "scrum-sprints", "scrum-sprint", "scrum-start-sprint", "scrum-close-sprint", "scrum-cancel-sprint", "scrum-rollover-sprint", "scrum-cancel-reason", "scrum-product-backlog", "scrum-edit-sprint", "scrum-sprint-goal", "scrum-capacity", "scrum-new-sprint", "scrum-releases", "scrum-release", "scrum-select-sprint", "scrum-backlog", "scrum-backlog-help"];
test('Kurdish Scrum settings preserve source keys and token inventories',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.ok(locale[key].trim(),key);
  assert.notEqual(locale[key],english[key],key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
 }
});
test('Kurdish Scrum distinguishes cancellation and completion policies',()=>{
 assert.notEqual(locale['scrum-close-sprint'],locale['scrum-cancel-sprint']);
 assert.match(locale['scrum-rollover-sprint'],/neqediyayî/);
 assert.match(locale['scrum-policy-dueComplete'],/nîşankirin/);
 assert.match(locale['scrum-policy-doneLists'],/kategoriya Qediyayî/);
 assert.match(locale['scrum-backlog-help'],/plankirî an çalak/);
 assert.equal(locale['board-view-product-backlog'],locale['scrum-product-backlog']);
});
