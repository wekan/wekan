'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {historyDocument,historyRecords,historySide}=require('../models/lib/scrumHistory');
test('Scrum metadata history does not copy unrelated card contents or revision counters',()=>{
 const doc={_id:'c',boardId:'b',title:'Private title',description:'Other data',scrum:{sprintId:'s'},scrumRevision:9};
 const content=historyDocument('card',doc);
 assert.deepEqual(content,{_id:'c',boardId:'b',scrum:{sprintId:'s'}});
 content.scrum.sprintId='changed';assert.equal(doc.scrum.sprintId,'s');
 assert.equal(historyDocument('card',null),null);
 assert.throws(()=>historyDocument('unknown',doc),/Unsupported/);
});
test('a compound sprint operation retains its first before and final after values',()=>{
 const changes=[{entityType:'card',entityId:'c',previousContent:{_id:'c',boardId:'b',scrum:{sprintId:'s'}},newContent:{_id:'c',boardId:'b',scrum:{sprintId:'next'}}},{entityType:'card',entityId:'c',previousContent:{_id:'c',boardId:'b',scrum:{sprintId:'next'}},newContent:{_id:'c',boardId:'b',scrum:{sprintId:null}}},{entityType:'scrum-sprint',entityId:'s',previousContent:null,newContent:{_id:'s',boardId:'b',state:'closed',revision:4,rolloverPending:[{cardId:'c'}],closeSnapshot:{cards:[]}}}];
 const rows=historyRecords(changes);
 assert.equal(rows.length,2);assert.equal(rows[0].before.scrum.sprintId,'s');assert.equal(rows[0].after.scrum.sprintId,null);
 assert.equal(rows[1].after.revision,undefined);assert.equal(rows[1].after.rolloverPending,undefined);
 assert.deepEqual(rows[1].after.closeSnapshot,{cards:[]});
 assert.equal(historySide(rows,'before').records[1].document,null);
});
