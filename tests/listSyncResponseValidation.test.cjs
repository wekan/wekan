'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {AsyncLocalStorage}=require('node:async_hooks');
const fs=require('node:fs');const vm=require('node:vm');
const {syncSourceKey}=require('../models/lib/listSyncSourceIdentity');
const sourceConfig={type:'jira',url:'https://jira.example',projectKey:'TEST'};
const sourceKey=syncSourceKey(sourceConfig);
const asModule=file=>import(`data:text/javascript;base64,${Buffer.from(fs.readFileSync(file,'utf8')).toString('base64')}`);
async function run(raw,parser,existing,updateCount=1,child=null,fields,operations={},credentialKey=sourceKey,currentConfig=true,createError,options={},targets={findOneAsync:async()=>null},scheduled={}){
 const {validateImportSourceShape}=await asModule('models/lib/importSourceShape.js');
 const {planListSyncReconcile,validateListSyncTasks}=await asModule('models/lib/listSyncReconcile.js');
 const actor=new AsyncLocalStorage();const authors=[];
 const cardWrites=[],listWrites=[];let parsed=0,fetches=0;const cardQueries=[];
 const source=fs.readFileSync('server/listSync.js','utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const reports=[];
 const reportCollection={insertOne:async doc=>reports.push(doc),findOne:async q=>reports.find(r=>r._id===q._id&&r.status===q.status),updateOne:async(q,m)=>{const row=reports.find(r=>r._id===q._id&&r.status===q.status);if(row)Object.assign(row,m.$set);return {matchedCount:row?1:0};}};
 const context={ListSyncRunReports:{rawCollection:()=>reportCollection},ListSyncTargets:targets,Meteor:{startup(){},users:{findOneAsync:async()=>scheduled.user===undefined?{_id:'actor'}:scheduled.user}},DDP:{_CurrentMethodInvocation:{withValue:(value,work)=>actor.run(value,work)}},allowIsBoardMemberWithWriteAccess:()=>scheduled.authorized!==false,withListSyncLease:async(id,work)=>work({assertCurrent:async()=>{}}),Lists:{findOneAsync:async selector=>!Object.hasOwn(selector,'syncSource')?({_id:'list',boardId:'board',syncSource:{...sourceConfig,fields,...operations}}):(currentConfig?{}:null),updateAsync:async(id,modifier)=>listWrites.push(modifier)},
  Cards:{insertAsync:async (document,options)=>{authors.push(actor.getStore()?.userId);cardWrites.push({insert:document,options});if(createError)throw createError;return document._id;},updateAsync:async(selector,modifier,options)=>{authors.push(actor.getStore()?.userId);cardWrites.push({selector,modifier,options});return updateCount;},find:selector=>{cardQueries.push(selector);return {fetchAsync:async()=>Array.isArray(existing)?existing:[existing || {_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',syncSourceKey:sourceKey,title:'Existing',description:'',syncLastSource:{title:'Existing',description:''}}]}},findOneAsync:async selector=>typeof child==='function'?child(selector):child},
  Boards:{findOneAsync:async()=>({_id:'board',getDefaultSwimlineAsync:async()=>({_id:'lane'})})},ListSyncCredentials:{findOneAsync:async()=>({token:'test',sourceKey:credentialKey,runAsUserId:scheduled.userId})},
  EXTERNAL_PARSERS:{jira:raw=>{parsed++;return parser?parser(raw):{tasks:[]};}},SYNC_CAPABLE_SOURCES:['jira'],
  LIST_SYNC_FETCHERS:{jira:async()=>{fetches++;if(scheduled.revokeAfterFetch)scheduled.authorized=false;return raw;}},validateImportSourceShape,planListSyncReconcile,validateListSyncTasks,require:id=>(id.startsWith('/models/lib/') || ['/server/lib/scheduledSyncActor','/server/lib/listSyncCardId','/server/lib/listSyncConfiguration','/server/lib/listSyncConflict','/server/lib/listSyncTarget','/server/lib/listSyncPreview','/server/lib/listSyncSourceCoverage','/server/lib/syncRunReport'].includes(id))?require('..'+id):({record(){}}),console,
 };
 vm.createContext(context);vm.runInContext(source,context);
 const result=await context.syncOneList({_id:'list',boardId:'board',syncSource:{...sourceConfig,fields,...operations}},options);
 return {result,cardWrites,listWrites,parsed,fetches,cardQueries,reports,authors};
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

test('conflict resolution refetches source, checks the preview and only writes the chosen field and baseline',async()=>{
 const card={_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',syncSourceKey:sourceKey,
  title:'Local',description:'Keep description',syncLastSource:{title:'Original',description:'Keep description'}};
 const task={externalId:'KEY-1',title:'Remote',description:'Keep description'};
 const execute=(options={},incoming=task,existing=card,count=1)=>run({issues:[]},()=>({tasks:[incoming]}),existing,count,null,undefined,{},sourceKey,true,undefined,options);
 const preview=await execute({previewConflicts:true});
 assert.equal(preview.cardWrites.length,0);
 assert.doesNotMatch(preview.listWrites[0].$set['syncSource.lastSyncError'],/KEY-1|Local|Remote/);
 const conflict=preview.result.conflicts[0];
 assert.equal(conflict.local,'Local');assert.equal(conflict.incoming,'Remote');assert.match(conflict.fingerprint,/^[a-f0-9]{64}$/);
 const hidden=await execute();assert.equal(hidden.result.conflicts[0].local,undefined);
 for(const choice of ['local','source']){
  const result=await execute({resolution:{...conflict,choice}});
  assert.equal(result.result.resolved,true);assert.equal(result.fetches,1);assert.equal(result.cardWrites.length,1);
  const write=result.cardWrites[0];assert.equal(write.selector.title,'Local');
  assert.equal(write.modifier.$set.syncLastSource.title,'Remote');
  assert.equal(write.modifier.$set.title,choice==='source'?'Remote':undefined);
  assert.equal(write.modifier.$set.description,undefined);
 }
 for(const [options,incoming,existing] of [
  [{resolution:{...conflict,choice:'source',fingerprint:'0'.repeat(64)}},task,card],
  [{resolution:{...conflict,choice:'source'}},{...task,title:'New remote'},card],
  [{resolution:{...conflict,choice:'source'}},task,{...card,title:'New local'}],
  [{resolution:{...conflict,choice:'source',cardId:'foreign'}},task,card],
 ]){
  const result=await execute(options,incoming,existing);assert.match(result.result.error,/conflict changed/);assert.equal(result.cardWrites.length,0);
 }
 const raced=await execute({resolution:{...conflict,choice:'source'}},task,card,0);
 assert.match(raced.result.error,/card changed/);
});

test('description and spent-time decisions retain value types and prevent the same conflict recurring',async()=>{
 const {planSyncTextMerge}=require('../models/lib/listSyncTextMerge');
 for(const [field,original,local,incoming] of [['description','old','my text','their text'],['spentTime',1,2,3]]){
  const card={_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',syncSourceKey:sourceKey,
   title:'Existing',[field]:local,syncLastSource:{[field]:original}};
  const task={externalId:'KEY-1',[field]:incoming};
  const execute=options=>run({issues:[]},()=>({tasks:[task]}),card,1,null,[field],{},sourceKey,true,undefined,options);
  const preview=(await execute({previewConflicts:true})).result.conflicts[0];
  for(const choice of ['local','source']){
   const result=await execute({resolution:{...preview,choice}});
   assert.equal(result.result.resolved,true);
   const updated={...card,...result.cardWrites[0].modifier.$set};
   assert.equal(updated[field],choice==='source'?incoming:local);
   assert.equal(updated.syncLastSource[field],incoming);
   assert.equal(planSyncTextMerge([task],[updated]).conflicts.length,0);
  }
 }
});

test('assigned-only callers review scoped cards without running list-wide writes or shared status updates',async()=>{
 const scope={assignees:{$in:['member']}};
 const options={previewConflicts:true,assertConflictAccess:async()=>scope};
 const card={_id:'card',syncExternalId:'KEY-1',syncSourceType:'jira',syncSourceKey:sourceKey,
  title:'Local',syncLastSource:{title:'Original'}};
 const execute=(tasks,settings=options,rows=[card],count=1)=>run({issues:[]},()=>({tasks}),rows,count,null,['title'],{},sourceKey,true,undefined,settings);
 const preview=await execute([{externalId:'KEY-1',title:'Remote'}]);
 assert.deepEqual(preview.cardQueries[0].assignees,scope.assignees);
 assert.equal(preview.result.reviewOnly,true);assert.equal(preview.result.conflicts[0].local,'Local');
 assert.deepEqual(preview.cardWrites,[]);assert.deepEqual(preview.listWrites,[]);
 const resolution={...preview.result.conflicts[0],choice:'local'};
 const resolved=await execute([{externalId:'KEY-1',title:'Remote'}],{...options,resolution});
 assert.equal(resolved.result.resolved,true);
 assert.deepEqual(resolved.cardWrites[0].selector.$and[1],scope);
 const unassigned=await execute([{externalId:'KEY-1',title:'Remote'}],{...options,resolution},[],1);
 assert.match(unassigned.result.error,/conflict changed/);assert.deepEqual(unassigned.cardWrites,[]);
 const raced=await execute([{externalId:'KEY-1',title:'Remote'}],{...options,resolution},[card],0);
 assert.match(raced.result.error,/card changed/);
 // These would create, update and archive cards in a normal full-list run.
 for(const tasks of [[{externalId:'NEW',title:'New'}],[{externalId:'KEY-1',title:'Local'}],[]]){
  const result=await execute(tasks);
  assert.equal(result.result.reviewOnly,true);assert.deepEqual(result.cardWrites,[]);assert.deepEqual(result.listWrites,[]);
 }
 const broken=await run({errorMessages:['Unavailable']},null,[card],1,null,undefined,{},sourceKey,true,undefined,options);
 assert.deepEqual(broken.cardWrites,[]);assert.deepEqual(broken.listWrites,[]);
 let calls=0;
 const revoked=await execute([{externalId:'KEY-1',title:'Remote'}],{
  ...options,assertConflictAccess:async()=>{if(++calls===3)throw new Error('denied');return scope;},
 }).then(()=>null,error=>error);
 assert.match(revoked.message,/denied/);
});

test('duplicate repair detaches only an extra mapping and protects the stable first mapping',async()=>{
 const original={_id:'a',syncExternalId:'KEY-1',syncSourceType:'jira',syncSourceKey:sourceKey,
  title:'Primary',description:'Keep primary',syncLastSource:{title:'Primary'}};
 const extra={...original,_id:'b',title:'Local duplicate',description:'Keep duplicate'};
 const third={...original,_id:'c',title:'Third'};
 const tasks=[{externalId:'KEY-1',title:'Primary'}];
 const execute=(cards,options={},updateCount=1)=>run({issues:[]},()=>({tasks}),cards,updateCount,null,undefined,{},sourceKey,true,undefined,options);
 const preview=await execute([third,extra,original],{previewConflicts:true});
 assert.equal(preview.result.conflicts.length,2);assert.equal(preview.cardWrites.length,0);
 const first=preview.result.conflicts[0];
 assert.equal(first.cardId,'b');assert.equal(first.duplicate,true);assert.match(first.retained,/Primary/);
 const reversed=await execute([original,extra,third],{previewConflicts:true});
 assert.equal(reversed.result.conflicts[0].fingerprint,first.fingerprint);
 const resolution={cardId:first.cardId,field:first.field,fingerprint:first.fingerprint,choice:'detach'};
 const repaired=await execute([third,extra,original],{resolution});
 assert.equal(repaired.result.resolved,true);assert.equal(repaired.cardWrites.length,1);
 assert.equal(repaired.cardWrites[0].selector._id,'b');
 assert.deepEqual(Object.keys(repaired.cardWrites[0].modifier.$unset).sort(),
  ['syncExternalId','syncLastSource','syncSourceKey','syncSourceType']);
 assert.deepEqual(Object.keys(repaired.cardWrites[0].modifier.$set),['dateLastActivity']);
 for(const [cards,choice] of [
  [[original,extra],resolution],
  [[{...original,title:'Changed primary'},extra,third],resolution],
  [[original,extra,third],{...resolution,cardId:'a'}],
  [[original,extra,third],{...resolution,choice:'source'}],
 ]){
  const result=await execute(cards,{resolution:choice});
  assert.match(result.result.error,/conflict changed/);assert.equal(result.cardWrites.length,0);
 }
 const lostAssignment=await execute([original,extra,third],{resolution,
  assertConflictAccess:async()=>({assignees:{$in:['member']}})},0);
 assert.match(lostAssignment.result.error,/card changed/);
 assert.deepEqual(lostAssignment.cardWrites[0].selector.$and[1],{assignees:{$in:['member']}});
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

test('archive conflicts can retain a parent locally without exposing or changing its subtasks',async()=>{
 const parent={_id:'parent',syncExternalId:'MISSING',syncSourceType:'jira',syncSourceKey:sourceKey,
  title:'Keep parent',description:'Keep description',archived:false,syncLastSource:{title:'Keep parent'}};
 const child={_id:'private-child',title:'Hidden child text'};
 const execute=(options={},tasks=[],blocker=child,operations={},card=parent,count=1)=>run({issues:[]},()=>({tasks}),[card],count,blocker,undefined,operations,sourceKey,true,undefined,options);
 const preview=await execute({previewConflicts:true});
 assert.equal(preview.cardWrites.length,0);
 const conflict=preview.result.conflicts[0];assert.equal(conflict.archive,true);assert.equal(conflict.cardId,'parent');
 assert.doesNotMatch(JSON.stringify(preview.result),/private-child|Hidden child text/);
 const resolution={cardId:conflict.cardId,field:conflict.field,fingerprint:conflict.fingerprint,choice:'detach'};
 const result=await execute({resolution});assert.equal(result.result.resolved,true);assert.equal(result.cardWrites.length,1);
 assert.equal(result.cardWrites[0].selector._id,'parent');
 assert.deepEqual(Object.keys(result.cardWrites[0].modifier.$set),['dateLastActivity']);
 assert.deepEqual(Object.keys(result.cardWrites[0].modifier.$unset).sort(),['syncExternalId','syncLastSource','syncSourceKey','syncSourceType']);
 for(const [tasks,blocker,operations,card] of [
  [[{externalId:'MISSING',title:'Keep parent'}],child,{},parent],
  [[],null,{},parent], [[],child,{archiveCards:false},parent],
  [[],child,{}, {...parent,title:'Edited parent'}], [[],child,{}, {...parent,archived:true}],
 ]){
  const stale=await execute({resolution},tasks,blocker,operations,card);
  assert.match(stale.result.error,/conflict changed/);assert.equal(stale.cardWrites.length,0);
 }
 const scoped={previewConflicts:true,assertConflictAccess:async()=>({assignees:{$in:['member']}})};
 const own=await execute(scoped);assert.equal(own.result.reviewOnly,true);assert.equal(own.result.conflicts[0].archive,true);
 assert.deepEqual(own.listWrites,[]);assert.deepEqual(own.cardWrites,[]);
 const lost=await execute({...scoped,resolution},[],child,{},parent,0);
 assert.match(lost.result.error,/card changed/);assert.deepEqual(lost.cardWrites[0].selector.$and[1],{assignees:{$in:['member']}});
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


test('source identity scopes reads, new cards and conditional writes',async()=>{
 const {cardQueries,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'New'},{externalId:'KEY-1',title:'Updated'}]}));
 assert.equal(cardQueries[0].boardId,'board');assert.equal(cardQueries[0].syncSourceKey,sourceKey);
 assert.equal(cardWrites.find(write=>write.insert).insert.syncSourceKey,sourceKey);
 assert.equal(cardWrites.find(write=>write.selector).selector.syncSourceKey,sourceKey);
});
test('unbound or different-project credentials never reach a fetcher',async()=>{
 for(const key of [null,syncSourceKey({...sourceConfig,projectKey:'OTHER'})]){
  const {result,cardWrites,fetches}=await run({issues:[]},undefined,undefined,1,null,undefined,{},key);
  assert.match(result.error,/credential for this server and project/);
  assert.equal(fetches,0);assert.deepEqual(cardWrites,[]);
 }
});
test('source switch during fetch aborts before reconciling the previous response',async()=>{
 const {result,cardWrites,cardQueries}=await run({issues:[]},undefined,undefined,1,null,undefined,{},sourceKey,false);
 assert.match(result.error,/settings changed while fetching/);
 assert.deepEqual(cardWrites,[]);assert.deepEqual(cardQueries,[]);
});


test('creation collision preflight stops before any card write',async()=>{
 const {result,cardWrites,listWrites}=await run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'New'}]}),[],1,{_id:'winner'},undefined,{},sourceKey,true,{code:11000});
 assert.match(result.error,/Sync creation conflict/);
 assert.equal(cardWrites.length,0);
 assert.equal(listWrites.length,1);
 assert.equal(listWrites[0].$set['syncSource.lastSyncedAt'],undefined);
 assert.match(result.conflicts[0].cardId,/^sync-[a-f0-9]{64}$/);
});

test('unrelated insertion failures propagate instead of being mislabeled as collisions',async()=>{
 await assert.rejects(run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'New'}]}),[],1,null,undefined,{},sourceKey,true,new Error('database unavailable')),/database unavailable/);
 await assert.rejects(run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'New'}]}),[],1,null,undefined,{},sourceKey,true,Object.assign(new Error('other unique index'),{code:11000})),/other unique index/);
});

