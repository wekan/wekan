'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { randomUUID } = require('node:crypto');
const { runSyncOperation } = require('../../server/lib/syncOperationJournal');
const { applySyncOperationStep, syncOperationEffectId } = require('../../server/lib/syncOperationApply');
const { createSyncEffectPlanner, validateSyncEffects, persistSyncEffects } = require('../../server/lib/syncEffects');
const { verifyHistoryRows } = require('../../models/lib/changeHistoryIntegrity');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('one journal replays creation, edits and archive with History and per-activity delivery receipts', {skip:!uri}, async t=>{
 const client=await new MongoClient(uri).connect(),db=client.db(`sync_activity_${new ObjectId().toHexString()}`);
 t.after(async()=>{await db.dropDatabase();await client.close();});
 const cards=db.collection('cards'),events=db.collection('history'),activities=db.collection('activities'),receipts=db.collection('receipts');
 const operations=db.collection('operations'),steps=db.collection('steps'),completions=db.collection('completions');
 const base={boardId:'board',listId:'list',swimlaneId:'lane',title:'Before',description:'Text'};
 const edit={...base,_id:'edit'},archive={...base,_id:'archive'};
 await cards.insertMany([edit,archive]);
 const plan=[{kind:'create',cardId:'new',before:null,after:{...base,_id:'new',title:'New'}},
  {kind:'update',cardId:'edit',before:edit,after:{...edit,title:'Changed',description:''}},
  {kind:'archive',cardId:'archive',before:archive,after:{...archive,archived:true}}];
 const context={userId:'author',username:'author-name',createdAt:new Date(1000),
  list:{_id:'list',boardId:'board',title:'List'},swimlane:{_id:'lane',boardId:'board',title:'Lane'}};
 const effectPlanner=createSyncEffectPlanner({...context,swimlanes:[context.swimlane]});
 const history={findOneAsync:q=>events.findOne(typeof q==='string'?{_id:q}:q),insertAsync:r=>events.insertOne(r),updateAsync:(...a)=>events.updateOne(...a)};
 const activityStore={findOneAsync:id=>activities.findOne({_id:id}),insertAsync:async row=>{await activities.insertOne(row);throw new Error('lost activity reply');}};
 let builds=0,interrupted=true;
 const args={operations,steps,completions,intentId:randomUUID(),assertCurrent:async()=>{},
  scope:{boardId:'board',listId:'list',incarnation:null,revision:null,sourceKey:'source'},build:async()=>{builds++;return plan;},
  prepareEffects:effectPlanner,
  validateEffects:(effects,step,c)=>validateSyncEffects(effects,step,syncOperationEffectId(c.operationId,c.index)),
  apply:(step,c)=>applySyncOperationStep({cards,step,...c,completeEffects:async({effectId,assertCurrent})=>{
   return persistSyncEffects({history,activities:activityStore,plan:c.effects,
    step,effectId,assertCurrent,completeDelivery:async({effectId,activity})=>{
     if(interrupted&&activity.activityType==='a-changedDescription')throw new Error('delivery interrupted');
     await receipts.updateOne({_id:effectId},{$setOnInsert:{activityId:activity._id}},{upsert:true});
     return (await receipts.findOne({_id:effectId}))._id;
    }});
  }}),
 };
 await assert.rejects(runSyncOperation(args),/delivery interrupted/);
 assert.equal((await operations.findOne({_id:'list'})).checkpoint,1);
 assert.equal(await receipts.countDocuments({}),2);assert.equal(await activities.countDocuments({}),3);
 assert.equal(await completions.countDocuments({}),0);
 const stored=await steps.findOne({index:2});
 await steps.updateOne({_id:stored._id},{$set:{'effects.activities.rows.0.activity.cardTitle':'Wrong'}});
 await assert.rejects(runSyncOperation(args),/activities-invalid/);
 assert.equal((await cards.findOne({_id:'archive'})).archived,undefined);
 await steps.replaceOne({_id:stored._id},stored);
 interrupted=false;assert.equal((await runSyncOperation(args)).total,3);await runSyncOperation(args);
 assert.equal(builds,1);assert.equal(await cards.countDocuments({}),3);
 assert.equal(await activities.countDocuments({}),4);assert.equal(await receipts.countDocuments({}),4);
 assert.equal(await events.countDocuments({}),3);assert.deepEqual(verifyHistoryRows(await events.find({}).toArray()),[]);
 assert.equal(await completions.countDocuments({}),1);assert.equal(await steps.countDocuments({}),0);
});
