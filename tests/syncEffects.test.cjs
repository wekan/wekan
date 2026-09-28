'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createSyncEffectPlanner, validateSyncEffects, persistSyncEffects } = require('../server/lib/syncEffects');
const { syncOperationEffectId } = require('../server/lib/syncOperationApply');
const card={_id:'card',boardId:'board',listId:'list',swimlaneId:'lane',title:'Before'};
const step={kind:'update',cardId:'card',before:card,after:{...card,title:'After'}};
const options={userId:'user',username:'name',createdAt:new Date(0),
 list:{_id:'list',boardId:'board',title:'List'},swimlanes:[{_id:'lane',boardId:'board',title:'Lane'}]};
const context={operationId:randomUUID(),index:0};
const effectId=syncOperationEffectId(context.operationId,context.index);
test('combined plans capture immutable metadata and leave planner state unchanged after activity validation errors',()=>{
 const input=structuredClone(options),planner=createSyncEffectPlanner(input);
 input.list.title='Changed';input.swimlanes[0].title='Changed';input.createdAt.setTime(42);
 const creation={kind:'create',cardId:'card',before:null,after:card};
 assert.throws(()=>planner({...creation,after:{...card,swimlaneId:'unknown'}},context));
 const plan=planner(creation,context);
 assert.equal(plan.activities.activity.listName,'List');assert.equal(plan.activities.activity.swimlaneName,'Lane');
 assert.equal(plan.activities.activity.createdAt.getTime(),0);
 assert.deepEqual(plan.history.rows,[]);assert.equal(validateSyncEffects(plan,creation,effectId),true);
 for(const lanes of [[options.swimlanes[0],options.swimlanes[0]],[{...options.swimlanes[0],boardId:'other'}]]){
  assert.throws(()=>createSyncEffectPlanner({...options,swimlanes:lanes}));
 }
 const first=planner(step,context);
 assert.throws(()=>planner({...creation,after:{...card,swimlaneId:'unknown'}},{...context,index:1}));
 const next=planner(step,{...context,index:1});
 assert.equal(next.history.rows[0].previousHash,first.history.rows[0].integrityHash);
});
test('all effects and required adapters validate before any History or activity write',async()=>{
 const plan=createSyncEffectPlanner(options)(step,context);
 for(const damage of [p=>p.activities.rows[0].activity.value='Forged',p=>p.version=2,p=>p.activities.context.userId='other']){
  const bad=structuredClone(plan);damage(bad);let writes=0;
  const store={findOneAsync:async()=>null,insertAsync:async()=>{writes++;},updateAsync:async()=>{writes++;}};
  await assert.rejects(persistSyncEffects({history:store,activities:store,plan:bad,step,effectId,assertCurrent:async()=>{},completeDelivery:async()=>effectId}));
  assert.equal(writes,0);
 }
 let reads=0;
 const store={findOneAsync:async()=>{reads++;},insertAsync:async()=>{},updateAsync:async()=>{}};
 await assert.rejects(persistSyncEffects({history:store,activities:store,plan,step,effectId,assertCurrent:async()=>{}}),/sync-effects-invalid/);
 assert.equal(reads,0);
});

test('individually valid plans cannot mix different actors or event times',()=>{
 const {prepareSyncUpdateActivities}=require('../server/lib/syncUpdateActivities');
 const plan=createSyncEffectPlanner(options)(step,context);
 for(const override of [{userId:'different'},{createdAt:new Date(100)}]){
  const activities=prepareSyncUpdateActivities({...options,...override,step,effectId});
  assert.throws(()=>validateSyncEffects({...plan,activities},step,effectId),/sync-effects-invalid/);
 }
});