test('a collision arriving after preflight still refuses success',async()=>{
 let reads=0;
 const {result,cardWrites}=await run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'New'}]}),[],1,
  ()=>++reads===1?null:{_id:'winner'},undefined,{},sourceKey,true,{code:11000});
 assert.match(result.error,/Sync creation conflict/);
 assert.equal(cardWrites.length,1);
 assert.match(cardWrites[0].insert._id,/^sync-[a-f0-9]{64}$/);
});

test('replacement preview and resolution preserve old content and reject stale or restricted decisions',async()=>{
 const {nextSyncTargetId}=require('../server/lib/listSyncTarget');
 let selected=null;
 const targets={findOneAsync:async()=>selected,insertAsync:async doc=>{selected=doc;}};
 const task={externalId:'NEW',title:'Incoming title',description:'Incoming prose'};
 const old={_id:'private-card',title:'PRIVATE TITLE',description:'PRIVATE DESCRIPTION'};
 const invoke=(tasks,options={},operations={})=>run({issues:[]},()=>({tasks}),[],1,old,undefined,operations,sourceKey,true,undefined,options,targets);
 const preview=await invoke([task],{previewConflicts:true});
 const row=preview.result.conflicts[0];
 assert.equal(row.creation,true);
 assert.equal(row.local,'Incoming title\n\nIncoming prose');
 assert.doesNotMatch(JSON.stringify(preview.result),/PRIVATE/);
 assert.deepEqual(preview.cardWrites,[]);
 const resolution={cardId:row.cardId,field:'creation',choice:'replace',fingerprint:row.fingerprint};
 for(const [tasks,options,operations] of [
  [[{...task,title:'Changed'}],{resolution},{}],
  [[],{resolution},{}],
  [[task],{resolution},{createCards:false}],
  [[task],{resolution,assertConflictAccess:async()=>({members:'restricted'})},{}],
  [[task],{resolution:{...resolution,choice:'source'}},{}],
 ]){
  assert.ok((await invoke(tasks,options,operations)).result.error);
  assert.equal(selected,null);
 }
 const accepted=await invoke([task],{resolution});
 assert.equal(accepted.result.resolved,true);
 assert.deepEqual(accepted.cardWrites,[]);
 assert.equal(selected.targetId,nextSyncTargetId(row.cardId));
 assert.ok((await invoke([task],{resolution})).result.error);
 const retry=await run({issues:[]},()=>({tasks:[task]}),[],1,null,undefined,{},sourceKey,true,undefined,{},targets);
 assert.equal(retry.result.created,1);
 assert.equal(retry.cardWrites[0].insert._id,selected.targetId);
 assert.deepEqual(old,{_id:'private-card',title:'PRIVATE TITLE',description:'PRIVATE DESCRIPTION'});
});

