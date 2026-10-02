'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {canReceiveStoredNotification:allowed}=require('../server/lib/syncNotificationAccess');
const input={user:{_id:'u'},board:{_id:'b',members:[{userId:'u',isActive:true}],watchers:[{userId:'u',level:'watching'}]},
 card:{_id:'c',boardId:'b',listId:'l',assignees:[]},list:{_id:'l',boardId:'b'},activity:{boardId:'b',cardId:'c',listId:'l'}};
test('stored recipients require active membership, a live account and the exact card/list scope',()=>{
 assert.equal(allowed(input),true);
 for(const change of [x=>{x.user=null;},x=>{x.user.loginDisabled=true;},x=>{x.board.members[0].isActive=false;},
  x=>{x.card.boardId='other';},x=>{x.card.listId='other';},x=>{x.list.boardId='other';},x=>{x.board.members=[];}]){
  const x=structuredClone(input);change(x);assert.equal(allowed(x),false);
 }
});
test('assigned-only recipients must still be assigned and muted recipients need an explicit card/list subscription',()=>{
 for(const flag of ['isNormalAssignedOnly','isCommentAssignedOnly','isReadAssignedOnly']) {
  const x=structuredClone(input);x.board.members[0][flag]=true;assert.equal(allowed(x),false);
  x.card.assignees='u';assert.equal(allowed(x),false);
  x.card.assignees=['u'];assert.equal(allowed(x),true);
 }
 const x=structuredClone(input);x.board.watchers=[];assert.equal(allowed(x),false);
 x.list.watchers=['u'];assert.equal(allowed(x),true);x.list.watchers=[];x.card.watchers=['u'];assert.equal(allowed(x),true);
});
// Board-level activities (2026-10-03): no card or list named, none required -
// but one supplied that the activity does not name is refused, and an
// assigned-only member never receives a board-level event.
test('board-level activities: board watchers receive them, assigned-only members do not',()=>{
 const board={...structuredClone(input),card:null,list:null,activity:{boardId:'b'}};
 assert.equal(allowed(board),true);
 assert.equal(allowed({...board,card:input.card}),false,'a card the activity does not name');
 assert.equal(allowed({...board,list:input.list}),false,'a list the activity does not name');
 const restricted=structuredClone(board);restricted.board.members[0].isNormalAssignedOnly=true;
 assert.equal(allowed(restricted),false);
 // A card-level activity naming no list (moveCardBoard): the card, any list.
 const moved={...structuredClone(input),list:null,activity:{boardId:'b',cardId:'c'}};
 moved.card.listId='anywhere';assert.equal(allowed(moved),true);
 assert.equal(allowed({...moved,card:null}),false,'the card it names must be there');
 const {canWriteWebhookBoard}=require('../server/lib/syncWebhookAccess');
 assert.equal(canWriteWebhookBoard({user:{_id:'u'},board:input.board}),true);
 assert.equal(canWriteWebhookBoard({user:{_id:'u',loginDisabled:true},board:input.board}),false);
 assert.equal(canWriteWebhookBoard({user:{_id:'u'},board:{...input.board,members:[{userId:'u',isActive:true,isNormalAssignedOnly:true}]}}),false);
 const {notificationActivityIdentity}=require('../server/lib/syncNotificationPlan');
 assert.equal(notificationActivityIdentity({_id:'a',boardId:'b',userId:'u'}).cardId,null);
 assert.throws(()=>notificationActivityIdentity({_id:'a',boardId:'b',userId:'u',cardId:''}));
 const plans=require('node:fs').readFileSync(require('node:path').join(__dirname,'../server/notifications/storedRulePlans.js'),'utf8');
 assert.match(plans,/if \(options\.activity && options\.activity\.listId === undefined\) \{\n\s*if \(Object\.hasOwn\(TriggersDef, options\.activity\.activityType\)\) throw new Error\('sync-rule-stage-invalid'\);/);
});
