'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(async({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(error){throw new Error(`${error.error}: ${error.reason||error.message}`);}},{method,args});
test('administrator resumes an interrupted close from Sprints without bypassing History recovery',async({page,browser,user,user2,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Interrupted close',plannedStart:'2026-09-01',plannedEnd:'2026-09-30'},null);
  const next=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Recovery destination'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{sprintId:sprint._id},0);
  const active=await call(page,'scrum.startSprint',board.boardId,sprint._id,sprint.revision);
  const before=db.findOne('cards',{_id:card._id});
  // Reproduce the persisted checkpoint after closing, before moving the card.
  db.updateOne('scrumSprints',{_id:sprint._id},{$set:{state:'closed',revision:active.revision+1,closedFromRevision:active.revision,rolloverSprintId:next._id,
   completedAt:new Date(),closeSnapshot:{...active.startSnapshot,at:new Date()},
   rolloverPending:[{cardId:card._id,revision:before.scrumRevision,before:before.scrum,after:{...before.scrum,sprintId:next._id,pastSprintIds:[sprint._id]}}]}});
  db.insertOne('scrumHistoryPending',{_id:board.boardId,rowId:'pending-history',userId:user.id,direction:'undo'});
  await expect(call(page,'scrum.closeSprint',board.boardId,sprint._id,active.revision,next._id)).rejects.toThrow(/scrum-history-pending/);
  expect(db.findOne('cards',{_id:card._id}).scrum.sprintId).toBe(sprint._id);
  db.deleteOne('scrumHistoryPending',{_id:board.boardId});
  db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isReadOnly:true}}});
  const viewerContext=await browser.newContext();
  try{
    const viewer=await viewerContext.newPage();
    await loginWithToken(viewer,user2.id,user2.token);await openBoard(viewer,board.boardId,board.slug);
    await viewer.locator('.js-toggle-board-view').first().click();await viewer.locator('.pop-over .js-open-sprints-view').click();
    await viewer.locator('.js-scrum-sprint').selectOption(sprint._id);
    await expect(viewer.locator('.js-scrum-resume-close')).toHaveCount(0);
    await expect(call(viewer,'scrum.closeSprint',board.boardId,sprint._id,active.revision,next._id)).rejects.toThrow(/not-authorized/);
  }finally{await viewerContext.close();}
  await openBoard(page,board.boardId,board.slug);
  await page.locator('.js-toggle-board-view').first().click();await page.locator('.pop-over .js-open-sprints-view').click();
  await page.locator('.js-scrum-sprint').selectOption(sprint._id);
  await page.locator('.js-scrum-resume-close').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum.sprintId).toBe(next._id);
  await expect(page.locator('.js-scrum-resume-close')).toHaveCount(0);
  expect(db.findOne('scrumSprints',{_id:sprint._id}).rolloverPending).toEqual([]);
 }finally{db.deleteOne('scrumHistoryPending',{_id:board.boardId});for(const c of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(c,{boardId:board.boardId});}
});