test('preview and actual Sync share the write plan, including baselines and ignored status-only changes',async()=>{
 const cards=[
  {_id:'keep',syncExternalId:'KEEP',title:'Old',description:'',syncLastSource:{title:'Old',description:''}},
  {_id:'gone',syncExternalId:'GONE',title:'Archive me',description:''},
 ];
 const tasks=[{externalId:'KEEP',title:'New',description:'',column_name:'Done',tags:['not synced']},
  {externalId:'NEW',title:'Create me',description:'',spentTime:0,requested_by:'PRIVATE REQUESTER'}];
 const invoke=options=>run({issues:[{key:'KEEP',fields:{attachment:[{filename:'PRIVATE ATTACHMENT'}]}}]},()=>({tasks}),cards,1,null,undefined,{},sourceKey,true,undefined,options);
 const preview=await invoke({dryRun:true});
 assert.deepEqual(preview.cardWrites,[]);assert.deepEqual(preview.listWrites,[]);assert.deepEqual(preview.reports,[]);
 assert.equal(preview.result.preview.created,1);assert.equal(preview.result.preview.updated,1);
 assert.equal(preview.result.preview.archived,1);
 assert.equal(preview.result.preview.items.length,3);
 assert.doesNotMatch(JSON.stringify(preview.result),/PRIVATE REQUESTER|PRIVATE ATTACHMENT|test-token/);
 assert.equal(preview.result.preview.coverage.source.rows[0].path,'/issues/*/fields/attachment');
 assert.equal(preview.result.preview.coverage.source.rows[0].count,1);
 const applied=await invoke({});
 assert.equal(applied.reports.length,1);assert.equal(applied.reports[0].status,'completed-with-warnings');
 assert.equal(applied.reports[0].created,1);
 assert.doesNotMatch(JSON.stringify(applied.reports),/PRIVATE ATTACHMENT|PRIVATE REQUESTER/);
 for(const field of ['created','updated','archived'])assert.equal(preview.result.preview[field],applied.result[field]);
 const unchanged=await run({issues:[]},()=>({tasks:[{externalId:'KEEP',title:'Old',description:'',column_name:'Done'}]}),[cards[0]]);
 assert.equal(unchanged.result.updated,0);assert.deepEqual(unchanged.cardWrites,[]);
});

