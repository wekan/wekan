'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{isDeepStrictEqual}=require('node:util');
function setup(shared){
 const docs=new Map([['old',{_id:'old',boardId:'board',actionType:'archive',legacy:'preserve',createdAt:new Date()}]]);
 const writes=[];
 const collection={findOneAsync:async id=>docs.get(id),insertAsync:async doc=>{docs.set('new',{_id:'new',...doc});writes.push('insert');return 'new';},updateAsync:async(id,modifier)=>{docs.set(id,modifier.$set?{...docs.get(id),...modifier.$set}:{_id:id,...modifier});writes.push('update');}};
 const context={Meteor:{startup(){}},EJSON:{clone:structuredClone,equals:(a,b)=>isDeepStrictEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)))},Rules:{findOneAsync:async()=>shared?{_id:'sibling'}:null},Actions:collection,Triggers:collection};
 const source=fs.readFileSync('server/lib/ruleHistory.js','utf8').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
 vm.createContext(context);vm.runInContext(source,context);
 return {docs,writes,write:(fields,options)=>context.writeRuleComponent({_id:'rule',actionId:'old'},'action',fields,options)};
}
for(const shared of [false,true])for(const patch of [false,true])test(`actual component writer: shared=${shared}, patch=${patch}`,async()=>{
 const state=setup(shared);const id=await state.write({boardId:'board',actionType:'unarchive'},{patch});
 assert.equal(id,shared?'new':'old');assert.equal(state.docs.get(id).actionType,'unarchive');
 assert.equal(state.docs.get(id).legacy,patch?'preserve':undefined);
 if(shared)assert.equal(state.docs.get('old').actionType,'archive');
 assert.deepEqual(state.writes,[shared?'insert':'update']);
});
test('unchanged shared patch neither clones nor updates the component',async()=>{
 const state=setup(true);assert.equal(await state.write({actionType:'archive'},{patch:true}),'old');assert.deepEqual(state.writes,[]);
});
