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
  await assert.rejects(runSyncOperation({scope,intentId:'11111111-1111-4111-8111-111111111111',completions:{findOne:async()=>null,insertOne:async()=>assert.fail('unexpected completion')},assertCurrent:async()=>{},operations:{
   findOne:async()=>({_id:'list',scope,operationId,state:'cleaning',total:0,checkpoint:0}),
   updateOne:async()=>assert.fail('invalid identity reached mutation'),
  }}),/invalid-sync-operation-identity/);
 }
});

const mapping = JSON.stringify(['points', 'customfield_100', 'points']);
function estimateStep() {
 const before={_id:'card',boardId:'board',listId:'list',customFields:[
  {_id:'text',value:'Keep'}, {_id:'points',value:2}, {_id:'flag',value:false},
  {_id:'date',value:new Date('2026-01-02T00:00:00Z')}, {_id:'options',value:['one','two']}, {_id:'empty'}],
  syncLastSource:{estimate:2,estimateMapping:mapping}};
 return {kind:'update',cardId:'card',before,after:{...structuredClone(before),
  customFields:before.customFields.map(field=>field._id==='points'?{...field,value:0}:structuredClone(field)),
  syncLastSource:{estimate:0,estimateMapping:mapping}}};
}
test('mapped estimate plans preserve unrelated typed fields, order and explicit clears',()=>{
 const s=estimateStep();assert.doesNotThrow(()=>validateStep(s));
 s.after.customFields=s.after.customFields.filter(field=>field._id!=='points');
 s.after.syncLastSource.estimate=null;assert.doesNotThrow(()=>validateStep(s));
 // Accepting the source baseline while keeping a local value is legitimate.
 const local=estimateStep();local.after.customFields=structuredClone(local.before.customFields);
 assert.doesNotThrow(()=>validateStep(local));
 for(const customFields of [undefined,null,[]]){
  const creation={kind:'create',cardId:'card',before:null,after:{_id:'card',boardId:'board',listId:'list',
   customFields:[{_id:'points',value:0}],syncLastSource:{estimate:0,estimateMapping:mapping}}};
  if(customFields!==undefined)creation.before={_id:'card',boardId:'board',listId:'list',customFields};
  if(creation.before)creation.kind='update';
  assert.doesNotThrow(()=>validateStep(creation));
 }
});
test('estimate plans reject invalid mappings, field payloads and unrelated changes',()=>{
 for(const mutate of [
  s=>delete s.after.syncLastSource.estimateMapping,
  s=>s.after.syncLastSource.estimateMapping='not-json',
  s=>s.after.syncLastSource.estimateMapping=JSON.stringify(['points','customfield_100','']),
  s=>s.after.syncLastSource.estimateMapping=JSON.stringify(['points','token=secret','points']),
  s=>s.after.syncLastSource.estimateMapping=JSON.stringify(['points','customfield_100','points','extra']),
  s=>s.after.syncLastSource.estimate=-1,
  s=>s.before.syncLastSource.estimate='2',
  s=>s.after.syncLastSource.estimate=1e13,
  s=>s.after.customFields[1].value=Infinity,
  s=>s.after.customFields[1].value='0',
  s=>s.after.customFields[0].value='Changed',
  s=>s.after.customFields.reverse(),
  s=>s.after.customFields.push({_id:'new',value:'Injected'}),
  s=>s.after.customFields.push({_id:'points',value:0}),
  s=>s.after.customFields[0].token='secret',
  s=>s.after.customFields[0].value={token:'secret'},
  s=>s.after.customFields[0].value=[1],
  s=>s.after.customFields[0].value=new Array(1),
  s=>s.after.customFields[0].value=Object.assign(['one'],{extra:'not stored'}),
  s=>s.after.customFields.extra='not stored',
  s=>s.after.customFields[0].value=new Date(NaN),
  s=>s.after.customFields[0].value=undefined,
  s=>s.after.customFields={},
 ]){const s=estimateStep();mutate(s);assert.throws(()=>validateStep(s), undefined, mutate.toString());}
});

test('mapped-field plans retain entry and payload bounds',()=>{
 const s=estimateStep();
 s.before.customFields=Array.from({length:9999},(_,index)=>({_id:`f${index}`,value:''}));
 s.before.customFields.push({_id:'points',value:2});
 s.after.customFields=structuredClone(s.before.customFields);s.after.customFields[9999].value=0;
 assert.doesNotThrow(()=>validateStep(s));
 s.before.customFields.push({_id:'overflow',value:''});s.after.customFields.push({_id:'overflow',value:''});
 assert.throws(()=>validateStep(s),/invalid-sync-operation-custom-fields/);
 const large=estimateStep();large.before.customFields[0].value='x'.repeat(1024*1024);
 large.after.customFields[0].value=large.before.customFields[0].value;
 assert.throws(()=>validateStep(large),/step-too-large/);
});

test('durable completion requires a stable intent and a private completion collection',async()=>{
 const scope={listId:'list',boardId:'board',sourceKey:'key',revision:null,incarnation:null};
 await assert.rejects(runSyncOperation({scope,assertCurrent:async()=>{}}),/intent-required/);
 await assert.rejects(runSyncOperation({scope,intentId:{$ne:null},assertCurrent:async()=>{}}),/intent-required/);
 await assert.rejects(runSyncOperation({scope,intentId:'11111111-1111-4111-8111-111111111111',assertCurrent:async()=>{}}),/completions-required/);
});
test('malformed or foreign completion proofs cannot suppress execution or become selectors',async()=>{
 const scope={listId:'list',boardId:'board',sourceKey:'key',revision:null,incarnation:null};
 const intentId='11111111-1111-4111-8111-111111111111';
 const base={_id:intentId,version:1,operationId:'22222222-2222-4222-8222-222222222222',scope,total:0,planChecksum:'a'.repeat(64),appliedAt:new Date(0)};
 for(const mutate of [row=>row.token='secret',row=>row.total=-1,row=>row.operationId={$ne:null},row=>row.appliedAt='not-date',row=>row.scope={...scope,boardId:'foreign'},row=>row.version=2]){
  const row=structuredClone(base);mutate(row);
  await assert.rejects(runSyncOperation({scope,intentId,assertCurrent:async()=>{},
   completions:{findOne:async()=>row,insertOne:async()=>assert.fail('bad completion inserted')},
   operations:{findOne:async()=>assert.fail('bad completion reached operation lookup')},
  }));
 }
});
test('effect planning requires both a builder and validator before storage access', async () => {
  const scope = { boardId: 'board', listId: 'list', incarnation: null, revision: null, sourceKey: 'source' };
  for (const options of [{ prepareEffects: () => ({}) }, { validateEffects: () => true },
    { prepareEffects: null, validateEffects: () => true }]) {
    await assert.rejects(runSyncOperation({ scope, ...options }), /effects-adapter-required/);
  }
});
