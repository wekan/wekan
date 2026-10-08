'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const english=require('../imports/i18n/data/en.i18n.json');
const locale=require('../imports/i18n/data/tt.i18n.json');
const {translationTokens}=require('../releases/translations/placeholder-tokens.mjs');
const keys=["activity-changedTitle", "restrict-comment-editing", "due-date-changes", "due-date-changed-times", "error-user-notSameOrgOrTeam", "act-activity-notify", "act-addAttachment", "act-deleteAttachment", "act-addSubtask", "act-addLabel", "act-addedLabel", "act-removeLabel", "act-removedLabel", "act-addChecklist", "act-addChecklistItem", "act-removeChecklist", "act-removeChecklistItem", "act-checkedItem", "act-uncheckedItem", "act-completeChecklist", "act-uncompleteChecklist", "act-addComment", "act-editComment", "act-deleteComment", "act-createBoard", "act-createSwimlane", "act-createCard", "act-createCustomField", "act-deleteCustomField", "act-setCustomField", "act-createList", "act-addBoardMember", "act-archivedBoard", "act-archivedCard", "act-archivedList", "act-archivedSwimlane", "act-importBoard", "act-importCard", "act-importList", "act-joinMember", "act-moveCard", "act-moveCardToOtherBoard", "act-removeBoardMember", "act-restoredCard", "act-unjoinMember", "actions", "activity-added", "activity-archived", "activity-attached", "activity-created", "activity-changedListTitle", "activity-customfield-created", "activity-excluded", "activity-imported", "activity-imported-board", "activity-joined", "activity-moved", "activity-removed", "activity-sent", "activity-unjoined", "activity-subtask-added", "activity-checked-item", "activity-unchecked-item", "activity-checklist-added", "activity-checklist-removed", "activity-checklist-completed", "activity-checklist-uncompleted", "activity-checklist-item-added", "activity-checklist-item-removed", "activity-checked-item-card", "activity-unchecked-item-card", "activity-checklist-completed-card", "activity-checklist-uncompleted-card", "activity-editComment", "activity-deleteComment", "activity-receivedDate", "activity-startDate", "allboards.starred", "allboards.remaining", "allboards.workspaces", "allboards.add-workspace-prompt", "allboards.add-subworkspace", "allboards.add-subworkspace-prompt", "allboards.edit-workspace", "allboards.edit-workspace-name", "allboards.edit-workspace-icon", "allboards.workspace-menu", "workspace-settings", "workspaceActionsPopup-title", "allboards.delete-workspace-confirm", "allboards.delete-workspace-confirm-check", "multi-selection-active", "archive-permanent-delete-disabled-hint"];
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


test('Tatar activity movement preserves source, destination and sequential argument roles',()=>{
 assert.match(locale['act-moveCardToOtherBoard'],/__oldBoard__.*__oldSwimlane__.*__oldList__.*__board__.*__swimlane__.*__list__/);
 assert.match(locale['act-moveCard'],/__oldList__ \u0438\u0441\u0435\u043c\u043b\u0435\u0433\u0435\u043d\u043d\u04d9\u043d.*__list__ \u0438\u0441\u0435\u043c\u043b\u0435\u0433\u0435\u043d\u04d9/);
 assert.match(locale['activity-added'],/^%s \u043e\u0431\u044a\u0435\u043a\u0442\u044b\u043d %s \u044d\u0447\u0435\u043d\u04d9/);
 assert.match(locale['activity-imported'],/^%s.*%s.*\(\u0447\u044b\u0433\u0430\u043d\u0430\u043a: %s\)$/);
 assert.match(locale['activity-moved'],/^%s.*%s \u044d\u0447\u0435\u043d\u043d\u04d9\u043d %s \u044d\u0447\u0435\u043d\u04d9/);
 assert.notEqual(locale['act-joinMember'],locale['act-unjoinMember']);
 assert.notEqual(locale['act-addBoardMember'],locale['act-removeBoardMember']);
 assert.notEqual(locale['act-archivedCard'],locale['act-restoredCard']);
});


test('Tatar checklist messages retain argument roles and workspace aliases',()=>{
 for(const action of ['added','removed']) assert.match(locale['activity-checklist-item-'+action],/^'%s'.*\(\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430: %s\)$/);
 for(const action of ['checked','unchecked']) assert.match(locale['activity-'+action+'-item'],/^%s.*%s.*\(\u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0430: %s\)$/);
 for(const kind of ['receivedDate','startDate']) assert.match(locale['activity-'+kind],/^%s \u0438\u0442\u0435\u043f %s/);
 assert.notEqual(locale['activity-checklist-completed'],locale['activity-checklist-uncompleted']);
 assert.equal(locale['workspace-settings'],locale['workspaceActionsPopup-title']);
 assert.equal(locale['allboards.add-workspace-prompt'],locale['allboards.edit-workspace-name']);
 assert.notEqual(locale['allboards.add-workspace-prompt'],locale['allboards.add-subworkspace-prompt']);
 assert.ok(locale['allboards.edit-workspace-icon'].includes('Markdown'));
});
