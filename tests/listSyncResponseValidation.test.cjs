'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const asModule=file=>import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(file,'utf8')).toString('base64')}`);
async function run(raw,parser,existing,updateCount=1){
 const {validateImportSourceShape}=await asModule('models/lib/importSourceShape.js');
 const {planListSyncReconcile,validateListSyncTasks}=await asModule('models/lib/listSyncReconcile.js');
 const cardWrites=[],listWrites=[];let parsed=0;
 const source=fs.readFileSync('server/listSync.js','utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const context={Meteor:{startup(){}},Lists:{updateAsync:async(id,modifier)=>listWrites.push(modifier)},
  Cards:{updateAsync:async(selector,modifier)=>{cardWrites.push({selector,modifier});return updateCount;},find:()=>({fetchAsync:async()=>[existing || {_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',title:'Existing',description:'',syncLastSource:{title:'Existing',description:''}}]}),findOneAsync:async()=>({archive:async()=>cardWrites.push('archive')})},
  Boards:{findOneAsync:async()=>({_id:'board'})},ListSyncCredentials:{findOneAsync:async()=>({token:'test'})},
  EXTERNAL_PARSERS:{jira:raw=>{parsed++;return parser?parser(raw):{tasks:[]};}},SYNC_CAPABLE_SOURCES:['jira'],
  LIST_SYNC_FETCHERS:{jira:async()=>raw},validateImportSourceShape,planListSyncReconcile,validateListSyncTasks,require:id=>id==='/models/lib/listSyncTextMerge'?require('../models/lib/listSyncTextMerge'):({record(){}}),console,
 };
 vm.createContext(context);vm.runInContext(source,context);
 const result=await context.syncOneList({_id:'list',boardId:'board',syncSource:{type:'jira'}});
 return {result,cardWrites,listWrites,parsed};
}
test('malformed sync responses cannot be mistaken for a source deletion',async()=>{
 for(const raw of [{errorMessages:['Unavailable']},{issues:null},{issues:{}},null]){
  const {result,cardWrites,listWrites,parsed}=await run(raw);
  assert.match(result.error,/Invalid jira import document shape/);assert.equal(parsed,0);
  assert.deepEqual(cardWrites,[]);assert.equal(listWrites.length,1);
  assert.ok(listWrites[0].$set['syncSource.lastSyncError']);
  assert.equal(listWrites[0].$set['syncSource.lastSyncedAt'],undefined);
 }
});
test('a valid empty source still archives items which actually disappeared',async()=>{
 const {result,cardWrites,listWrites,parsed}=await run({issues:[]});
 assert.equal(parsed,1);assert.equal(result.archived,1);assert.deepEqual(cardWrites,['archive']);
 assert.equal(listWrites[0].$set['syncSource.lastSyncError'],'');
});
test('parser errors follow the same no-card-write error path',async()=>{
 const {result,cardWrites,listWrites}=await run({issues:[{}]},()=>{throw new Error('Invalid issue');});
 assert.equal(result.error,'Invalid issue');assert.deepEqual(cardWrites,[]);
 assert.equal(listWrites[0].$set['syncSource.lastSyncError'],'Invalid issue');
});

test('malformed normalized tasks cannot drop source items or silently replace duplicates',async()=>{
 for(const tasks of [undefined,null,[{}],[null],[{externalId:' '}],[{externalId:'KEY-1'},{externalId:'KEY-1'}],[{externalId:'KEY-1',title:{}}]]){
  const {result,cardWrites,listWrites}=await run({issues:[]},()=>({tasks}));
  assert.ok(result.error);assert.deepEqual(cardWrites,[]);
  assert.ok(listWrites[0].$set['syncSource.lastSyncError']);
 }
});
test('valid unchanged tasks leave existing cards intact',async()=>{
 const {result,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'KEY-1',title:'Existing',description:''}]}));
 assert.equal(result.updated,0);assert.equal(result.archived,0);assert.deepEqual(cardWrites,[]);
});

test('sync detects diverging local text before any card mutation',async()=>{
 const local={_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',title:'Local',description:'',syncLastSource:{title:'Original',description:''}};
 const {result,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'KEY-1',title:'Upstream',description:''}]}),local);
 assert.match(result.error,/conflict/);assert.deepEqual(cardWrites,[]);
});
test('safe upstream text changes store the baseline with a conditional update',async()=>{
 const {result,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'KEY-1',title:'Upstream',description:''}]}));
 assert.equal(result.updated,1);assert.equal(cardWrites[0].selector.title,'Existing');
 assert.equal(cardWrites[0].selector.boardId,'board');
 assert.equal(cardWrites[0].modifier.$set.title,'Upstream');
 assert.equal(cardWrites[0].modifier.$set.syncLastSource.title,'Upstream');
});

test('a concurrent text update reports failure instead of claiming sync success',async()=>{
 const {result,listWrites}=await run({issues:[]},()=>({tasks:[{externalId:'KEY-1',title:'Upstream',description:''}]}),undefined,0);
 assert.match(result.error,/changed while applying/);
 assert.equal(listWrites.length,1);assert.equal(listWrites[0].$set['syncSource.lastSyncedAt'],undefined);
});
