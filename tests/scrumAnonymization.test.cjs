'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../models/lib/importExportSecurity.js'),'utf8');
const helpers=import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('Scrum anonymization rewrites known mentions in native and canonical prose without rewriting IDs or units',async()=>{
 const {anonymizeBoardTextInPlace}=await helpers;
 const data={scrum:{productGoal:'Ask @alice',definitionOfDone:'Reviewed by @alice',productOwnerId:'alice'},
  cards:[{_id:'alice',scrum:{issueType:'Story for @alice',acceptanceCriteria:'@alice approves',sprintId:'alice'}}],
  swimlanes:[{scrum:{purpose:'Team @alice',sprintId:'alice'}}],
  scrumTransfer:{settings:{productGoal:'@alice plans',estimateUnit:'@alice',developerIds:['alice']},
   sprints:[{_id:'alice',name:'@alice sprint',goal:'For @alice',cancellationReason:'@alice postponed',provenance:{recordId:'@alice'},startSnapshot:{unit:'@alice',cards:[{cardId:'alice',estimate:0}]}}],
   releases:[{name:'@alice release',notes:'@alice published'}],events:[{name:'Review @alice',notes:'Ask @alice and @unknown',followUpCardIds:['alice']}],
   cards:[{_id:'alice',scrum:{acceptanceCriteria:'@alice verifies'}}],swimlanes:[{scrum:{purpose:'@alice team'}}]}};
 anonymizeBoardTextInPlace(data,new Map([['alice','user1']]));
 assert.equal(data.scrum.productGoal,'Ask @user1');assert.equal(data.scrum.definitionOfDone,'Reviewed by @user1');
 assert.equal(data.scrum.productOwnerId,'alice');assert.equal(data.cards[0]._id,'alice');
 assert.equal(data.cards[0].scrum.acceptanceCriteria,'@user1 approves');assert.equal(data.cards[0].scrum.sprintId,'alice');
 assert.equal(data.swimlanes[0].scrum.purpose,'Team @user1');
 const transfer=data.scrumTransfer;
 assert.equal(transfer.settings.productGoal,'@user1 plans');assert.equal(transfer.settings.estimateUnit,'@alice');
 assert.equal(transfer.sprints[0].cancellationReason,'@user1 postponed');assert.equal(transfer.sprints[0].provenance.recordId,'@alice');
 assert.equal(transfer.sprints[0].startSnapshot.unit,'@alice');assert.equal(transfer.sprints[0].startSnapshot.cards[0].estimate,0);
 assert.equal(transfer.releases[0].notes,'@user1 published');assert.equal(transfer.events[0].notes,'Ask @user1 and @unknown');
 assert.deepEqual(transfer.events[0].followUpCardIds,['alice']);
 assert.equal(transfer.cards[0].scrum.acceptanceCriteria,'@user1 verifies');assert.equal(transfer.swimlanes[0].scrum.purpose,'@user1 team');
});
test('empty or unrelated Scrum data is left unchanged',async()=>{
 const {anonymizeBoardTextInPlace}=await helpers;
 const data={scrum:{productGoal:'No mention',estimateUnit:'points'},swimlanes:[{scrum:{purpose:'Team'}}]};
 const original=structuredClone(data);
 anonymizeBoardTextInPlace(data,new Map());assert.deepEqual(data,original);
 anonymizeBoardTextInPlace(null,new Map());
 const transformed=Object.assign(Object.create({cards(){throw new Error('must not query');},swimlanes(){throw new Error('must not query');}}),{scrum:{productGoal:'@alice'}});
 anonymizeBoardTextInPlace(transformed,new Map([['alice','user1']]));
 assert.equal(transformed.scrum.productGoal,'@user1');
});
