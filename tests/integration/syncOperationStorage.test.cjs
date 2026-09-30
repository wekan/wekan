'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {MongoClient,ObjectId}=require('mongodb');const {randomUUID}=require('node:crypto');
const {withSyncLease}=require('../../server/lib/syncLease');
const {syncSourceKey}=require('../../models/lib/listSyncSourceIdentity');
const {createSyncEffectPlanner,validateSyncEffects,applySyncEffectsStep}=require('../../server/lib/syncEffects');
const {syncOperationEffectId}=require('../../server/lib/syncOperationApply');
const uri=process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('registered private storage retains recovery evidence and refuses recreated/deleted/reconfigured list scopes',{skip:!uri},async t=>{
 const client=await new MongoClient(uri).connect(),db=client.db(`sync_storage_${new ObjectId().toHexString()}`);
 t.after(async()=>{await db.dropDatabase();await client.close();});
 const startup=[],collections=new Map();
 const context={Meteor:{startup:fn=>startup.push(fn)},Mongo:{Collection:function(name){
  const raw=db.collection(name);this.rawCollection=()=>raw;this.deny=rules=>{this.rules=rules;};collections.set(name,this);
 }},Lists:{findOneAsync:q=>db.collection('lists').findOne(q)},Boards:{findOneAsync:q=>db.collection('boards').findOne(q)},
 ensureIndex:(c,keys,options)=>c.rawCollection().createIndex(keys,options),
 withListSyncLease:(id,work)=>withSyncLease(db.collection('leases'),id,work),
 require:p=>require(path.resolve(__dirname,'../..',p.slice(1)))};
 const sourceFile=fs.readFileSync(path.resolve(__dirname,'../../server/lib/listSyncOperations.js'),'utf8');
 vm.runInNewContext(sourceFile.replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function'),context);
 for(const fn of startup)await fn();
 for(const c of collections.values()){
  assert.ok(c.rules.insert());assert.ok(c.rules.update());assert.ok(c.rules.remove());
  const indexes=await c.rawCollection().listIndexes().toArray();assert.ok(indexes.every(index=>index.expireAfterSeconds===undefined));
 }
 const source={type:'jira',url:'https://example.org',projectKey:'P'};
 const list={_id:'list',boardId:'board',syncCredentialIncarnation:'life',syncRevision:'revision',syncSource:source};
 await db.collection('lists').insertOne(list);await db.collection('boards').insertOne({_id:'board'});
 const scope={listId:'list',boardId:'board',incarnation:'life',revision:'revision',sourceKey:syncSourceKey(source)};
 let builds=0,applied=0,interrupted=true;
 const policy={activities:true,notifications:true};
 const planner=createSyncEffectPlanner({policy,userId:'author',username:'name',createdAt:new Date(1000),
  list:{...list,title:'List'},swimlanes:[{_id:'lane',boardId:'board',title:'Lane'}]});
 const events=db.collection('history'),activities=db.collection('activities'),deliveries=db.collection('deliveries');
 const options={scope,actorId:'author',intentId:randomUUID(),
  assertAccess:async current=>{assert.equal(current.userId,'author');return true;},
  build:async context=>{assert.equal(context.userId,'author');builds++;return [{kind:'create',cardId:'card',before:null,
   after:{_id:'card',boardId:'board',listId:'list',swimlaneId:'lane',title:'Saved'}}];},
  prepareEffects:planner,validateEffects:(effects,step,c)=>validateSyncEffects(effects,step,syncOperationEffectId(c.operationId,c.index)),
  apply:async(step,context)=>{
   assert.equal(context.userId,'author');if(interrupted)throw new Error('interrupted');applied++;
   return applySyncEffectsStep({cards:db.collection('cards'),step,...context,readPolicy:async()=>policy,
    history:{admitHistoryWriter:({work})=>work({mode:'legacy',assertCurrent:async()=>{}}),appendSyncHistoryRow:async function({row}){if(await this.findOneAsync(row._id))return row._id;const saved={...row,previousHash:null};saved.integrityHash=require('../../models/lib/changeHistoryIntegrity').hashHistoryRow(saved);await this.insertAsync(saved);return row._id;},findOneAsync:q=>events.findOne(typeof q==='string'?{_id:q}:q),insertAsync:r=>events.insertOne(r),updateAsync:(...a)=>events.updateOne(...a)},
    activities:{findOneAsync:id=>activities.findOne({_id:id}),insertAsync:r=>activities.insertOne(r)},
    completeDelivery:async({effectId})=>{
     await deliveries.updateOne({_id:effectId},{$setOnInsert:{done:true}},{upsert:true});
     return (await deliveries.findOne({_id:effectId}))._id;
    }});
  }};
 const run=overrides=>context.runStoredListSyncOperation({...options,...overrides});
 await assert.rejects(run({scope:{...scope,listId:{$ne:null}}}),/invalid.*scope/);
 assert.equal(await db.collection('leases').countDocuments({}),0);
 await assert.rejects(run(),/interrupted/);assert.equal(builds,1);
 const operations=db.collection('listSyncOperations'),steps=db.collection('listSyncOperationSteps'),completions=db.collection('listSyncOperationCompletions');
 assert.equal(await steps.countDocuments({}),1);
 const intents=db.collection('listSyncOperationIntents');
 assert.equal((await intents.findOne({_id:options.intentId})).actorId,'author');
 await assert.rejects(run({actorId:'other',assertAccess:async()=>true}),/intent-conflict/);
 const step=await steps.findOne({index:0});
 await assert.rejects(steps.insertOne({...step,_id:'duplicate'}),error=>error.code===11000);
 for(const change of [{syncCredentialIncarnation:'new-life'},{syncRevision:'new-revision'},{boardId:'other'},
  {syncSource:{...source,projectKey:'OTHER'}}]){
  await db.collection('lists').replaceOne({_id:'list'},{...list,...change});
  await assert.rejects(run(),/scope-changed/);assert.equal(applied,0);assert.equal(builds,1);
 }
 await db.collection('lists').deleteOne({_id:'list'});await assert.rejects(run(),/scope-changed/);
 assert.equal(await operations.countDocuments({}),1);assert.equal(await steps.countDocuments({}),1);
 await db.collection('lists').insertOne(list);
 await db.collection('boards').deleteOne({_id:'board'});await assert.rejects(run(),/scope-changed/);
 await db.collection('boards').insertOne({_id:'board'});
 await assert.rejects(run({assertAccess:async()=>false}),/access-denied/);
 interrupted=false;assert.equal((await run()).total,1);await run();
 assert.equal(applied,1);assert.equal(builds,1);assert.equal(await completions.countDocuments({}),1);
 await assert.rejects(run({actorId:'other',assertAccess:async()=>true}),/intent-conflict/);
 const savedIntent=await intents.findOne({_id:options.intentId});await intents.deleteOne({_id:options.intentId});
 await assert.rejects(run({actorId:'other',assertAccess:async()=>true}),/intent-missing/);
 await intents.insertOne(savedIntent);
 assert.equal(await steps.countDocuments({}),0);assert.equal(await operations.countDocuments({}),0);
 assert.equal(await db.collection('cards').countDocuments({}),1);
 assert.equal(await activities.countDocuments({}),1);assert.equal(await deliveries.countDocuments({}),1);
 assert.equal(await events.countDocuments({}),0);
 await db.collection('lists').replaceOne({_id:'list'},{...list,syncCredentialIncarnation:'new-life'});
 await assert.rejects(run(),/scope-changed/);assert.equal(await completions.countDocuments({}),1);
});
