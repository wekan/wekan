'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {validateStep,runSyncOperation}=require('../server/lib/syncOperationJournal');
const step=()=>({kind:'create',cardId:'card',before:null,after:{_id:'card',boardId:'board',listId:'list',title:'Title',syncLastSource:{title:'Title',spentTime:0}}});
test('durable Sync plan snapshots exclude credentials, arbitrary records and malformed values',()=>{
 assert.doesNotThrow(()=>validateStep(step()));
 const nullable=step();nullable.after.syncLastSource=null;assert.doesNotThrow(()=>validateStep(nullable));
 for(const mutate of [s=>s.after.token='SECRET',s=>s.after.syncLastSource.token='SECRET',s=>s.after.syncLastSource.title={token:'SECRET'},
  s=>s.after.spentTime=Infinity,s=>s.after.archivedAt='not a date',s=>s.after._id='other',s=>s.after.title='x'.repeat(1024*1024),
  s=>s.kind='delete',s=>s.before={},s=>s.after.boardId=null]){
  const s=step();mutate(s);assert.throws(()=>validateStep(s));
 }
});
test('a journal cannot start without a lease guard or with secret-bearing scope metadata',async()=>{
 const scope={listId:'list',boardId:'board',sourceKey:'key',revision:null,incarnation:null};
 await assert.rejects(runSyncOperation({scope}),/lease-required/);
 await assert.rejects(runSyncOperation({scope:{...scope,token:'secret'}}),/invalid-sync-operation-scope/);
});

test('damaged operation identities cannot become Mongo selectors during recovery cleanup',async()=>{
 const scope={listId:'list',boardId:'board',sourceKey:'key',revision:null,incarnation:null};
 for(const operationId of [{$ne:null},null,'not-an-operation-id']){
  await assert.rejects(runSyncOperation({scope,assertCurrent:async()=>{},operations:{
   findOne:async()=>({_id:'list',scope,operationId,state:'cleaning',total:0,checkpoint:0}),
   updateOne:async()=>assert.fail('invalid identity reached mutation'),
  }}),/invalid-sync-operation-identity/);
 }
});
