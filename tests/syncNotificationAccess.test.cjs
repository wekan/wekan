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
