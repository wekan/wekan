'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {randomUUID}=require('node:crypto');
const {ensureSyncOperationIntent,readSyncOperationIntent}=require('../server/lib/syncOperationIntent');
function fixture(){
 const rows=new Map();let inserts=0;
 const input={intentId:randomUUID(),actorId:'author',scope:{listId:'list',boardId:'board',incarnation:'life',revision:'revision',sourceKey:'source'},
  assertCurrent:async()=>{},operations:{findOne:async()=>null},completions:{findOne:async()=>null},now:()=>new Date(1000),
  intents:{findOne:async q=>rows.get(q._id),insertOne:async row=>{inserts++;rows.set(row._id,structuredClone(row));}}};
 return {input,rows,get inserts(){return inserts;}};
}
test('intent registration retains its original actor, scope and timestamp across lost replies and retries',async()=>{
 const f=fixture(),insert=f.input.intents.insertOne;
 f.input.intents.insertOne=async row=>{await insert(row);throw new Error('lost insert');};
 const saved=await ensureSyncOperationIntent(f.input);
 assert.equal(saved.actorId,'author');assert.equal(saved.createdAt.getTime(),1000);
 assert.deepEqual(await ensureSyncOperationIntent({...f.input,now:()=>new Date(5000)}),saved);assert.equal(f.inserts,1);
 for(const change of [{actorId:'other'},{scope:{...f.input.scope,revision:'new'}},{scope:{...f.input.scope,listId:'other'}}]){
  await assert.rejects(ensureSyncOperationIntent({...f.input,...change}),/intent-conflict/);
 }
 assert.equal(f.inserts,1);
});
test('false acknowledgements, missing historical intents and malformed records cannot authorize execution',async()=>{
 const f=fixture();f.input.intents.insertOne=async()=>{};await assert.rejects(ensureSyncOperationIntent(f.input),/intent-unconfirmed/);
 for(const collection of ['operations','completions']){
  const g=fixture();g.input[collection].findOne=async()=>({_id:'existing'});
  await assert.rejects(ensureSyncOperationIntent(g.input),/intent-missing/);assert.equal(g.inserts,0);
 }
 for(const change of [{createdAt:'date'},{extra:'unexpected'},{version:2},{actorId:'other'}]){
  const g=fixture();const saved=await ensureSyncOperationIntent(g.input);g.rows.set(saved._id,{...saved,...change});
  await assert.rejects(readSyncOperationIntent(g.input),/intent-unconfirmed|intent-conflict/);
 }
 for(const change of [{intentId:{$ne:null}},{actorId:''},{scope:{}}]){
  const g=fixture();await assert.rejects(ensureSyncOperationIntent({...g.input,...change}));assert.equal(g.inserts,0);
 }
});
test('lost access cannot complete intent registration even when its insert persisted',async()=>{
 const f=fixture();let checks=0;f.input.assertCurrent=async()=>{if(++checks===3)throw new Error('access revoked');};
 await assert.rejects(ensureSyncOperationIntent(f.input),/access revoked/);
 assert.equal(f.inserts,1);assert.equal(f.rows.size,1);
});
