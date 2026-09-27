'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {collectionWriteSucceeded}=require('../server/lib/collectionWriteOutcome');
const src=fs.readFileSync('server/models/cards.js','utf8');
async function hooks() {
 const emitted=[],callbacks=[];
 const {titleChanged}=await import('../server/lib/titleChangeActivity.js');
 const {descriptionChanged}=await import('../server/lib/descriptionChangeActivity.js');
 const context={Cards:{after:{update:fn=>callbacks.push(fn)}},collectionWriteSucceeded,titleChanged,descriptionChanged,
  ReactiveCache:{getUser:async()=>({username:'writer'})},Activities:{insertAsync:async doc=>emitted.push(doc)}};
 vm.runInNewContext(src.slice(src.indexOf('// Issue #3619:'),src.indexOf('// Clear stale move reasons')),context);
 return {emitted,run:async(ctx,doc,modifier)=>{for(const fn of callbacks)await fn.call(ctx,'user',doc,Object.keys(modifier.$set||modifier.$unset||{}),modifier);}};
}
test('text activity hooks run only after confirmed updates and preserve before/after text',async()=>{
 const h=await hooks(),previous={title:'Old',description:'Before'},doc={_id:'card',boardId:'board',listId:'list',swimlaneId:'lane',title:'New',description:'After'};
 const modifier={$set:{title:'New',description:'After'}};
 for(const context of [{previous,affected:0},{previous,affected:1,err:new Error('failed')},{affected:1},{previous,affected:undefined}]){
  await h.run(context,doc,modifier);assert.equal(h.emitted.length,0);
 }
 await h.run({previous,affected:1},doc,modifier);
 assert.equal(h.emitted.length,2);assert.equal(h.emitted[0].oldValue,'Old');assert.equal(h.emitted[0].value,'New');
 assert.equal(h.emitted[1].oldValue,'Before');assert.equal(h.emitted[1].value,'After');
 assert.equal(h.emitted[1].listId,'list');assert.equal(h.emitted[1].cardTitle,'New');
 await h.run({previous:doc,affected:1},doc,modifier);assert.equal(h.emitted.length,2);
 await h.run({previous:doc,affected:{numberAffected:1}},{...doc,description:undefined},{$unset:{description:''}});
 assert.equal(h.emitted.length,3);assert.equal(h.emitted[2].value,'');assert.equal(h.emitted[2].oldValue,'After');
 await h.run({previous:{...doc,description:undefined},affected:1},{...doc,description:undefined},{$unset:{description:''}});
 assert.equal(h.emitted.length,3);
});
test('archive activities ignore zero-match updates and no-op state writes',async()=>{
 const calls=[];let callback;
 const start=src.indexOf('Cards.after.update(async function(userId, doc, fieldNames) {');
 const end=src.indexOf('\n});',start)+4;
 vm.runInNewContext(src.slice(start,end),{Cards:{after:{update:fn=>{callback=fn;}}},collectionWriteSucceeded,cardState:async(...args)=>calls.push(args)});
 await callback.call({previous:{archived:false},affected:0},'user',{archived:true},['archived']);
 await callback.call({previous:{archived:true},affected:1},'user',{archived:true},['archived']);
 assert.equal(calls.length,0);
 await callback.call({previous:{archived:false},affected:1},'user',{archived:true},['archived']);
 assert.equal(calls.length,1);
});

test('universal and rule History hooks also refuse zero-match and errored updates',async()=>{
 for(const [file,marker] of [
  ['server/models/changeHistoryHooks.js','collection.after.update(async function (userId, doc, fieldNames) {'],
  ['server/lib/ruleHistory.js','Rules.after.update(async function (userId, rule) {'],
  ['server/lib/ruleHistory.js','collection.after.update(async function (userId, doc) {'],
 ]){
  const source=fs.readFileSync(file,'utf8'),start=source.indexOf(marker),end=source.indexOf('});',start)+3;
  let callback,writes=0,reads=0;
  const register={update:fn=>{callback=fn;}};
  const context={collection:{after:register},Rules:{after:register,find:()=>{reads++;return {fetchAsync:async()=>[{_id:'rule'}]};}},
   collectionWriteSucceeded,entityType:'card',field:'trigger',isRecordingSuppressed:()=>false,
   ruleSnapshot:async()=>{reads++;return {};},recordRuleChange:async()=>{writes++;},recordUpdate:async()=>{writes++;}};
  vm.runInNewContext(source.slice(start,end),context);
  for(const ctx of [{previous:{},affected:0},{previous:{},affected:1,err:new Error('failed')}]){
   await callback.call(ctx,'user',{_id:'card'},['title']);assert.equal(writes,0);assert.equal(reads,0);
  }
  await callback.call({previous:{},affected:1},'user',{_id:'card'},['title']);assert.equal(writes,1);
 }
});
