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
