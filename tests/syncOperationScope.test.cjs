'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createSyncOperationScopeGuard}=require('../server/lib/syncOperationScope');
const {syncSourceKey}=require('../models/lib/listSyncSourceIdentity');
const source={type:'jira',url:'https://example.org',projectKey:'PROJECT'};
const scope={listId:'list',boardId:'board',incarnation:'life',revision:'revision',sourceKey:syncSourceKey(source)};
function fixture(){
 let list={_id:'list',boardId:'board',syncCredentialIncarnation:'life',syncRevision:'revision',syncSource:source},board={_id:'board'},checks=0;
 const options={scope:{...scope},lists:{findOneAsync:async q=>list&&Object.entries(q).every(([k,v])=>list[k]===v)?list:null},
  boards:{findOneAsync:async()=>board},assertCurrent:async()=>{checks++;},assertAccess:async()=>true};
 return {options,setList:v=>list=v,setBoard:v=>board=v,get list(){return list;},get checks(){return checks;}};
}
test('stored operation scopes retain exact list lifetime, revision and source identity across access checks',async()=>{
 const f=fixture(),guard=createSyncOperationScopeGuard(f.options);f.options.scope.listId='mutated';await guard();assert.equal(f.checks,2);
 for(const change of [{boardId:'other'},{syncCredentialIncarnation:'new-life'},{syncRevision:'new-revision'},
  {syncSource:{...source,projectKey:'OTHER'}},{syncSource:null},{syncSource:{...source,url:'invalid'}}]){
  const g=fixture(),check=createSyncOperationScopeGuard(g.options);g.setList({...g.list,...change});await assert.rejects(check(),/scope-changed/);
 }
 for(const remove of [g=>g.setList(null),g=>g.setBoard(null)]){
  const g=fixture();g.options.assertAccess=async()=>{remove(g);return true;};await assert.rejects(createSyncOperationScopeGuard(g.options)(),/scope-changed/);
 }
});
test('legacy identities, missing authorization and denied or lost leases never permit durable work',async()=>{
 for(const field of ['incarnation','revision'])assert.throws(()=>createSyncOperationScopeGuard({...fixture().options,scope:{...scope,[field]:null}}),/invalid.*scope/);
 assert.throws(()=>createSyncOperationScopeGuard({...fixture().options,assertAccess:undefined}),/access-required/);
 for(const value of [false,undefined,null]){
  const f=fixture();f.options.assertAccess=async()=>value;await assert.rejects(createSyncOperationScopeGuard(f.options)(),/access-denied/);
 }
 const f=fixture();f.options.assertCurrent=async()=>{throw new Error('lease lost');};await assert.rejects(createSyncOperationScopeGuard(f.options)(),/lease lost/);
});