test('preview errors and conflicts leave cards, settings and Sync status unchanged',async()=>{
 const bad=await run({errorMessages:['Broken']},undefined,undefined,1,null,undefined,{},sourceKey,true,undefined,{dryRun:true});
 assert.ok(bad.result.error);assert.deepEqual(bad.cardWrites,[]);assert.deepEqual(bad.listWrites,[]);
 const card={_id:'card',syncExternalId:'KEY-1',title:'Local',description:'',syncLastSource:{title:'Original',description:''}};
 const blocked=await run({issues:[]},()=>({tasks:[{externalId:'KEY-1',title:'Source'}]}),[card],1,null,undefined,{},sourceKey,true,undefined,{dryRun:true});
 assert.equal(blocked.result.preview.blocked,true);assert.ok(blocked.result.conflicts.length);
 assert.deepEqual(blocked.cardWrites,[]);assert.deepEqual(blocked.listWrites,[]);
 const collision=await run({issues:[]},()=>({tasks:[{externalId:'NEW',title:'Source'}]}),[],1,{_id:'occupied'},undefined,{},sourceKey,true,undefined,{dryRun:true});
 assert.equal(collision.result.preview.blocked,true);assert.equal(collision.result.conflicts[0].creation,true);
 assert.deepEqual(collision.cardWrites,[]);assert.deepEqual(collision.listWrites,[]);
});

