'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createSyncEffectPlanner, validateSyncEffects, persistSyncEffects } = require('../server/lib/syncEffects');
const { syncOperationEffectId } = require('../server/lib/syncOperationApply');
const card={_id:'card',boardId:'board',listId:'list',swimlaneId:'lane',title:'Before'};
const step={kind:'update',cardId:'card',before:card,after:{...card,title:'After'}};
const options={policy:{activities:true,notifications:true},userId:'user',username:'name',createdAt:new Date(0),
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
 for(const damage of [p=>p.activities.rows[0].activity.value='Forged',p=>p.version=3,p=>p.activities.context.userId='other']){
  const bad=structuredClone(plan);damage(bad);let writes=0;
  const store={admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;},findOneAsync:async()=>null,insertAsync:async()=>{writes++;},updateAsync:async()=>{writes++;}};
  await assert.rejects(persistSyncEffects({history:store,activities:store,plan:bad,step,effectId,assertCurrent:async()=>{},readPolicy:async()=>options.policy,completeDelivery:async()=>effectId}));
  assert.equal(writes,0);
 }
 let reads=0;
 const store={admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;},findOneAsync:async()=>{reads++;},insertAsync:async()=>{},updateAsync:async()=>{}};
 await assert.rejects(persistSyncEffects({history:store,activities:store,plan,step,effectId,assertCurrent:async()=>{},readPolicy:async()=>options.policy}),/sync-effects-invalid/);
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

test('captured feature policies preserve History while suppressing activities and never accept changed live flags',async()=>{
 const {syncEffectPolicy}=require('../server/lib/syncEffectPolicy');
 assert.deepEqual(syncEffectPolicy({disableActivities:true,disableNotifications:false}),{activities:false,notifications:true});
 assert.throws(()=>syncEffectPolicy({disableActivities:'false',disableNotifications:false}),/policy-invalid/);
 assert.throws(()=>createSyncEffectPlanner({...options,policy:undefined}),/policy-invalid/);
 for(const policy of [{activities:false,notifications:false},{activities:true,notifications:false}]){
  const input={...options,policy:{...policy}},planner=createSyncEffectPlanner(input);
  input.policy.activities=!policy.activities;
  const plan=planner(step,context);assert.deepEqual(plan.policy,policy);
  const histories=new Map(),activities=new Map(),delivered=[];
  const store=rows=>({admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;},findOneAsync:async id=>rows.get(id),insertAsync:async row=>rows.set(row._id,row),updateAsync:async()=>{}});
  const args={history:store(histories),plan,step,effectId,assertCurrent:async()=>{},readPolicy:async()=>policy,
   ...(policy.activities?{activities:store(activities),completeDelivery:async event=>{delivered.push(event.policy);return event.effectId;}}:{})};
  await assert.rejects(persistSyncEffects({...args,readPolicy:async()=>({...policy,notifications:true})}),/policy-changed/);
  assert.equal(histories.size,0);
  assert.equal(await persistSyncEffects(args),effectId);assert.equal(histories.size,1);
  assert.equal(activities.size,policy.activities?1:0);
  assert.deepEqual(delivered,policy.activities?[policy]:[]);
  if(!policy.activities){
   assert.equal(plan.activities,null);
   assert.throws(()=>validateSyncEffects({...plan,activities:{}},step,effectId));
  }
 }
});
test('old effect plans require live enabled defaults; they cannot silently adopt disabled settings',async()=>{
 const plan=createSyncEffectPlanner(options)(step,context);delete plan.policy;plan.version=1;
 assert.equal(validateSyncEffects(plan,step,effectId),true);
 let reads=0;const store={admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;},findOneAsync:async()=>{reads++;},insertAsync:async()=>{},updateAsync:async()=>{}};
 await assert.rejects(persistSyncEffects({history:store,activities:store,plan,step,effectId,assertCurrent:async()=>{},
  completeDelivery:async()=>effectId,readPolicy:async()=>({activities:false,notifications:false})}),/policy-changed/);
 assert.equal(reads,0);
});

test('the combined card adapter rejects incomplete delivery, foreign actors and stale policy before card access',async()=>{
 const {applySyncEffectsStep}=require('../server/lib/syncEffects');
 const effects=createSyncEffectPlanner(options)(step,context);
 for(const change of [{userId:'other'},{completeDelivery:undefined},
  {readPolicy:async()=>({activities:false,notifications:false})},
  {effects:{...effects,activities:null}}]){
  let accessed=0;
  const store={admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;},findOneAsync:async()=>null,insertAsync:async()=>{},updateAsync:async()=>{}};
  const cards={findOne:async()=>{accessed++;},insertOne:async()=>{accessed++;},updateOne:async()=>{accessed++;}};
  await assert.rejects(applySyncEffectsStep({cards,history:store,activities:store,step,effects,...context,userId:'user',
   assertCurrent:async()=>{},readPolicy:async()=>options.policy,completeDelivery:async()=>effectId,...change}));
  assert.equal(accessed,0);
 }
});
