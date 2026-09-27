'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {planSyncTextMerge,syncTextSelector}=require('../models/lib/listSyncTextMerge');
const card={_id:'c',syncExternalId:'1',title:'Original',description:'Body',syncLastSource:{title:'Original',description:'Body'}};
const task={externalId:'1',title:'Original',description:'Body'};
test('source-only edits merge while local-only text remains untouched',()=>{
 const upstream=planSyncTextMerge([{...task,title:'New'}],[card]);
 assert.equal(upstream.conflicts.length,0);assert.equal(upstream.baselines.get('c').title,'New');
 const local=planSyncTextMerge([task],[{...card,title:'Local'}]);
 assert.equal(local.conflicts.length,0);assert.equal(local.tasks[0].title,'Local');assert.equal(local.baselines.size,0);
});
test('simultaneous distinct edits and unknown legacy baselines require resolution',()=>{
 assert.equal(planSyncTextMerge([{...task,title:'Remote'}],[{...card,title:'Local'}]).conflicts.length,1);
 assert.equal(planSyncTextMerge([task],[{...card,title:'Legacy local',syncLastSource:undefined}]).conflicts.length,1);
 const aligned=planSyncTextMerge([task],[{...card,syncLastSource:undefined}]);
 assert.equal(aligned.conflicts.length,0);assert.deepEqual(aligned.baselines.get('c'),card.syncLastSource);
});
test('same edits on both sides converge and missing source fields do not erase text',()=>{
 const same=planSyncTextMerge([{...task,title:'New'}],[{...card,title:'New'}]);
 assert.equal(same.conflicts.length,0);assert.equal(same.baselines.get('c').title,'New');
 const absent=planSyncTextMerge([{externalId:'1'}],[card]);assert.equal(absent.conflicts.length,0);assert.equal(absent.baselines.size,0);
 assert.equal(absent.tasks[0].description,undefined);
});
test('write preconditions retain board, list, text and baseline identity',()=>{
 const selector=syncTextSelector(card,'board','list');assert.equal(selector.boardId,'board');assert.equal(selector.listId,'list');
 assert.equal(selector.title,'Original');assert.deepEqual(selector.syncSourceType,{$exists:false});
 assert.deepEqual(selector.syncLastSource,{$eq:card.syncLastSource});
});

test('duplicate local identities stop matching even when the source is empty',()=>{
 for(const tasks of [[],[task]]){
  const result=planSyncTextMerge(tasks,[card,{...card,_id:'duplicate'}]);
  assert.equal(result.conflicts.length,1);assert.equal(result.conflicts[0].field,'syncExternalId');
  assert.equal(result.baselines.size,0);
 }
});
test('copied subtasks lose Sync identity without mutating the source',async()=>{
 const {buildCopiedSubtaskFields}=await import('../models/lib/subtaskCopy.js');
 const original={...card,syncSourceType:'jira',syncSourceKey:'original-project'};
 const copied=buildCopiedSubtaskFields(original,{newParentId:'parent',boardId:'board',listId:'list',swimlaneId:'lane'});
 for(const key of ['syncExternalId','syncSourceType','syncSourceKey','syncLastSource'])assert.equal(copied[key],undefined);
 assert.equal(original.syncExternalId,'1');assert.equal(copied.title,original.title);
});

test('field selection preserves identity and never lets excluded text reach the merge',()=>{
 const {selectSyncTextFields}=require('../models/lib/listSyncTextMerge');
 const source={...task,title:'Upstream',description:'Upstream body'};
 assert.deepEqual(selectSyncTextFields([source],['title']),[{externalId:'1',title:'Upstream'}]);
 assert.deepEqual(selectSyncTextFields([source],[]),[{externalId:'1'}]);
 assert.deepEqual(selectSyncTextFields([source]),[source]);
 const merged=planSyncTextMerge(selectSyncTextFields([source],['title']),[{...card,description:'Local body'}]);
 assert.equal(merged.conflicts.length,0);
 assert.equal(merged.tasks[0].description,undefined);
 assert.equal(merged.baselines.get('c').description,'Body');
 assert.equal(source.description,'Upstream body');
});

test('spent time is opt-in, preserves zero, merges source-only updates and detects timer edits',()=>{
 const {selectSyncTextFields}=require('../models/lib/listSyncTextMerge');
 const source={...task,spentTime:0};const current={...card,spentTime:2,syncLastSource:{...card.syncLastSource,spentTime:2}};
 assert.equal(selectSyncTextFields([source])[0].spentTime,undefined);
 const selected=selectSyncTextFields([source],['spentTime']);
 assert.equal(selected[0].spentTime,0);
 const merged=planSyncTextMerge(selected,[current]);
 assert.equal(merged.conflicts.length,0);assert.equal(merged.baselines.get('c').spentTime,0);
 assert.equal(planSyncTextMerge(selected,[{...current,spentTime:3}]).conflicts[0].field,'spentTime');
 assert.equal(syncTextSelector(current,'board','list').spentTime,2);
});