test('full-list previews reject restricted callers before fetching and recheck access before returning',async()=>{
 const invoke=options=>run({issues:[{key:'SECRET',fields:{private_extension:'SECRET VALUE'}}]},()=>({tasks:[{externalId:'SECRET',title:'Hidden'}]}),[],1,null,undefined,{},sourceKey,true,undefined,{dryRun:true,...options});
 const denied=await invoke({assertConflictAccess:async()=>({members:'restricted'})});
 assert.equal(denied.fetches,0);assert.ok(denied.result.error);
 assert.doesNotMatch(JSON.stringify(denied.result),/SECRET|Hidden|private_extension/);
 let checks=0;
 const revoked=await invoke({assertConflictAccess:async()=>++checks<3?null:{members:'restricted'}});
 assert.ok(revoked.result.error);assert.doesNotMatch(JSON.stringify(revoked.result),/SECRET|Hidden|private_extension/);
 assert.deepEqual(revoked.cardWrites,[]);assert.deepEqual(revoked.listWrites,[]);
 const invalid=await invoke({resolution:{field:'creation'}});
 assert.ok(invalid.result.error);assert.equal(invalid.fetches,0);
});

test('preview respects saved operation switches and can inspect a disabled source without enabling it',async()=>{
 const parser=()=>({tasks:[{externalId:'NEW',title:'New'}]});
 const disabled=await run({issues:[]},parser,[],1,null,undefined,{enabled:false},sourceKey,true,undefined,{dryRun:true});
 assert.equal(disabled.result.preview.created,1);assert.deepEqual(disabled.listWrites,[]);assert.deepEqual(disabled.cardWrites,[]);
 const unchanged=await run({issues:[]},parser,undefined,1,null,undefined,{createCards:false,archiveCards:false},sourceKey,true,undefined,{dryRun:true});
 assert.equal(unchanged.result.preview.total,0);assert.deepEqual(unchanged.listWrites,[]);assert.deepEqual(unchanged.cardWrites,[]);
});

