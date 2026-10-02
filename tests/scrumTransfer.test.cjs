'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {SCRUM_TRANSFER_FORMAT,normalizeScrumTransfer,remapScrumTransfer}=require('../models/lib/scrumTransfer');
function fixture(){
 const snapshot={at:'2026-09-01T10:00:00Z',unit:'points',estimateSource:'customField',estimateCustomFieldId:'cf',completionPolicy:'dueComplete',cards:[
  {cardId:'c1',listId:'l',estimate:0,done:true,archived:false},
  {cardId:'c2',listId:'l',estimate:null,done:false,archived:false},
 ],missingEstimates:1,totalEstimate:0};
 return {format:SCRUM_TRANSFER_FORMAT,settings:{enabled:true,productGoal:'Goal',definitionOfDone:'Definition',estimateSource:'customField',estimateCustomFieldId:'cf',productOwnerId:'u',scrumMasterId:'u',developerIds:['u']},
  sprints:[{_id:'s',name:'Sprint',state:'closed',startedAt:'2026-09-01T10:00:00Z',completedAt:'2026-09-02T10:00:00Z',startSnapshot:snapshot,closeSnapshot:{...structuredClone(snapshot),at:'2026-09-02T10:00:00Z'},rolloverSprintId:'next',createdBy:'u',createdAt:'2026-08-30T10:00:00Z'},{_id:'next',name:'Next',state:'planned'}],
  releases:[{_id:'r',name:'Release',state:'planned'}],events:[{_id:'e',name:'Review',kind:'review',sprintId:'s',startsAt:'2026-09-02T09:30:12.123Z',followUpCardIds:['c1','c2']}],
  cards:[{_id:'c1',scrum:{sprintId:null,pastSprintIds:['s'],releaseId:'r',backlogRank:0,acceptanceCriteria:'Criteria'}},{_id:'c2',scrum:{sprintId:'next',pastSprintIds:['s']}}],
  lists:[{_id:'l',scrum:{category:'done'}}],swimlanes:[{_id:'w',scrum:{sprintId:'s',releaseId:'r',purpose:'Team'}}]};
}
function maps(){return Object.fromEntries(Object.entries({sprints:['s','next'],releases:['r'],events:['e'],cards:['c1','c2'],lists:['l'],swimlanes:['w'],customFields:['cf'],users:['u']}).map(([kind,ids])=>[kind,new Map(ids.map(id=>[id,`new-${id}`]))]));}
function withDaily() {
 const source=fixture();
 source.dailyObservations=[{sprintId:'s',startedAt:source.sprints[0].startedAt,
  capturedAt:'2026-09-01T12:00:00Z',day:'2026-09-01',consistency:'observed',
  snapshot:{...structuredClone(source.sprints[0].startSnapshot),at:'2026-09-01T12:00:00Z'}}];
 return source;
}
test('version 2 daily history remaps references and retains measurements and old epochs',()=>{
 const source=withDaily();const before=structuredClone(source);
 source.dailyObservations.push({...structuredClone(source.dailyObservations[0]),startedAt:'2026-08-01T10:00:00Z'});
 const {transfer,losses}=remapScrumTransfer(source,maps());
 assert.equal(transfer.format,'wekan-scrum-2');assert.deepEqual(losses,[]);
 const row=transfer.dailyObservations[0];
 assert.equal(row.sprintId,'new-s');assert.equal(row.snapshot.cards[0].cardId,'new-c1');
 assert.equal(row.snapshot.cards[0].listId,'new-l');assert.equal(row.snapshot.estimateCustomFieldId,'new-cf');
 assert.equal(row.snapshot.cards[0].estimate,0);assert.equal(row.snapshot.cards[1].estimate,null);
 assert.equal(row.capturedAt.toISOString(),'2026-09-01T12:00:00.000Z');
 assert.equal(transfer.dailyObservations[1].startedAt.toISOString(),'2026-08-01T10:00:00.000Z');
 assert.deepEqual(source.dailyObservations[0],before.dailyObservations[0]);
 assert.deepEqual(normalizeScrumTransfer(JSON.parse(JSON.stringify(transfer))),transfer);
 const destination=maps();destination.cards.delete('c2');
 const partial=remapScrumTransfer(withDaily(),destination);
 assert.equal(partial.transfer.dailyObservations[0].snapshot.partial,true);
 assert.equal(partial.transfer.dailyObservations[0].snapshot.missingEstimates,0);
 assert.ok(partial.losses.some(row=>row.path.startsWith('dailyObservations.')&&row.sourceId==='c2'));
});
test('old native payloads upgrade without inventing observations; malformed observations fail',()=>{
 const old=fixture();old.format='wekan-scrum-1';
 assert.deepEqual(normalizeScrumTransfer(old).dailyObservations,[]);
 for(const change of [
  s=>s.format='wekan-scrum-1',s=>s.dailyObservations=null,
  s=>s.dailyObservations[0].sprintId='foreign',
  s=>s.dailyObservations[0].day='2026-09-02',
  s=>s.dailyObservations[0].startedAt='2026-09-02T10:00:00Z',
  s=>s.dailyObservations[0].snapshot.at='2026-09-01T10:00:00Z',
  s=>s.dailyObservations[0].snapshot.unit='hours',
  s=>s.dailyObservations[0].consistency='transactional',
  s=>s.dailyObservations[0].boardId='foreign',
  s=>s.dailyObservations.push(structuredClone(s.dailyObservations[0])),
  s=>s.dailyObservations=Array(10001).fill(s.dailyObservations[0]),
 ]){const source=withDaily();change(source);assert.throws(()=>normalizeScrumTransfer(source),/Invalid Scrum transfer/);}
 const large=withDaily();
 const sample=large.dailyObservations[0];
 sample.snapshot.cards=Array.from({length:10000},(_,index)=>({cardId:`card-${index}`,listId:'l',estimate:0,done:false,archived:false}));
 sample.snapshot.missingEstimates=0;
 large.dailyObservations=Array.from({length:11},(_,index)=>({...sample,
  startedAt:`2026-08-${String(index+1).padStart(2,'0')}T10:00:00Z`}));
 // No cap on the cards a day observed (maintainer decision of 2026-10-03).
 assert.equal(normalizeScrumTransfer(large).dailyObservations.length,11);
});
test('native sprint snapshots agree with lifecycle timestamps and state',()=>{
 for(const change of [
  s=>s.startSnapshot.at='2026-08-31T10:00:00Z',
  s=>s.closeSnapshot.at='2026-09-03T10:00:00Z',
  s=>s.state='planned',
  s=>s.state='active',
  s=>{s.cancelledAt=s.completedAt;s.cancellationReason='Contradiction';},
 ]){
  const source=fixture();change(source.sprints[0]);
  assert.throws(()=>normalizeScrumTransfer(source),/lifecycle|snapshot timestamp/);
 }
 const source=fixture();const sprint=source.sprints[0];
 delete sprint.closeSnapshot;delete sprint.completedAt;delete sprint.rolloverSprintId;
 sprint.state='active';
 assert.equal(normalizeScrumTransfer(source).sprints[0].state,'active');
 sprint.state='cancelled';sprint.cancelledAt='2026-09-02T10:00:00Z';sprint.cancellationReason='Cancelled';
 assert.equal(normalizeScrumTransfer(source).sprints[0].state,'cancelled');
 sprint.cancelledAt='2026-08-31T10:00:00Z';
 assert.throws(()=>normalizeScrumTransfer(source),/cancelled before/);
 sprint.cancelledAt='2026-09-02T10:00:00Z';delete sprint.startSnapshot;
 assert.throws(()=>normalizeScrumTransfer(source),/lifecycle/);
 delete sprint.startedAt;
 assert.equal(normalizeScrumTransfer(source).sprints[0].state,'cancelled');
});
test('native Scrum transfer remaps every planning, metadata, actor and snapshot reference',()=>{
 const source=fixture();const before=structuredClone(source);
 const {transfer,losses}=remapScrumTransfer(source,maps());
 assert.deepEqual(source,before);assert.deepEqual(losses,[]);
 assert.equal(transfer.settings.productOwnerId,'new-u');assert.deepEqual(transfer.settings.developerIds,['new-u']);
 assert.equal(transfer.settings.estimateCustomFieldId,'new-cf');
 assert.equal(transfer.sprints[0].createdBy,'new-u');assert.equal(transfer.sprints[0].rolloverSprintId,'new-next');
 assert.equal(transfer.sprints[0].closeSnapshot.cards[0].cardId,'new-c1');
 assert.equal(transfer.sprints[0].closeSnapshot.cards[0].listId,'new-l');
 assert.equal(transfer.sprints[0].closeSnapshot.cards[0].estimate,0);assert.equal(transfer.sprints[0].closeSnapshot.cards[1].estimate,null);
 assert.equal(transfer.sprints[0].closeSnapshot.estimateCustomFieldId,'new-cf');
 assert.equal(transfer.events[0].sprintId,'new-s');assert.deepEqual(transfer.events[0].followUpCardIds,['new-c1','new-c2']);
 assert.equal(transfer.events[0].startsAt.toISOString(),'2026-09-02T09:30:12.123Z');
 assert.deepEqual(transfer.cards[0].scrum.pastSprintIds,['new-s']);assert.equal(transfer.cards[0].scrum.releaseId,'new-r');
 assert.equal(transfer.swimlanes[0].scrum.sprintId,'new-s');assert.equal(transfer.lists[0].scrum.category,'done');
 assert.deepEqual(normalizeScrumTransfer(JSON.parse(JSON.stringify(transfer))),transfer);
});
test('partial transfers report omitted cards and actors and mark recalculated snapshots partial',()=>{
 const destination=maps();destination.cards.delete('c2');destination.users.clear();
 const {transfer,losses}=remapScrumTransfer(fixture(),destination);
 assert.equal(transfer.settings.productOwnerId,null);assert.deepEqual(transfer.settings.developerIds,[]);
 assert.equal(transfer.sprints[0].createdBy,undefined);assert.equal(transfer.sprints[0].startSnapshot.partial,true);
 assert.equal(transfer.sprints[0].startSnapshot.missingEstimates,0);assert.equal(transfer.sprints[0].startSnapshot.totalEstimate,0);
 assert.equal(transfer.cards.length,1);assert.deepEqual(transfer.events[0].followUpCardIds,['new-c1']);
 assert.ok(losses.some(loss=>loss.sourceId==='c2'&&loss.path.includes('startSnapshot')));
 assert.ok(losses.some(loss=>loss.sourceId==='u'&&loss.path==='settings.productOwnerId'));
});
test('invalid versions, dates, totals, permissions, pending work and dangling references fail before writes',()=>{
 for(const [change,pattern] of [
  [x=>x.format='future',/version/],
  [x=>x.settings.isAdmin=true,/Unsupported field/],
  [x=>x.sprints[0].boardId='other-board',/Unsupported field/],
  [x=>x.sprints[0].rolloverPending=[{cardId:'c1'}],/Unsupported field/],
  [x=>x.events[0].startsAt='2026-02-30',/calendar/],
  [x=>x.sprints[0].startSnapshot.totalEstimate=100,/totals/],
  [x=>x.sprints[0].startSnapshot.cards[0].estimate=Infinity,/estimate/],
  [x=>x.sprints[0].startSnapshot.cards.push(x.sprints[0].startSnapshot.cards[0]),/duplicate/],
  [x=>delete x.sprints[0].closeSnapshot,/close snapshot/],
  [x=>x.sprints[0].closeSnapshot.unit='hours',/incompatible sprint snapshot unit/],
  [x=>x.sprints[0].closeSnapshot.estimateSource='poker',/incompatible sprint snapshot estimateSource/],
  [x=>x.sprints[0].closeSnapshot.estimateCustomFieldId='other-field',/incompatible sprint snapshot estimateCustomFieldId/],
  [x=>x.sprints[0].closeSnapshot.completionPolicy='doneLists',/incompatible sprint snapshot completionPolicy/],
  [x=>x.cards[0].scrum.sprintId='foreign',/foreign/],
  [x=>x.sprints[1]={...structuredClone(x.sprints[0]),_id:'next',rolloverSprintId:'s'},/cyclic/],
  [x=>x.settings.estimateCustomFieldId=null,/field is required/],
  [x=>x.releases.push({...x.releases[0]}),/duplicate/],
 ]){const source=fixture();change(source);assert.throws(()=>normalizeScrumTransfer(source),pattern);}
 const destination=maps();destination.customFields.clear();
 assert.throws(()=>remapScrumTransfer(fixture(),destination),/unmapped settings.estimateCustomFieldId/);
});
test('caller-owned maps reject ID collisions and do not treat prototype names as mapped IDs',()=>{
 const destination=maps();destination.cards.set('c2','new-c1');
 assert.throws(()=>remapScrumTransfer(fixture(),destination),/duplicate/);
 const snapshotsOnly=fixture();snapshotsOnly.cards=[];
 assert.throws(()=>remapScrumTransfer(snapshotsOnly,destination),/duplicate snapshot card/);
 const source=fixture();source.cards[0]._id='__proto__';
 const {transfer,losses}=remapScrumTransfer(source,maps());
 assert.equal(transfer.cards.length,1);assert.ok(losses.some(loss=>loss.sourceId==='__proto__'));
 assert.equal({}.scrum,undefined);
});
test('import loss reports are bounded plain data with explicit known reasons',()=>{
 const {normalizeScrumTransferLosses}=require('../models/lib/scrumTransfer');
 const report=[{path:'snapshot.cards',sourceId:'omitted',reason:'card-not-exported'}];
 assert.deepEqual(normalizeScrumTransferLosses(report),report);
 assert.deepEqual(normalizeScrumTransferLosses(),[]);
 assert.throws(()=>normalizeScrumTransferLosses([{...report[0],reason:'untrusted-markup'}]),/loss reason/);
 assert.throws(()=>normalizeScrumTransferLosses([{...report[0],extra:'unexpected'}]),/unsupported/);
});
test('deselecting Scrum removes its native payload and metadata without removing other content',async()=>{
 const fs=require('node:fs');const path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../models/lib/importParts.js'),'utf8');
 const {pruneImportDocument}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 const doc={title:'Keep',scrum:{enabled:true},scrumTransfer:fixture(),scrumTransferLosses:[],cards:[{title:'Card',scrum:{issueType:'Story'}}],lists:[],swimlanes:[]};
 pruneImportDocument(doc,['description']);
 assert.equal(doc.title,'Keep');assert.equal(doc.cards[0].title,'Card');
 assert.equal(doc.scrum,undefined);assert.equal(doc.scrumTransfer,undefined);assert.equal(doc.cards[0].scrum,undefined);
 const selected={scrumTransfer:fixture()};pruneImportDocument(selected,['scrum']);assert.ok(selected.scrumTransfer);
});

