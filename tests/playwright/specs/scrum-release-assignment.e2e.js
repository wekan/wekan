'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(({method,args})=>Meteor.callAsync(method,...args),{method,args});
test('equal backlog ranks stay ordered by card ID after refresh and metadata edits',async({page,user,board})=>{
 const cards=db.find('cards',{boardId:board.boardId});
 for(const card of cards) db.updateOne('cards',{_id:card._id},{$set:{sort:0,'scrum.backlogRank':0}});
 const expected=cards.map(card=>card._id).sort();
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await page.locator('.js-toggle-board-view').first().click();
 await page.locator('.pop-over .js-open-product-backlog-view').click();
 const order=()=>page.locator('tr[data-card-id]').evaluateAll(rows=>rows.map(row=>row.dataset.cardId));
 await expect.poll(order).toEqual(expected);
 const form=page.locator(`form.js-scrum-card[data-card-id="${expected[0]}"]`);
 await form.locator('[name="issueType"]').fill('Story');
 await form.locator('button[type="submit"]').click();
 await expect.poll(()=>db.findOne('cards',{_id:expected[0]}).scrum?.issueType).toBe('Story');
 await page.locator('.js-scrum-refresh').click();
 await expect.poll(order).toEqual(expected);
 await page.reload();
 await expect.poll(order).toEqual(expected);
});
test('backlog release assignment saves, clears and restores through History',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  const release=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Planned delivery'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-product-backlog-view').click();
  const row=page.locator(`tr[data-card-id="${card._id}"]`);
  const form=row.locator('.js-scrum-card');
  // A card's releases are a multiple select since 2026-10-08
  // (scrum-multiple-releases.e2e.js); `releaseId` stays the first of them.
  await form.locator('[name="releaseIds"]').selectOption([release._id]);
  await form.locator('button[type="submit"]').click();
  await expect(row.locator('.scrum-card-release')).toHaveText('Planned delivery');
  await expect(form.locator('[name="releaseIds"]')).toHaveValue(release._id);
  await form.locator('[name="releaseIds"]').selectOption([]);
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseId).toBeNull();
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseIds).toEqual([]);
  await call(page,'changeHistory.undoLast',board.boardId);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBe(release._id);
  const current=db.findOne('cards',{_id:card._id});
  await expect(call(page,'scrum.updateCard',board.boardId,card._id,{releaseId:'foreign-release'},current.scrumRevision)).rejects.toThrow();
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBe(release._id);
  await call(page,'changeHistory.redoLast',board.boardId);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBeNull();
 }finally{db.deleteMany('scrumReleases',{boardId:board.boardId});}
});

test('negative board sort does not become a Scrum rank and explicit ranks can be cleared',async({page,user,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('cards',{_id:card._id},{$set:{sort:-42}});
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await page.locator('.js-toggle-board-view').first().click();
 await page.locator('.pop-over .js-open-product-backlog-view').click();
 const form=page.locator(`form.js-scrum-card[data-card-id="${card._id}"]`);
 const rank=form.locator('[name="backlogRank"]');
 await expect(rank).toHaveValue('');
 await form.locator('[name="issueType"]').fill('Story');
 await form.locator('button[type="submit"]').click();
 await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.issueType).toBe('Story');
 expect(db.findOne('cards',{_id:card._id}).scrum.backlogRank).toBeNull();
 await rank.fill('0');await form.locator('button[type="submit"]').click();
 await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.backlogRank).toBe(0);
 await expect(rank).toHaveValue('0');
 await rank.fill('');await form.locator('button[type="submit"]').click();
 await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.backlogRank).toBeNull();
 await call(page,'changeHistory.undoLast',board.boardId);
 expect(db.findOne('cards',{_id:card._id}).scrum.backlogRank).toBe(0);
 expect(db.findOne('cards',{_id:card._id}).sort).toBe(-42);
 const current=db.findOne('cards',{_id:card._id});
 await expect(call(page,'scrum.updateCard',board.boardId,card._id,{backlogRank:-1},current.scrumRevision)).rejects.toThrow();
});
