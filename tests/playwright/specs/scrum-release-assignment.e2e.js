'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(({method,args})=>Meteor.callAsync(method,...args),{method,args});
test('backlog release assignment saves, clears and restores through History',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  const release=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Planned delivery'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-product-backlog-view').click();
  const row=page.locator(`tr[data-card-id="${card._id}"]`);
  const form=row.locator('.js-scrum-card');
  await form.locator('[name="releaseId"]').selectOption(release._id);
  await form.locator('button[type="submit"]').click();
  await expect(row.locator('.scrum-card-release')).toHaveText('Planned delivery');
  await expect(form.locator('[name="releaseId"]')).toHaveValue(release._id);
  await form.locator('[name="releaseId"]').selectOption('');
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseId).toBeNull();
  await call(page,'changeHistory.undoLast',board.boardId);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBe(release._id);
  const current=db.findOne('cards',{_id:card._id});
  await expect(call(page,'scrum.updateCard',board.boardId,card._id,{releaseId:'foreign-release'},current.scrumRevision)).rejects.toThrow();
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBe(release._id);
  await call(page,'changeHistory.redoLast',board.boardId);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBeNull();
 }finally{db.deleteMany('scrumReleases',{boardId:board.boardId});}
});
