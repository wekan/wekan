'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {MongoClient,ObjectId}=require('mongodb');
const {isDeepStrictEqual}=require('node:util');
const {runSyncOperation}=require('../../server/lib/syncOperationJournal');
const {withSyncLease}=require('../../server/lib/syncLease');
const {syncTextSelector}=require('../../models/lib/listSyncTextMerge');
const uri=process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('durable Sync journal resumes verified units without rebuilding or repeating committed effects', {skip:!uri}, async t=>{
 const client=await new MongoClient(uri).connect();const db=client.db(`sync_operation_${new ObjectId().toHexString()}`);
 const operations=db.collection('operations'),steps=db.collection('steps'),cards=db.collection('cards'),leases=db.collection('leases');
 t.after(async()=>{await db.dropDatabase();await client.close();});
 const scope={listId:'list',boardId:'board',incarnation:'life',revision:'revision',sourceKey:'source-hash'};
 const make=(id,title)=>({kind:'create',cardId:id,before:null,after:{_id:id,boardId:'board',listId:'list',title,dateLastActivity:new Date('2026-01-01T00:00:00Z')}});
 const plan=[make('one','First'),make('two','Second')];
 let builds=0,effects=0;
 const build=async()=>{builds++;return plan;};
 const apply=async step=>{
  const current=await cards.findOne({_id:step.cardId});
  if(isDeepStrictEqual(current,step.after))return 'already-applied';
  if(!isDeepStrictEqual(current,step.before))throw new Error('local state changed');
  if(step.kind==='create')await cards.insertOne(step.after);
  else { const changed=await cards.replaceOne(step.before,step.after);assert.equal(changed.modifiedCount,1); }
  effects++;return 'applied';
 };
 const run=(options={})=>withSyncLease(leases,'list',({assertCurrent})=>runSyncOperation({operations,steps,scope,build,apply,assertCurrent,...options}));
 await t.test('crash after side effect leaves the unit unacknowledged and skips it on resume',async()=>{
  await assert.rejects(run({apply:async step=>{await apply(step);throw new Error('lost card acknowledgement');}}),/lost card/);
  const pending=await operations.findOne({_id:'list'});assert.equal(pending.checkpoint,0);assert.equal(pending.state,'applying');
  assert.equal(await steps.countDocuments({}),2);assert.equal(effects,1);
  const result=await run({scope:{sourceKey:scope.sourceKey,revision:scope.revision,incarnation:scope.incarnation,boardId:scope.boardId,listId:scope.listId}});assert.equal(result.total,2);assert.equal(builds,1);assert.equal(effects,2);
  assert.equal(await operations.countDocuments({}),0);assert.equal(await steps.countDocuments({}),0);
 });
 await t.test('acknowledged units remain skipped and the exact original plan resumes',async()=>{
  await cards.deleteMany({});effects=0;builds=0;
  await assert.rejects(run({apply:async(step,ctx)=>{if(ctx.index===1)throw new Error('stop');return apply(step);}}),/stop/);
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,1);
  await run({build:async()=>assert.fail('resume rebuilt the plan')});assert.equal(effects,2);
 });
 await t.test('a local edit blocks replay without losing the plan',async()=>{
  await cards.deleteMany({});
  await assert.rejects(run({apply:async()=>{throw new Error('stop');}}),/stop/);
  await cards.insertOne({...plan[0].after,title:'Local edit'});
  await assert.rejects(run(),/local state changed/);
  assert.equal((await cards.findOne({_id:'one'})).title,'Local edit');
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,0);
  await assert.rejects(run({scope:{...scope,revision:'new'}}),/scope-changed/);
  assert.equal(await steps.countDocuments({}),2);
  await cards.deleteMany({});await run();
 });
 await t.test('incomplete preparation rebuilds before any side effect',async()=>{
  await cards.deleteMany({});effects=0;
  let inserts=0;
  const interrupted={deleteMany:q=>steps.deleteMany(q),insertOne:async row=>{if(++inserts===2)throw new Error('preparation stopped');return steps.insertOne(row);}};
  await assert.rejects(run({steps:interrupted}),/preparation stopped/);assert.equal(effects,0);
  assert.equal((await operations.findOne({_id:'list'})).state,'preparing');
  await run();assert.equal(effects,2);
 });
 await t.test('damaged or incomplete plans fail before any application writes',async()=>{
  await cards.deleteMany({});effects=0;
  await assert.rejects(run({apply:async()=>{throw new Error('stop');}}),/stop/);
  const row=await steps.findOne({index:1});
  await steps.updateOne({_id:row._id},{$set:{'step.after.title':'Tampered'}});
  await assert.rejects(run(),/plan-damaged/);assert.equal(effects,0);
  await steps.replaceOne({_id:row._id},row);
  await run();assert.equal(effects,2);
 });
 await t.test('lost journal ownership prevents a delayed checkpoint acknowledgement',async()=>{
  await cards.deleteMany({});effects=0;
  await assert.rejects(run({apply:async step=>{
   const result=await apply(step);await operations.updateOne({_id:'list'},{$set:{owner:'replacement'}});return result;
  }}),/owner-changed/);
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,0);
  await run();assert.equal(effects,2);
 });
 await t.test('interrupted cleanup retains the completed marker and never reapplies units',async()=>{
  await cards.deleteMany({});effects=0;let deletes=0;
  const failing={findOne:q=>steps.findOne(q),insertOne:row=>steps.insertOne(row),deleteMany:async q=>{
   if(++deletes===2)throw new Error('cleanup stopped');return steps.deleteMany(q);
  }};
  await assert.rejects(run({steps:failing}),/cleanup stopped/);
  assert.equal((await operations.findOne({_id:'list'})).state,'cleaning');assert.equal(effects,2);
  await run({apply:async()=>assert.fail('cleanup applied a unit'),build:async()=>assert.fail('cleanup rebuilt')});
  assert.equal(await operations.countDocuments({}),0);assert.equal(await steps.countDocuments({}),0);
 });
 await t.test('the application selector refuses a local field deletion after a null snapshot',async()=>{
  await cards.deleteMany({});
  const before={_id:'nullable',boardId:'board',listId:'list',title:'Title',description:null};
  await cards.insertOne(before);
  assert.equal((await cards.updateOne(syncTextSelector(before,'board','list'),{$set:{title:'Confirmed'}})).modifiedCount,1);
  before.title='Confirmed';
  await cards.updateOne({_id:'nullable'},{$unset:{description:''}});
  assert.equal((await cards.updateOne(syncTextSelector(before,'board','list'),{$set:{title:'Stale'}})).matchedCount,0);
  assert.equal((await cards.findOne({_id:'nullable'})).title,'Confirmed');
  delete before.description;
  assert.equal((await cards.updateOne(syncTextSelector(before,'board','list'),{$set:{description:'New'}})).modifiedCount,1);
 });
 await t.test('updates and archives retain BSON dates and distinguish null from missing snapshots',async()=>{
  await cards.deleteMany({});effects=0;
  const before={_id:'edit',boardId:'board',listId:'list',title:'Original',description:null,archived:false};
  const after={...before,title:'Updated',description:'',syncLastSource:{title:'Updated',description:''}};
  const parent={_id:'archive',boardId:'board',listId:'list',title:'Parent',archived:false};
  await cards.insertMany([before,parent]);
  const updates=[{kind:'update',cardId:'edit',before,after},
   {kind:'archive',cardId:'archive',before:parent,after:{...parent,archived:true,archivedAt:new Date('2026-01-02T00:00:00Z')}}];
  await assert.rejects(run({build:async()=>updates,apply:async step=>{await apply(step);throw new Error('ack lost');}}),/ack lost/);
  await run({build:async()=>assert.fail('must use saved updates')});assert.equal(effects,2);
  assert.equal((await cards.findOne({_id:'edit'})).description,'');
  assert.ok((await cards.findOne({_id:'archive'})).archivedAt instanceof Date);
 });
 await t.test('mapped estimates resume after a lost acknowledgement with unrelated typed fields intact',async()=>{
  await cards.deleteMany({});effects=0;
  const mapping=JSON.stringify(['points','customfield_100','points']);
  const before={_id:'estimate',boardId:'board',listId:'list',customFields:[
   {_id:'date',value:new Date('2026-01-01T00:00:00Z')},{_id:'points',value:2},
   {_id:'flag',value:false},{_id:'choices',value:['a','b']},{_id:'empty'}],
   syncLastSource:{estimate:2,estimateMapping:mapping}};
  const after={...before,customFields:before.customFields.map(field=>field._id==='points'?{...field,value:0}:field),
   syncLastSource:{estimate:0,estimateMapping:mapping}};
  await cards.insertOne(before);
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'estimate',before,after}],
   apply:async step=>{await apply(step);throw new Error('estimate ack lost');}}),/estimate ack lost/);
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,0);
  const stored=await steps.findOne({index:0});
  assert.ok(stored.step.before.customFields[0].value instanceof Date);
  assert.equal(stored.step.after.syncLastSource.estimateMapping,mapping);
  await run({build:async()=>assert.fail('mapped plan rebuilt')});
  assert.equal(effects,1);assert.deepEqual(await cards.findOne({_id:'estimate'}),after);
  const cleared={...after,customFields:after.customFields.filter(field=>field._id!=='points'),
   syncLastSource:{estimate:null,estimateMapping:mapping}};
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'estimate',before:after,after:cleared}],
   apply:async step=>{await apply(step);throw new Error('clear ack lost');}}),/clear ack lost/);
  await run({build:async()=>assert.fail('clear plan rebuilt')});
  assert.equal(effects,2);assert.deepEqual(await cards.findOne({_id:'estimate'}),cleared);
 });
 await t.test('estimate creation and absent/null custom-field snapshots survive persisted replay',async()=>{
  const mapping=JSON.stringify(['points','customfield_100','points']);
  for(const state of ['create','missing','null']){
   await cards.deleteMany({});effects=0;
   const before=state==='create'?null:{_id:'estimate',boardId:'board',listId:'list',...(state==='null'?{customFields:null}:{})};
   const after={_id:'estimate',boardId:'board',listId:'list',customFields:[{_id:'points',value:0}],
    syncLastSource:{estimate:0,estimateMapping:mapping}};
   if(before)await cards.insertOne(before);
   await assert.rejects(run({build:async()=>[{kind:state==='create'?'create':'update',cardId:'estimate',before,after}],
    apply:async()=>{throw new Error('before estimate write');}}),/before estimate write/);
   const saved=await steps.findOne({index:0});assert.deepEqual(saved.step.before,before);
   await run({build:async()=>assert.fail('persisted estimate rebuilt')});
   assert.equal(effects,1);assert.deepEqual(await cards.findOne({_id:'estimate'}),after);
  }
 });
 await t.test('local custom-field edits and damaged saved mappings retain recovery evidence',async()=>{
  await cards.deleteMany({});effects=0;
  const mapping=JSON.stringify(['points','customfield_100','points']);
  const before={_id:'estimate',boardId:'board',listId:'list',customFields:[{_id:'points',value:2},{_id:'text',value:'Keep'}],
   syncLastSource:{estimate:2,estimateMapping:mapping}};
  const after={...before,customFields:[{_id:'points',value:3},{_id:'text',value:'Keep'}],
   syncLastSource:{estimate:3,estimateMapping:mapping}};
  await cards.insertOne(before);
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'estimate',before,after}],
   apply:async()=>{throw new Error('pause estimate');}}),/pause estimate/);
  const saved=await steps.findOne({index:0});
  await steps.updateOne({_id:saved._id},{$set:{'step.after.syncLastSource.estimateMapping':JSON.stringify(['points','customfield_100','hours'])}});
  await assert.rejects(run(),/plan-damaged/);assert.equal(effects,0);
  await steps.replaceOne({_id:saved._id},saved);
  await cards.updateOne({_id:'estimate'},{$set:{'customFields.1.value':'Local edit'}});
  await assert.rejects(run(),/local state changed/);assert.equal(effects,0);
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,0);
  assert.equal(await steps.countDocuments({}),1);
  await cards.replaceOne({_id:'estimate'},before);
  await run({build:async()=>assert.fail('conflicting plan rebuilt')});
  assert.equal(effects,1);assert.deepEqual(await cards.findOne({_id:'estimate'}),after);
 });
 await t.test('a corrupt completed checkpoint cannot discard unapplied work',async()=>{
  await cards.deleteMany({});
  await assert.rejects(run({apply:async()=>{throw new Error('stop');}}),/stop/);
  await operations.updateOne({_id:'list'},{$set:{state:'completed'}});
  await assert.rejects(run(),/invalid-sync-operation-checkpoint/);assert.equal(await steps.countDocuments({}),2);
  await operations.updateOne({_id:'list'},{$set:{state:'applying'}});await run();
 });
 await t.test('unverified adapter returns cannot advance the checkpoint',async()=>{
  await cards.deleteMany({});
  await assert.rejects(run({apply:async()=>undefined}),/result-unverified/);
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,0);await run();
 });
});
