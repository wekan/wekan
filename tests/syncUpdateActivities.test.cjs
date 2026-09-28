'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { prepareSyncUpdateActivities, validateSyncUpdateActivities, persistSyncUpdateActivities } = require('../server/lib/syncUpdateActivities');
const map = JSON.stringify(['points','customfield_1','points']);
const before = { _id:'card', boardId:'board', listId:'list', swimlaneId:'lane', title:'Old', description:'Text',
  customFields:[{_id:'points',value:2}], syncLastSource:{estimate:2,estimateMapping:map} };
const after = {...before,title:'New',description:'',archived:true,customFields:[{_id:'points',value:0}],
  syncLastSource:{estimate:0,estimateMapping:map}};
const step = {kind:'archive',cardId:'card',before,after};
const args = {step,effectId:'a'.repeat(64),userId:'user',username:'name',createdAt:new Date(0),
  list:{_id:'list',boardId:'board',title:'List'}};
test('update plans capture archive, title, empty description and zero estimate with distinct stable receipts',()=>{
 const plan=prepareSyncUpdateActivities(args);
 assert.deepEqual(plan.rows.map(row=>row.activity.activityType),['archivedCard','a-changedTitle','a-changedDescription','setCustomField']);
 assert.equal(new Set(plan.rows.map(row=>row.receiptId)).size,4);
 assert.equal(plan.rows[2].activity.value,'');assert.equal(plan.rows[3].activity.value,0);
 assert.equal(plan.rows[1].activity.oldValue,'Old');
 assert.deepEqual(plan,prepareSyncUpdateActivities(args));
 const clear=prepareSyncUpdateActivities({...args,step:{...step,kind:'update',after:{...before,customFields:[],syncLastSource:{estimate:null,estimateMapping:map}}}});
 assert.equal(clear.rows.length,1);assert.equal(clear.rows[0].activity.activityType,'unsetCustomField');
 assert.equal(Object.hasOwn(clear.rows[0].activity,'value'),false);
 const noOp=prepareSyncUpdateActivities({...args,step:{...step,kind:'update',after:{...before,spentTime:2,syncLastSource:{...before.syncLastSource,estimate:5}}}});
 assert.deepEqual(noOp.rows,[]);
});
test('complete plan validation rejects forged events, foreign references and mismatched steps before writes',async()=>{
 for(const overrides of [{userId:''},{username:null},{list:{...args.list,boardId:'foreign'}},
  {step:{...step,kind:'create',before:null}}])assert.throws(()=>prepareSyncUpdateActivities({...args,...overrides}));
 const plan=prepareSyncUpdateActivities(args);
 assert.throws(()=>validateSyncUpdateActivities(plan,step,'b'.repeat(64)));
 assert.throws(()=>validateSyncUpdateActivities(plan,{...step,after:{...after,title:'Wrong'}},args.effectId));
 for(const damage of [p=>p.rows.pop(),p=>p.rows[0].receiptId='b'.repeat(64),p=>p.rows[3].activity.value=9,p=>p.context.secret='forbidden']){
  const damaged=structuredClone(plan);damage(damaged);let writes=0;
  await assert.rejects(persistSyncUpdateActivities({activities:{findOneAsync:async()=>null,insertAsync:async()=>{writes++;}},
   plan:damaged,step,effectId:args.effectId,assertCurrent:async()=>{},completeDelivery:async()=>args.effectId}));
  assert.equal(writes,0);
 }
});
test('delivery interruption between update activities resumes exact rows without duplicate inserts',async()=>{
 const plan=prepareSyncUpdateActivities(args),rows=new Map(),receipts=new Set();let inserts=0,interrupted=true;
 const options={plan,step,effectId:args.effectId,assertCurrent:async()=>{},
  activities:{findOneAsync:async id=>rows.get(id),insertAsync:async row=>{inserts++;rows.set(row._id,row);throw new Error('lost insert');}},
  completeDelivery:async({effectId})=>{if(interrupted&&receipts.size===1)throw new Error('interrupted delivery');receipts.add(effectId);return effectId;}};
 await assert.rejects(persistSyncUpdateActivities(options),/interrupted delivery/);
 assert.equal(inserts,2);assert.equal(receipts.size,1);
 interrupted=false;assert.equal(await persistSyncUpdateActivities(options),args.effectId);
 await persistSyncUpdateActivities(options);
 assert.equal(inserts,4);assert.equal(receipts.size,4);
});

test('planned update payloads match the ordinary archive, title, description and custom-field hooks',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');const emitted=[],hooks=[];
 const context={deferSyncRecording:()=>false,Activities:{insertAsync:async row=>{emitted.push(row);}},Cards:{after:{update:fn=>hooks.push(fn)}},
  ReactiveCache:{getUser:async()=>({username:args.username}),getList:async()=>args.list},
  EJSON:{equals:(a,b)=>require('node:util').isDeepStrictEqual(a,b)},
  collectionWriteSucceeded:require('../server/lib/collectionWriteOutcome').collectionWriteSucceeded};
 for(const helper of ['titleChangeActivity','descriptionChangeActivity']){
  vm.runInNewContext(fs.readFileSync(`server/lib/${helper}.js`,'utf8').replace('export function','function'),context);
 }
 const server=fs.readFileSync('server/models/cards.js','utf8');
 const begin=server.indexOf('// Issue #3619: emit title activity'),end=server.indexOf('// Clear stale move reasons',begin);
 vm.runInNewContext(server.slice(begin,end),context);
 const model=fs.readFileSync('models/cards.js','utf8');
 vm.runInNewContext(model.slice(model.indexOf('async function cardState('),model.indexOf('async function cardMembers(')),context);
 vm.runInNewContext(model.slice(model.indexOf('async function cardCustomFields('),model.indexOf('async function cardCreation(')),context);
 await context.cardState(args.userId,after,['archived']);
 for(const hook of hooks)await hook.call({previous:before,affected:1},args.userId,after,['title','description'],{$set:{title:after.title,description:after.description}});
 await context.cardCustomFields(args.userId,after,['customFields'],before);
 const planned=prepareSyncUpdateActivities(args).rows.map(({activity})=>{
  const {_id,createdAt,modifiedAt,...payload}=activity;return payload;
 });
 assert.deepEqual(JSON.parse(JSON.stringify(emitted)),planned);
});
