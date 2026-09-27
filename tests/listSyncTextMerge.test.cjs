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
 assert.deepEqual(selector.syncLastSource,card.syncLastSource);
});
