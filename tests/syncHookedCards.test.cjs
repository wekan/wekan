'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {withSyncRecordingDeferred,deferSyncRecording}=require('../server/lib/syncRecordingScope');
const {createSyncHookedCards}=require('../server/lib/syncHookedCards');
const {prepareSyncOperationMutation}=require('../server/lib/syncOperationMutation');
const card={_id:'card',boardId:'board',listId:'list',title:'Before'};
const scope={cardId:'card',boardId:'board',listId:'list',kinds:['title','history']};
test('deferred recording is isolated by async write, card identity, field and hook slot',async()=>{
 let release;const waiting=new Promise(resolve=>{release=resolve;});
 const task=withSyncRecordingDeferred(scope,async()=>{
  await waiting;
  assert.equal(deferSyncRecording('title',{...card,_id:'other'}),false);
  assert.equal(deferSyncRecording('title',{...card,boardId:'other'}),false);
  // members, labels, dates and colour are deferrable for durable rule card
  // actions (server/lib/syncRuleCardCommand.js); assignees are not.
  assert.equal(deferSyncRecording('history',card,['assignees']),false);
  assert.equal(deferSyncRecording('history',card,['title']),true);
  assert.equal(deferSyncRecording('title',card),true);
  assert.equal(deferSyncRecording('title',card),false);
 });
 assert.equal(deferSyncRecording('title',card),false);release();await task;
 assert.equal(deferSyncRecording('title',card),false);
});
test('callbacks that outlive a completed or failed write cannot suppress later recording',async()=>{
 for(const failure of [false,true]){
  let resume,check;const wait=new Promise(resolve=>{resume=resolve;});
  const work=withSyncRecordingDeferred(scope,async()=>{
   check=wait.then(()=>deferSyncRecording('title',card));
   if(failure)throw new Error('write failed');
  });
  if(failure)await assert.rejects(work,/write failed/);else await work;
  resume();assert.equal(await check,false);
 }
});
test('hooked card adapter keeps schema/hook calls and actor context with exact conditional writes',async()=>{
 const step={kind:'update',cardId:'card',before:card,after:{...card,title:'  After  ',description:''}};
 const mutation=prepareSyncOperationMutation(step);let calls=0,activeActor;
 const collection={findOneAsync:async(q,options)=>{assert.equal(options.transform,null);return card;},insertAsync:async()=>assert.fail(),
  updateAsync:async(q,modifier,options)=>{
   calls++;assert.equal(activeActor,'author');assert.deepEqual(q,mutation.beforeSelector);
   assert.equal(modifier.$set.title,'  After  ');assert.equal(modifier.$set.description,'');
   assert.deepEqual(options,{removeEmptyStrings:false,trimStrings:false});
   assert.equal(deferSyncRecording('title',card),true);assert.equal(deferSyncRecording('history',card,['title','description']),true);
   modifier.$set.title='adapter mutation';return 1;
  }};
 const adapter=createSyncHookedCards({cards:collection,step,userId:'author',withActor:async(userId,fn)=>{
  activeActor=userId;try{return await fn();}finally{activeActor=undefined;}
 }});
 assert.equal((await adapter.findOne({_id:'card'}))._id,'card');
 await assert.rejects(adapter.findOne({_id:'other'}),/adapter-invalid/);
 assert.deepEqual(await adapter.updateOne(mutation.beforeSelector,mutation.modifier),{matchedCount:1});
 assert.equal(mutation.modifier.$set.title,'  After  ');assert.equal(activeActor,undefined);assert.equal(calls,1);
 await assert.rejects(adapter.updateOne({_id:'other'},mutation.modifier),/adapter-invalid/);
 await assert.rejects(adapter.insertOne(step.after),/adapter-invalid/);assert.equal(calls,1);
 assert.throws(()=>createSyncHookedCards({cards:collection,step:{...step,after:{...step.after,dateLastActivity:new Date()}},userId:'author',withActor:()=>{}}));
});
