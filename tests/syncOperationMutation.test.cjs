'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {prepareSyncOperationMutation}=require('../server/lib/syncOperationMutation');
const {exactFieldSelector}=require('../models/lib/exactFieldSelector');
const before={_id:'card',boardId:'board',listId:'list',title:'Before',description:null};
test('planned patches compare the union of fields and preserve missing versus null',()=>{
 const after={_id:'card',boardId:'board',listId:'list',title:'After',spentTime:0};
 const result=prepareSyncOperationMutation({kind:'update',cardId:'card',before,after});
 assert.deepEqual(result.beforeSelector.description,{$eq:null,$exists:true});
 assert.deepEqual(result.beforeSelector.spentTime,{$exists:false});
 assert.deepEqual(result.afterSelector.description,{$exists:false});
 assert.deepEqual(result.modifier,{$set:{title:'After',spentTime:0},$unset:{description:''}});
 assert.ok(!Object.hasOwn(result.modifier.$set,'boardId'));
});
test('snapshot objects are literal values and cannot become Mongo operators',()=>{
 const snapshot={_id:'card',baseline:{$ne:null},list:[{_id:'points',value:0}],date:new Date(0)};
 const selector=exactFieldSelector(snapshot,['baseline','list','date','missing']);
 assert.deepEqual(selector.baseline,{$eq:{$ne:null}});
 assert.deepEqual(selector.list,{$eq:snapshot.list});assert.deepEqual(selector.date,{$eq:new Date(0)});
 assert.deepEqual(selector.missing,{$exists:false});
});
test('creation and archive plans retain dates and are independent of later input mutation',()=>{
 const date=new Date(0),after={...before,archived:true,archivedAt:date};
 const result=prepareSyncOperationMutation({kind:'archive',cardId:'card',before,after});
 date.setTime(1000);after.title='Changed';
 assert.equal(result.afterSelector.title,'Before');assert.equal(result.modifier.$set.archivedAt.getTime(),0);
 const creation=prepareSyncOperationMutation({kind:'create',cardId:'card',before:null,after:{...before,spentTime:0}});
 assert.equal(creation.document.spentTime,0);assert.equal(creation.kind,'create');
 assert.ok(!Object.hasOwn(creation,'modifier'));
});
test('scope changes and explicit undefined are refused before constructing a mutation',()=>{
 for(const after of [{...before,boardId:'other'},{...before,listId:'other'},{...before,description:undefined}]){
  assert.throws(()=>prepareSyncOperationMutation({kind:'update',cardId:'card',before,after}));
 }
 const noop=prepareSyncOperationMutation({kind:'update',cardId:'card',before,after:before});
 assert.deepEqual(noop.modifier,{});
});

test('driver-side mutation cleaning cannot alter the planned result predicate',()=>{
 const identity=JSON.stringify(['points','customfield_100','points']);
 const initial={...before,customFields:[{_id:'points',value:2}],syncLastSource:{estimate:2,estimateMapping:identity}};
 const after={...initial,customFields:[{_id:'points',value:3}],syncLastSource:{estimate:3,estimateMapping:identity}};
 const mutation=prepareSyncOperationMutation({kind:'update',cardId:'card',before:initial,after});
 mutation.modifier.$set.customFields[0].value=999;
 assert.equal(mutation.afterSelector.customFields.$eq[0].value,3);
 assert.equal(after.customFields[0].value,3);
});

test('combined estimate plans preserve typed fields and reject ambiguous or unmapped changes',()=>{
 const mapping={estimateMapping:JSON.stringify(['points','customfield_100','points']),
  originalEstimateMapping:JSON.stringify(['original','original','hours']),
  remainingEstimateMapping:JSON.stringify(['remaining','remaining','hours'])};
 const initial={...before,customFields:[{_id:'date',value:new Date(0)},
  {_id:'points',value:2},{_id:'original',value:3},{_id:'remaining',value:1}],
  syncLastSource:{...mapping,estimate:2,originalEstimate:3,remainingEstimate:1}};
 const after={...initial,customFields:[initial.customFields[0],{_id:'points',value:0},
  {_id:'original',value:4}],syncLastSource:{...mapping,estimate:0,originalEstimate:4,remainingEstimate:null}};
 const prepare=value=>prepareSyncOperationMutation({kind:'update',cardId:'card',before:initial,after:value});
 assert.deepEqual(prepare(after).modifier.$set.customFields,after.customFields);
 // A locally kept value may legitimately differ from the last source value.
 assert.doesNotThrow(()=>prepare({...after,syncLastSource:{...after.syncLastSource,originalEstimate:9}}));
 for(const baseline of [
  {...after.syncLastSource,originalEstimateMapping:JSON.stringify(['original','remaining','hours'])},
  {...after.syncLastSource,remainingEstimateMapping:JSON.stringify(['original','remaining','hours'])},
  {...after.syncLastSource,originalEstimateMapping:JSON.stringify(['original','original','seconds'])},
  {...after.syncLastSource,originalEstimateMapping:undefined},
  {...after.syncLastSource,remainingEstimate:-1},
  {...after.syncLastSource,remainingEstimate:Infinity},
  {...after.syncLastSource,otherEstimate:1},
 ]) assert.throws(()=>prepare({...after,syncLastSource:baseline}));
 assert.throws(()=>prepare({...after,customFields:[{_id:'date',value:new Date(1)},...after.customFields.slice(1)]}),/unmapped-field/);
 assert.throws(()=>prepare({...after,customFields:[...after.customFields,{_id:'remaining',value:'1'}]}),/invalid-sync-operation-estimate/);
});
