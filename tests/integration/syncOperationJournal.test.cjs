'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {MongoClient,ObjectId}=require('mongodb');
const {randomUUID}=require('node:crypto');
const {prepareSyncOperationMutation}=require('../../server/lib/syncOperationMutation');
const {runSyncOperation}=require('../../server/lib/syncOperationJournal');
const {withSyncLease}=require('../../server/lib/syncLease');
const {syncTextSelector}=require('../../models/lib/listSyncTextMerge');
const {exactFieldSelector}=require('../../models/lib/exactFieldSelector');
const uri=process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('durable Sync journal resumes verified units without rebuilding or repeating committed effects', {skip:!uri}, async t=>{
 const client=await new MongoClient(uri).connect();const db=client.db(`sync_operation_${new ObjectId().toHexString()}`);
 const operations=db.collection('operations'),steps=db.collection('steps'),cards=db.collection('cards'),leases=db.collection('leases'),completions=db.collection('completions');
 t.after(async()=>{await db.dropDatabase();await client.close();});
 const wrap=(collection,overrides)=>({
  findOne:(...args)=>collection.findOne(...args),insertOne:(...args)=>collection.insertOne(...args),
  updateOne:(...args)=>collection.updateOne(...args),deleteOne:(...args)=>collection.deleteOne(...args),
  deleteMany:(...args)=>collection.deleteMany(...args),...overrides,
 });
 const scope={listId:'list',boardId:'board',incarnation:'life',revision:'revision',sourceKey:'source-hash'};
 const make=(id,title)=>({kind:'create',cardId:id,before:null,after:{_id:id,boardId:'board',listId:'list',title,dateLastActivity:new Date('2026-01-01T00:00:00Z')}});
 const plan=[make('one','First'),make('two','Second')];
 let builds=0,effects=0;
 const build=async()=>{builds++;return plan;};
 const apply=async step=>{
  const mutation=prepareSyncOperationMutation(step);
  if(await cards.findOne(mutation.afterSelector))return 'already-applied';
  if(mutation.kind==='create'){
   if(await cards.findOne({_id:step.cardId}))throw new Error('local state changed');
   await cards.insertOne(mutation.document);
  }
  else {
   const changed=await cards.updateOne(mutation.beforeSelector,mutation.modifier);
   if(changed.matchedCount!==1)throw new Error('local state changed');
  }
  assert.ok(await cards.findOne(mutation.afterSelector),'stored result must be verified');
  effects++;return 'applied';
 };
 const run=async(options={})=>{
  const pending=await operations.findOne({_id:'list'});
  const intentId=options.intentId||pending?.intentId||randomUUID();
  return withSyncLease(leases,'list',({assertCurrent})=>runSyncOperation({operations,steps,completions,intentId,scope,build,apply,assertCurrent,...options}));
 };
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
 await t.test('zero or partial plan deletion retains the completed checkpoint',async()=>{
  for(const partial of [false,true]){
   await cards.deleteMany({});effects=0;let deletes=0;
   const incomplete=wrap(steps,{deleteMany:async query=>{
    if(++deletes===1)return steps.deleteMany(query);
    return partial?steps.deleteOne(query):{acknowledged:true,deletedCount:0};
   }});
   await assert.rejects(run({steps:incomplete}),/cleanup-unconfirmed/);
   assert.equal((await operations.findOne({_id:'list'})).state,'cleaning');
   assert.equal(await steps.countDocuments({}),partial?1:2);assert.equal(effects,2);
   await run({apply:async()=>assert.fail('cleanup reapplied cards'),build:async()=>assert.fail('cleanup rebuilt')});
   assert.equal(await operations.countDocuments({}),0);assert.equal(await steps.countDocuments({}),0);
  }
 });
 await t.test('cleanup read failures retain a marker even after the plan rows were deleted',async()=>{
  await cards.deleteMany({});effects=0;
  const unreadable=wrap(steps,{findOne:async(query,options)=>{
   if(options?.projection)throw new Error('cleanup read failed');
   return steps.findOne(query,options);
  }});
  await assert.rejects(run({steps:unreadable}),/cleanup read failed/);
  assert.equal(await steps.countDocuments({}),0);
  assert.equal((await operations.findOne({_id:'list'})).state,'cleaning');
  await run({apply:async()=>assert.fail('read failure replayed cards')});assert.equal(effects,2);
 });
 await t.test('an undefined cleanup read is not proof of absence',async()=>{
  await cards.deleteMany({});effects=0;
  const invalid=wrap(steps,{findOne:async(query,options)=>options?.projection?undefined:steps.findOne(query,options)});
  await assert.rejects(run({steps:invalid}),/cleanup-unconfirmed/);
  assert.equal((await operations.findOne({_id:'list'})).state,'cleaning');
  await run({apply:async()=>assert.fail('invalid-read recovery reapplied cards')});assert.equal(effects,2);
 });
 await t.test('zero-match marker deletion cannot report completed cleanup',async()=>{
  await cards.deleteMany({});effects=0;
  const unchanged=wrap(operations,{deleteOne:async()=>({acknowledged:true,deletedCount:0})});
  await assert.rejects(run({operations:unchanged}),/cleanup-unconfirmed/);
  assert.equal((await operations.findOne({_id:'list'})).state,'cleaning');
  assert.equal(await steps.countDocuments({}),0);
  await run({apply:async()=>assert.fail('marker cleanup reapplied cards')});assert.equal(effects,2);
 });
 await t.test('lost deletion acknowledgements succeed only after verifying absence',async()=>{
  for(const target of ['steps','operations']){
   await cards.deleteMany({});effects=0;let deletes=0;
   const options=target==='steps'?{steps:wrap(steps,{deleteMany:async query=>{
    const result=await steps.deleteMany(query);
    if(++deletes===2)throw new Error('plan delete ack lost');return result;
   }})}:{operations:wrap(operations,{deleteOne:async query=>{
    await operations.deleteOne(query);throw new Error('marker delete ack lost');
   }})};
   const result=await run(options);assert.equal(result.total,2);assert.equal(effects,2);
   assert.equal(await steps.countDocuments({}),0);assert.equal(await operations.countDocuments({}),0);
  }
 });
 await t.test('losing journal ownership after deleting steps preserves the marker',async()=>{
  await cards.deleteMany({});effects=0;
  const replaced=wrap(steps,{findOne:async(query,options)=>{
   const row=await steps.findOne(query,options);
   if(options?.projection)await operations.updateOne({_id:'list'},{$set:{owner:'replacement'}});
   return row;
  }});
  await assert.rejects(run({steps:replaced}),/owner-changed/);
  assert.equal((await operations.findOne({_id:'list'})).owner,'replacement');
  assert.equal(await steps.countDocuments({}),0);
  await run({apply:async()=>assert.fail('owner-change recovery reapplied cards')});assert.equal(effects,2);
 });
 await t.test('an unreadable final outcome is not reported as successful cleanup',async()=>{
  await cards.deleteMany({});effects=0;let removed=false;
  const uncertain=wrap(operations,{
   deleteOne:async query=>{const result=await operations.deleteOne(query);removed=true;return result;},
   findOne:async(query,options)=>{
    if(removed&&options?.projection)throw new Error('final cleanup read failed');
    return operations.findOne(query,options);
   },
  });
  await assert.rejects(run({operations:uncertain}),/final cleanup read failed/);
  assert.equal(await operations.countDocuments({}),0);assert.equal(await steps.countDocuments({}),0);
  assert.equal(effects,2);
 });
 await t.test('cleanup never deletes or reports success over a successor operation',async()=>{
  await cards.deleteMany({});effects=0;
  const successor={_id:'list',operationId:'11111111-1111-4111-8111-111111111111',scope,state:'preparing',checkpoint:0,attempts:0};
  const raced=wrap(operations,{deleteOne:async query=>{
   const result=await operations.deleteOne(query);await operations.insertOne(successor);return result;
  }});
  await assert.rejects(run({operations:raced}),/cleanup-unconfirmed/);
  assert.deepEqual(await operations.findOne({_id:'list'}),successor);assert.equal(effects,2);
  await operations.deleteOne({_id:'list',operationId:successor.operationId});
 });
 await t.test('the same intent returns its completion after marker removal without rebuilding',async()=>{
  await cards.deleteMany({});effects=0;const intentId=randomUUID();
  const first=await run({intentId});const proof=await completions.findOne({_id:intentId});
  assert.equal(proof.operationId,first.operationId);assert.equal(proof.total,2);
  assert.ok(proof.appliedAt instanceof Date);assert.equal(effects,2);
  await cards.updateOne({_id:'one'},{$set:{title:'Later local work'}});
  const retry=await run({intentId,build:async()=>assert.fail('completed intent rebuilt'),apply:async()=>assert.fail('completed intent applied')});
  assert.deepEqual(retry,first);assert.equal((await cards.findOne({_id:'one'})).title,'Later local work');
  assert.deepEqual(await completions.findOne({_id:intentId}),proof);
  await assert.rejects(run({intentId,scope:{...scope,revision:'different'}}),/completion-scope-changed/);
 });
 await t.test('empty plans retain completion without rebuilding on retry',async()=>{
  const intentId=randomUUID();let built=0;
  const first=await run({intentId,build:async()=>{built++;return [];},apply:async()=>assert.fail('empty plan applied')});
  assert.equal(first.total,0);assert.equal(built,1);
  const retry=await run({intentId,build:async()=>assert.fail('empty intent rebuilt')});
  assert.deepEqual(retry,first);assert.equal((await completions.findOne({_id:intentId})).total,0);
 });
 await t.test('a new intent cannot take over a pending operation',async()=>{
  await cards.deleteMany({});const intentId=randomUUID();
  await assert.rejects(run({intentId,apply:async()=>{throw new Error('pending intent');}}),/pending intent/);
  const pending=await operations.findOne({_id:'list'});
  await assert.rejects(run({intentId:randomUUID()}),/intent-pending/);
  assert.deepEqual(await operations.findOne({_id:'list'}),pending);
  await run({intentId});
 });
 await t.test('failed completion persistence retains applied plans and never repeats their units',async()=>{
  await cards.deleteMany({});effects=0;const intentId=randomUUID();
  const unavailable=wrap(completions,{insertOne:async()=>{throw new Error('completion insert failed');}});
  await assert.rejects(run({intentId,completions:unavailable}),/completion insert failed/);
  assert.equal((await operations.findOne({_id:'list'})).state,'completed');
  assert.equal(await steps.countDocuments({}),2);assert.equal(effects,2);
  await run({intentId,apply:async()=>assert.fail('completion retry applied cards')});
  assert.ok(await completions.findOne({_id:intentId}));assert.equal(effects,2);
 });
 await t.test('completion insertion requires readable persisted proof before cleanup',async()=>{
  for(const failure of ['not-inserted','read-failed']){
   await cards.deleteMany({});effects=0;const intentId=randomUUID();let inserted=false;
   const uncertain=wrap(completions,{
    insertOne:async row=>{
     if(failure==='not-inserted')return {acknowledged:true,insertedId:row._id};
     const result=await completions.insertOne(row);inserted=true;return result;
    },
    findOne:async query=>{if(inserted)throw new Error('completion read failed');return completions.findOne(query);},
   });
   await assert.rejects(run({intentId,completions:uncertain}),failure==='not-inserted'?/completion-unconfirmed/:/completion read failed/);
   assert.equal((await operations.findOne({_id:'list'})).state,'completed');
   assert.equal(await steps.countDocuments({}),2);assert.equal(effects,2);
   await run({intentId,apply:async()=>assert.fail('completion verification retry applied cards')});
   assert.ok(await completions.findOne({_id:intentId}));assert.equal(effects,2);
  }
 });
 await t.test('lost completion insertion acknowledgements use the exact immutable saved proof',async()=>{
  await cards.deleteMany({});effects=0;const intentId=randomUUID();
  const lost=wrap(completions,{insertOne:async row=>{await completions.insertOne(row);throw new Error('completion ack lost');}});
  const result=await run({intentId,completions:lost});assert.equal(effects,2);
  assert.equal((await completions.findOne({_id:intentId})).operationId,result.operationId);
  assert.equal(await operations.countDocuments({}),0);
 });
 await t.test('receipt recovery closes an unknown cleanup outcome while preserving a newer operation',async()=>{
  await cards.deleteMany({});effects=0;const intentId=randomUUID();let removed=false;
  const uncertain=wrap(operations,{
   deleteOne:async query=>{const result=await operations.deleteOne(query);removed=true;return result;},
   findOne:async(query,options)=>{if(removed&&options?.projection)throw new Error('receipt final read failed');return operations.findOne(query,options);},
  });
  await assert.rejects(run({intentId,operations:uncertain}),/receipt final read failed/);
  const proof=await completions.findOne({_id:intentId});assert.ok(proof);
  const successor={_id:'list',intentId:randomUUID(),operationId:randomUUID(),scope,state:'preparing',checkpoint:0,attempts:0};
  await operations.insertOne(successor);
  const result=await run({intentId,build:async()=>assert.fail('receipt recovery rebuilt'),apply:async()=>assert.fail('receipt recovery applied')});
  assert.equal(result.operationId,proof.operationId);assert.equal(effects,2);
  assert.deepEqual(await operations.findOne({_id:'list'}),successor);
  await operations.deleteOne({_id:'list',operationId:successor.operationId});
 });
 await t.test('a conflicting completion cannot erase pending recovery evidence',async()=>{
  await cards.deleteMany({});effects=0;const intentId=randomUUID();
  const denied=wrap(completions,{insertOne:async()=>{throw new Error('hold completion');}});
  await assert.rejects(run({intentId,completions:denied}),/hold completion/);
  const pending=await operations.findOne({_id:'list'});
  const conflict={_id:intentId,version:1,operationId:pending.operationId,scope,total:1,
   planChecksum:pending.planChecksum,appliedAt:pending.completedAt};
  await completions.insertOne(conflict);
  await assert.rejects(run({intentId}),/completion-conflict/);
  assert.deepEqual(await operations.findOne({_id:'list'}),pending);assert.equal(await steps.countDocuments({}),2);
  await completions.deleteOne({_id:intentId});await run({intentId});assert.equal(effects,2);
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
  const times={originalEstimateMapping:JSON.stringify(['original','original','hours']),
   remainingEstimateMapping:JSON.stringify(['remaining','remaining','hours'])};
  const before={_id:'estimate',boardId:'board',listId:'list',customFields:[
   {_id:'date',value:new Date('2026-01-01T00:00:00Z')},{_id:'points',value:2},{_id:'original',value:3},{_id:'remaining',value:1},
   {_id:'flag',value:false},{_id:'choices',value:['a','b']},{_id:'empty'}],
   syncLastSource:{estimate:2,estimateMapping:mapping,...times,originalEstimate:3,remainingEstimate:1}};
  const after={...before,customFields:before.customFields.map(field=>['points','original','remaining'].includes(field._id)?{...field,value:0}:field),
   syncLastSource:{estimate:0,estimateMapping:mapping,...times,originalEstimate:0,remainingEstimate:0}};
  await cards.insertOne(before);
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'estimate',before,after}],
   apply:async step=>{await apply(step);throw new Error('estimate ack lost');}}),/estimate ack lost/);
  assert.equal((await operations.findOne({_id:'list'})).checkpoint,0);
  const stored=await steps.findOne({index:0});
  assert.ok(stored.step.before.customFields[0].value instanceof Date);
  assert.equal(stored.step.after.syncLastSource.estimateMapping,mapping);
  await run({build:async()=>assert.fail('mapped plan rebuilt')});
  assert.equal(effects,1);assert.deepEqual(await cards.findOne({_id:'estimate'}),after);
  const cleared={...after,customFields:after.customFields.filter(field=>!['points','original','remaining'].includes(field._id)),
   syncLastSource:{estimate:null,estimateMapping:mapping,...times,originalEstimate:null,remainingEstimate:null}};
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'estimate',before:after,after:cleared}],
   apply:async step=>{await apply(step);throw new Error('clear ack lost');}}),/clear ack lost/);
  await run({build:async()=>assert.fail('clear plan rebuilt')});
  assert.equal(effects,2);assert.deepEqual(await cards.findOne({_id:'estimate'}),cleared);
 });
 await t.test('estimate creation and absent/null custom-field snapshots survive persisted replay',async()=>{
  const mapping=JSON.stringify(['points','customfield_100','points']);
  const times={originalEstimateMapping:JSON.stringify(['original','original','hours']),
   remainingEstimateMapping:JSON.stringify(['remaining','remaining','hours'])};
  for(const state of ['create','missing','null']){
   await cards.deleteMany({});effects=0;
   const before=state==='create'?null:{_id:'estimate',boardId:'board',listId:'list',...(state==='null'?{customFields:null}:{})};
   const after={_id:'estimate',boardId:'board',listId:'list',customFields:[{_id:'points',value:0},{_id:'original',value:0},{_id:'remaining',value:0}],
    syncLastSource:{estimate:0,estimateMapping:mapping,...times,originalEstimate:0,remainingEstimate:0}};
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
  const mapping=JSON.stringify(['points','remaining','hours']);
  const before={_id:'estimate',boardId:'board',listId:'list',customFields:[{_id:'points',value:2},{_id:'text',value:'Keep'}],
   syncLastSource:{remainingEstimate:2,remainingEstimateMapping:mapping}};
  const after={...before,customFields:[{_id:'points',value:3},{_id:'text',value:'Keep'}],
   syncLastSource:{remainingEstimate:3,remainingEstimateMapping:mapping}};
  await cards.insertOne(before);
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'estimate',before,after}],
   apply:async()=>{throw new Error('pause estimate');}}),/pause estimate/);
  const saved=await steps.findOne({index:0});
  await steps.updateOne({_id:saved._id},{$set:{'step.after.syncLastSource.remainingEstimateMapping':JSON.stringify(['points','original','hours'])}});
  await assert.rejects(run(),/invalid-sync-operation-estimate-mapping/);assert.equal(effects,0);
  await steps.replaceOne({_id:saved._id},saved);
  await steps.updateOne({_id:saved._id},{$set:{'step.after.syncLastSource.remainingEstimate':4}});
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
 await t.test('conditional patches preserve fields outside the plan across replay',async()=>{
  await cards.deleteMany({});effects=0;
  const before={_id:'partial',boardId:'board',listId:'list',title:'Before',description:null};
  const after={_id:'partial',boardId:'board',listId:'list',title:'After',spentTime:0};
  await cards.insertOne({...before,labels:['local'],members:['member'],dueComplete:true});
  await assert.rejects(run({build:async()=>[{kind:'update',cardId:'partial',before,after}],
   apply:async step=>{await apply(step);throw new Error('patch ack lost');}}),/patch ack lost/);
  await cards.updateOne({_id:'partial'},{$set:{labels:['new local label']}});
  await run({build:async()=>assert.fail('partial plan rebuilt')});assert.equal(effects,1);
  assert.deepEqual(await cards.findOne({_id:'partial'}),{...after,labels:['new local label'],members:['member'],dueComplete:true});
 });
 await t.test('added fields in a plan must still be absent before the conditional write',async()=>{
  await cards.deleteMany({});
  const before={_id:'added',boardId:'board',listId:'list',title:'Before'};
  const after={...before,spentTime:0};
  const mutation=prepareSyncOperationMutation({kind:'update',cardId:'added',before,after});
  await cards.insertOne({...before,spentTime:null});
  assert.equal((await cards.updateOne(mutation.beforeSelector,mutation.modifier)).matchedCount,0);
  await cards.updateOne({_id:'added'},{$unset:{spentTime:''}});
  assert.equal((await cards.updateOne(mutation.beforeSelector,mutation.modifier)).matchedCount,1);
  assert.ok(await cards.findOne(mutation.afterSelector));
 });
 await t.test('literal object snapshot values never become query operators',async()=>{
  await cards.deleteMany({});
  const object={$ne:null};
  await cards.insertMany([{_id:'literal',baseline:object},{_id:'other',baseline:{title:'different'}}]);
  const literal=exactFieldSelector({baseline:object},['baseline']);
  assert.deepEqual((await cards.find(literal).toArray()).map(card=>card._id),['literal']);
  assert.equal(await cards.countDocuments({baseline:object}),2,'the former bare operand is a query operator');
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
