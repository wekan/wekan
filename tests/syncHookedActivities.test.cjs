'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { withSyncActivityDeferred, deferSyncActivity } = require('../server/lib/syncActivityScope');
const { createSyncHookedActivities } = require('../server/lib/syncHookedActivities');
const { createSyncEffectPlanner } = require('../server/lib/syncEffects');
const { syncOperationEffectId } = require('../server/lib/syncOperationApply');
const step = { kind:'create', cardId:'card', before:null, after:{_id:'card',boardId:'board',listId:'list',swimlaneId:'lane',title:'Title'} };
const context = { operationId:randomUUID(),index:0 };
const effectId = syncOperationEffectId(context.operationId,0);
function planFor(unit=step) {
 return createSyncEffectPlanner({policy:{activities:true,notifications:true},userId:'user',username:'name',createdAt:new Date(0),
  list:{_id:'list',boardId:'board',title:'List'},swimlanes:[{_id:'lane',boardId:'board',title:'Lane'}]})(unit,context);
}
test('activity scope requires exact payload and one hook slot, isolates parallel and detached work',async()=>{
 const activity=planFor().activities.activity;
 let resume,late;const gate=new Promise(resolve=>{resume=resolve;});
 const task=withSyncActivityDeferred(activity,async()=>{
  await gate;
  assert.equal(deferSyncActivity('timestamps',{...activity,cardTitle:'Changed'}),false);
  for(const kind of ['timestamps','notificationIntent','rules','notifications']) {
   assert.equal(deferSyncActivity(kind,activity),true);assert.equal(deferSyncActivity(kind,activity),false);
  }
 });
 assert.equal(deferSyncActivity('rules',activity),false);resume();await task;
 for(const failure of [false,true]) {
  const wait=new Promise(resolve=>{resume=resolve;});
  const work=withSyncActivityDeferred(activity,async()=>{
   late=wait.then(()=>deferSyncActivity('rules',activity));
   if(failure)throw new Error('failed');
  });
  if(failure)await assert.rejects(work,/failed/);else await work;
  resume();assert.equal(await late,false);
 }
});
test('bound adapter preserves actor, typed payload and untransformed reads for create and update plans',async()=>{
 for(const unit of [step,{kind:'update',cardId:'card',before:step.after,after:{...step.after,title:'New',description:'Text'}}]) {
  const plan=planFor(unit);let actor,calls=0;
  const rows=unit.kind==='create'?[plan.activities.activity]:plan.activities.rows.map(row=>row.activity);
  const activities={findOneAsync:async(id,options)=>{assert.deepEqual(options,{transform:null});return {_id:id};},
   insertAsync:async doc=>{calls++;assert.equal(actor,'user');assert.equal(deferSyncActivity('timestamps',doc),true);
    assert.equal(deferSyncActivity('rules',doc),true);assert.equal(deferSyncActivity('notifications',doc),true);
    doc.createdAt.setTime(1);return doc._id;}};
  const opts={activities,plan,step:unit,effectId,userId:'user',withActor:async(id,fn)=>{actor=id;try{return await fn();}finally{actor=null;}}};
  const adapter=createSyncHookedActivities(opts);
  assert.throws(()=>createSyncHookedActivities({...opts,userId:'other'}));
  for(const row of rows) {
   assert.equal(await adapter.insertAsync(row),row._id);assert.equal(row.createdAt.getTime(),0);
   assert.deepEqual(await adapter.findOneAsync(row._id),{_id:row._id});
   await assert.rejects(adapter.insertAsync({...row,userId:'other'}));
  }
  await assert.rejects(adapter.findOneAsync('other'));assert.equal(calls,rows.length);
  // The validated plan is captured, not read again after caller mutation.
  rows[0].cardTitle='Mutated';await assert.rejects(adapter.insertAsync(rows[0]));
 }
});