test('Sync text writes retain empty and whitespace baselines without disabling validation',async()=>{
 const tasks=[{externalId:'NEW',title:'  Incoming  ',description:''},{externalId:'KEY-1',title:'Updated',description:''}];
 const applied=await run({issues:[]},()=>({tasks}));
 for(const write of applied.cardWrites){
  assert.equal(write.options.removeEmptyStrings,false);assert.equal(write.options.trimStrings,false);
  assert.equal(write.options.validate,undefined);assert.equal(write.options.bypassCollection2,undefined);
 }
 assert.equal(applied.cardWrites[0].insert.syncLastSource.title,'  Incoming  ');
 assert.equal(applied.cardWrites[0].insert.syncLastSource.description,'');
});

test('scheduled Sync binds writes to its saved author and refuses missing or revoked authorization',async()=>{
 const raw={issues:[]};const parser=()=>({tasks:[{externalId:'KEY-1',title:'Scheduled',description:''}]});
 const scheduledRun=scheduled=>run(raw,parser,[],1,null,undefined,{},sourceKey,true,undefined,{scheduled:true},undefined,scheduled);
 const success=await scheduledRun({userId:'actor'});
 assert.equal(success.result.created,1);assert.deepEqual(success.authors,['actor']);
 for(const scheduled of [{},{userId:'actor',user:null},{userId:'actor',user:{loginDisabled:true}},
  {userId:'actor',authorized:false},{userId:'actor',revokeAfterFetch:true}]){
  const denied=await scheduledRun(scheduled);
  assert.match(denied.result.error,/Save Sync settings/);
  assert.equal(denied.cardWrites.length,0);
  assert.equal(denied.fetches,scheduled.revokeAfterFetch?1:0);
  assert.match(denied.listWrites.at(-1).$set['syncSource.lastSyncError'],/Save Sync settings/);
 }
});
