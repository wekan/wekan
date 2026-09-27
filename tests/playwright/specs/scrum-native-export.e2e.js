'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(({method,args})=>Meteor.callAsync(method,...args),{method,args});
test('private board export refuses assigned-only members instead of exposing unassigned data',async({request,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isReadAssignedOnly:true}}});
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('cards',{_id:card._id},{$set:{assignees:[user2.id]}});
 const response=await request.get(`/api/boards/${board.boardId}/export?authToken=${encodeURIComponent(user2.token)}`);
 expect(response.status()).toBe(403);
 expect(await response.text()).not.toContain('Beta Card');
});
test('native export carries Scrum records and scopes snapshots and selected fields',async({page,request,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Export sprint',plannedStart:'2026-09-01',plannedEnd:'2026-09-30'},null);
  const unrelated=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Unrelated plan'},null);
  const cards=db.find('cards',{boardId:board.boardId});
  for(const card of cards)await call(page,'scrum.updateCard',board.boardId,card._id,{sprintId:sprint._id},0);
  const active=await call(page,'scrum.startSprint',board.boardId,sprint._id,sprint.revision);
  await call(page,'scrum.closeSprint',board.boardId,sprint._id,active.revision,null);
  await call(page,'scrum.saveEvent',board.boardId,null,{kind:'review',name:'Review export',sprintId:sprint._id,startsAt:'2026-09-30T09:00:00Z',followUpCardIds:cards.map(c=>c._id)},null);
  const url=`/api/boards/${board.boardId}/export?authToken=${encodeURIComponent(user.token)}`;
  const fullResponse=await request.get(url);expect(fullResponse.status()).toBe(200);
  const full=await fullResponse.json();expect(full.scrumTransfer.format).toBe('wekan-scrum-1');
  expect(full.scrumTransfer.sprints).toHaveLength(2);expect(full.scrumTransferLosses).toEqual([]);
  const closed=full.scrumTransfer.sprints.find(s=>s._id===sprint._id);
  expect(closed.closeSnapshot.cards).toHaveLength(3);expect(closed.rolloverPending).toBeUndefined();expect(closed.closedFromRevision).toBeUndefined();
  expect(closed.revision).toBeUndefined();expect(closed.boardId).toBeUndefined();
  const scopedResponse=await request.get(`${url}&cardId=${cards[0]._id}`);expect(scopedResponse.status()).toBe(200);
  const scoped=await scopedResponse.json();
  expect(scoped.scrumTransfer.sprints.some(s=>s._id===unrelated._id)).toBe(false);
  expect(scoped.scrumTransfer.sprints[0].closeSnapshot.cards).toHaveLength(1);
  expect(scoped.scrumTransfer.sprints[0].closeSnapshot.partial).toBe(true);
  expect(scoped.scrumTransfer.events[0].followUpCardIds).toEqual([cards[0]._id]);
  expect(scoped.scrumTransferLosses.length).toBeGreaterThan(0);
  const omittedResponse=await request.get(`${url}&fields=board-header,description`);expect(omittedResponse.status()).toBe(200);
  const omitted=await omittedResponse.json();expect(omitted.scrumTransfer).toBeUndefined();expect(omitted.scrum).toBeUndefined();
  for(const card of omitted.cards)expect(card.scrum).toBeUndefined();
  db.updateOne('boards',{_id:board.boardId},{$set:{scrum:{estimateSource:'customField',estimateCustomFieldId:'omitted-estimate-field'}}});
  const partialResponse=await request.get(`${url}&fields=scrum`);expect(partialResponse.status()).toBe(200);
  const partial=await partialResponse.json();
  expect(partial.scrumTransferLosses).toContainEqual({path:'customFields',sourceId:'omitted-estimate-field',reason:'estimate-field-not-exported'});
 }finally{for(const collection of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(collection,{boardId:board.boardId});}
});