test('snapshot calendars round-trip without inventing legacy calendars',()=>{
 const source=fixture();
 assert.equal(normalizeScrumTransfer(source).sprints[0].startSnapshot.workingDays,undefined);
 source.sprints[0].startSnapshot.workingDays=[1,3,5];
 const {transfer}=remapScrumTransfer(source,maps());
 assert.deepEqual(transfer.sprints[0].startSnapshot.workingDays,[1,3,5]);
 for(const days of [[],[0],[8],['1']]){
  source.sprints[0].startSnapshot.workingDays=days;
  assert.throws(()=>normalizeScrumTransfer(source));
 }
});

test('cleared backlog ranks survive native transfer and remapping',()=>{
 const source=fixture();source.cards[0].scrum.backlogRank=null;
 assert.equal(normalizeScrumTransfer(source).cards[0].scrum.backlogRank,null);
 assert.equal(remapScrumTransfer(source,maps()).transfer.cards[0].scrum.backlogRank,null);
 source.cards[0].scrum.backlogRank=-1;
 assert.throws(()=>normalizeScrumTransfer(source));
});

// A stored record's `incarnation` (2026-09-30) names its lifetime, so export
// and board copy drop it instead of refusing the whole board ("Unsupported
// field: incarnation" made both answer 500).
test('a stored record\'s incarnation is dropped, not refused',()=>{
 const source=fixture();
 for (const row of [...source.sprints,...source.releases,...source.events]) row.incarnation='inc1';
 const out=normalizeScrumTransfer(source);
 for (const row of [...out.sprints,...out.releases,...out.events]) assert.equal(Object.hasOwn(row,'incarnation'),false);
 // Any other unknown field is still refused (negative).
 const bad=fixture();bad.sprints[1].somethingElse=1;
 assert.throws(()=>normalizeScrumTransfer(bad),/Unsupported field/);
});
