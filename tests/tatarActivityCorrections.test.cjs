'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["activity-changedTitle", "restrict-comment-editing", "due-date-changes", "due-date-changed-times", "error-user-notSameOrgOrTeam", "act-activity-notify", "act-addAttachment", "act-deleteAttachment", "act-addSubtask", "act-addLabel", "act-addedLabel", "act-removeLabel", "act-removedLabel", "act-addChecklist", "act-addChecklistItem", "act-removeChecklist", "act-removeChecklistItem", "act-checkedItem", "act-uncheckedItem", "act-completeChecklist", "act-uncompleteChecklist", "act-addComment", "act-editComment", "act-deleteComment", "act-createBoard", "act-createSwimlane", "act-createCard", "act-createCustomField", "act-deleteCustomField", "act-setCustomField", "act-createList"];
test('Tatar activity corrections preserve source keys and placeholder case and counts',()=>{
 assert.deepEqual(Object.keys(locale),Object.keys(english));
 for(const key of keys){
  assert.notEqual(locale[key],english[key],key);
  assert.match(locale[key],/[\u0400-\u04ff]/,key);
  assert.deepEqual(translationTokens(locale[key]),translationTokens(english[key]),key);
  assert.doesNotMatch(locale[key],/\u043a\u0443\u043b\u0432\u0430\u0440|\u0442\u0430\u043a\u0442\u0430\u0441\u0443|\u04e9\u0441\u0442\u04d9\u043d\u0434\u0438/i,key);
 }
});
test('Tatar activity messages preserve action polarity and title argument order',()=>{
 assert.match(locale['activity-changedTitle'],/^%s \u0438\u0442\u0435\u043f %s \u0438\u0441\u0435\u043c\u0435\u043d/);
 assert.equal(locale['act-addLabel'],locale['act-addedLabel']);
 assert.equal(locale['act-removeLabel'],locale['act-removedLabel']);
 assert.notEqual(locale['act-addLabel'],locale['act-removeLabel']);
 assert.notEqual(locale['act-checkedItem'],locale['act-uncheckedItem']);
 assert.match(locale['act-uncompleteChecklist'],/\u0442\u04d9\u043c\u0430\u043c\u043b\u0430\u043d\u043c\u0430\u0433\u0430\u043d/);
 assert.ok(locale['act-removeChecklistItem'].includes('__checkList__'));
 assert.ok(!locale['act-removeChecklistItem'].includes('__checklist__'));
 assert.equal(new Set(['add','edit','delete'].map(action=>locale['act-'+action+'Comment'])).size,3);
});
