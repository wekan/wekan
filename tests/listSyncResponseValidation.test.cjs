'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const asModule=file=>import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(file,'utf8')).toString('base64')}`);
async function run(raw,parser,existing,updateCount=1,child=null,fields,operations={}){
 const {validateImportSourceShape}=await asModule('models/lib/importSourceShape.js');
 const {planListSyncReconcile,validateListSyncTasks}=await asModule('models/lib/listSyncReconcile.js');
 const cardWrites=[],listWrites=[];let parsed=0;
 const source=fs.readFileSync('server/listSync.js','utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const context={Meteor:{startup(){}},Lists:{updateAsync:async(id,modifier)=>listWrites.push(modifier)},
  Cards:{insertAsync:async document=>{cardWrites.push({insert:document});return 'new';},updateAsync:async(selector,modifier)=>{cardWrites.push({selector,modifier});return updateCount;},find:()=>({fetchAsync:async()=>Array.isArray(existing)?existing:[existing || {_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',title:'Existing',description:'',syncLastSource:{title:'Existing',description:''}}]}),findOneAsync:async()=>child},
  Boards:{findOneAsync:async()=>({_id:'board',getDefaultSwimlineAsync:async()=>({_id:'lane'})})},ListSyncCredentials:{findOneAsync:async()=>({token:'test'})},
  EXTERNAL_PARSERS:{jira:raw=>{parsed++;return parser?parser(raw):{tasks:[]};}},SYNC_CAPABLE_SOURCES:['jira'],
  LIST_SYNC_FETCHERS:{jira:async()=>raw},validateImportSourceShape,planListSyncReconcile,validateListSyncTasks,require:id=>id==='/models/lib/listSyncTextMerge'?require('../models/lib/listSyncTextMerge'):({record(){}}),console,
 };
 vm.createContext(context);vm.runInContext(source,context);
 const result=await context.syncOneList({_id:'list',boardId:'board',syncSource:{type:'jira',fields,...operations}});
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
 assert.equal(parsed,1);assert.equal(result.archived,1);assert.equal(cardWrites.length,1);assert.equal(cardWrites[0].modifier.$set.archived,true);
 assert.equal(cardWrites[0].selector.boardId,'board');assert.equal(cardWrites[0].selector.listId,'list');
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

test('duplicate local mappings abort before updates or archival',async()=>{
 const cards=[{_id:'a',syncExternalId:'KEY-1',title:'Same'},{_id:'b',syncExternalId:'KEY-1',title:'Same'}];
 const {result,cardWrites}=await run({issues:[]},()=>({tasks:[]}),cards);
 assert.match(result.error,/Duplicate local Sync identity/);assert.deepEqual(cardWrites,[]);
});

test('concurrent moves or edits abort source-absence archival',async()=>{
 const {result,listWrites}=await run({issues:[]},undefined,undefined,0);
 assert.match(result.error,/changed while archiving/);
 assert.equal(listWrites[0].$set['syncSource.lastSyncedAt'],undefined);
});
test('active subtasks outside the archive plan prevent all card writes',async()=>{
 const {result,cardWrites}=await run({issues:[]},undefined,undefined,1,{_id:'manual-child'});
 assert.match(result.error,/active subtask/);assert.deepEqual(cardWrites,[]);
});

test('excluded source text is not updated or added to new-card baselines',async()=>{
 const {result,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'Remote',description:'Remote body'}]}),[],1,null,[]);
 assert.equal(result.created,1);assert.equal(cardWrites[0].insert.title,'Imported item');
 assert.equal(cardWrites[0].insert.description,'');assert.equal(Object.keys(cardWrites[0].insert.syncLastSource).length,0);
});

test('selected spent time updates hours and baseline together, while opt-out preserves local time',async()=>{
 const existing={_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',title:'Existing',description:'',spentTime:2,syncLastSource:{title:'Existing',description:'',spentTime:2}};
 const parser=()=>({tasks:[{externalId:'KEY-1',title:'Existing',description:'',spentTime:0}]});
 const enabled=await run({issues:[]},parser,existing,1,null,['spentTime']);
 assert.equal(enabled.result.updated,1);assert.equal(enabled.cardWrites[0].modifier.$set.spentTime,0);
 assert.equal(enabled.cardWrites[0].modifier.$set.syncLastSource.spentTime,0);
 assert.equal(enabled.cardWrites[0].selector.spentTime,2);
 const disabled=await run({issues:[]},parser,{...existing,spentTime:3});
 assert.equal(disabled.result.updated,0);assert.deepEqual(disabled.cardWrites,[]);
});

test('invalid spent time aborts Sync before card writes',async()=>{
 for(const spentTime of [-1,Infinity,NaN,'2',null]){
  const {result,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'KEY-1',spentTime}]}),undefined,1,null,['spentTime']);
  assert.match(result.error,/Invalid sync spent time/);assert.deepEqual(cardWrites,[]);
 }
});

test('operation selection independently suppresses creation and source-absence archival',async()=>{
 const existing=[{_id:'missing',syncExternalId:'OLD',syncSourceType:'jira',title:'Missing'},
  {_id:'retained',syncExternalId:'KEEP',syncSourceType:'jira',title:'Old',syncLastSource:{title:'Old'}}];
 const parser=()=>({tasks:[{externalId:'NEW',title:'New'},{externalId:'KEEP',title:'Updated'}]});
 for(const createCards of [false,true])for(const archiveCards of [false,true]){
  const {result,cardWrites}=await run({issues:[]},parser,existing,1,null,undefined,{createCards,archiveCards});
  assert.equal(result.created,Number(createCards));assert.equal(result.archived,Number(archiveCards));assert.equal(result.updated,1);
  assert.equal(cardWrites.filter(write=>write.insert).length,Number(createCards));
  assert.equal(cardWrites.filter(write=>write.modifier?.$set.archived).length,Number(archiveCards));
  assert.equal(cardWrites.find(write=>write.selector?._id==='retained').modifier.$set.title,'Updated');
 }
});
test('disabled archival skips child preflight and retains absent cards',async()=>{
 const {result,cardWrites}=await run({issues:[]},undefined,undefined,1,{_id:'child'},undefined,{archiveCards:false});
 assert.equal(result.archived,0);assert.deepEqual(cardWrites,[]);
});
