'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(async({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(error){throw new Error(`${error.error}: ${error.reason||error.message}`);}},{method,args});
function clean(boardId){for(const collection of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(collection,{boardId});db.cleanup({boardIds:[boardId]});}
test('board duplication remaps Scrum planning and metadata and can omit Scrum entirely',async({page,user,board})=>{
 const copies=[];
 try{
  await loginWithToken(page,user.id,user.token);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Copied sprint',plannedStart:'2026-09-01',plannedEnd:'2026-09-30'},null);
  const release=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Copied release'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  db.updateOne('cards',{_id:card._id},{$set:{syncExternalId:'COPY-1',syncSourceType:'jira',syncLastSource:{title:card.title}}});
  await call(page,'scrum.updateCard',board.boardId,card._id,{sprintId:sprint._id,releaseId:release._id,acceptanceCriteria:'Copied criteria'},0);
  await call(page,'scrum.updateSwimlane',board.boardId,board.swimlaneId,{sprintId:sprint._id,releaseId:release._id,purpose:'Copied team'},0);
  await call(page,'scrum.updateList',board.boardId,card.listId,{category:'doing'},0);
  const active=await call(page,'scrum.startSprint',board.boardId,sprint._id,sprint.revision);
  await call(page,'scrum.closeSprint',board.boardId,sprint._id,active.revision,null);
  const copy=await call(page,'copyBoard',board.boardId,{});copies.push(copy);
  const copiedSprint=db.findOne('scrumSprints',{boardId:copy});expect(copiedSprint._id).not.toBe(sprint._id);
  const copiedCard=db.findOne('cards',{boardId:copy,title:card.title});
  for(const key of ['syncExternalId','syncSourceType','syncLastSource'])expect(copiedCard[key]).toBeUndefined();
  expect(db.findOne('cards',{_id:card._id}).syncExternalId).toBe('COPY-1');
  expect(copiedCard.scrum.pastSprintIds).toEqual([copiedSprint._id]);expect(copiedCard.scrum.acceptanceCriteria).toBe('Copied criteria');
  expect(copiedCard.scrum.releaseId).toBe(db.findOne('scrumReleases',{boardId:copy})._id);
  expect(copiedSprint.closeSnapshot.cards[0].cardId).toBe(copiedCard._id);
  expect(copiedSprint.closeSnapshot.cards[0].listId).toBe(copiedCard.listId);
  expect(db.findOne('lists',{_id:copiedCard.listId}).scrum.category).toBe('doing');
  const lane=db.findOne('swimlanes',{_id:copiedCard.swimlaneId});expect(lane.scrum.sprintId).toBe(copiedSprint._id);
  expect(db.find('changeHistory',{boardId:copy,entityType:'scrum'})).toHaveLength(0);
  expect(db.findOne('cards',{_id:card._id}).scrum.pastSprintIds).toEqual([sprint._id]);
  const omitted=await call(page,'copyBoard',board.boardId,{copyOptions:{scrum:false}});copies.push(omitted);
  expect(db.find('scrumSprints',{boardId:omitted})).toHaveLength(0);
  expect(db.findOne('boards',{_id:omitted}).scrum).toBeUndefined();
  for(const item of db.find('cards',{boardId:omitted}))expect(item.scrum).toBeUndefined();
  for(const item of db.find('swimlanes',{boardId:omitted}))expect(item.scrum).toBeUndefined();
  const structure=await call(page,'copyBoard',board.boardId,{withoutCards:true});copies.push(structure);
  expect(db.find('cards',{boardId:structure})).toHaveLength(0);
  expect(db.findOne('scrumSprints',{boardId:structure}).closeSnapshot.partial).toBe(true);
  expect(db.findOne('scrumSprints',{boardId:structure}).closeSnapshot.cards).toEqual([]);
  const copiedBoard=db.findOne('boards',{_id:structure});
  await openBoard(page,structure,copiedBoard.slug);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-velocity-view').click();
  await expect(page.locator('.scrum-table')).toContainText('This sprint contains only part of the original snapshot.');
 }finally{for(const id of copies)clean(id);for(const collection of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(collection,{boardId:board.boardId});}
});
