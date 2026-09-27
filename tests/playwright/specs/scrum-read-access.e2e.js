'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
test('read-only members can view Scrum repeatedly without being treated as attempted writers',async({page,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isReadOnly:true}}});
 await loginWithToken(page,user2.id,user2.token);await openBoard(page,board.boardId,board.slug);
 await page.locator('.js-toggle-board-view').first().click();await page.locator('.pop-over .js-open-sprints-view').click();
 await expect(page.locator('.js-scrum-sprint')).toBeVisible();
 await expect(page.locator('.js-scrum-sprint-form')).toHaveCount(0);
 for(let n=0;n<2;n++){
  const data=await page.evaluate(id=>Meteor.callAsync('scrum.getBoardData',id),board.boardId);
  expect(data.canAdmin).toBe(false);expect(data.cards).toHaveLength(3);expect(data.cards.every(c=>!c.canWrite)).toBe(true);
 }
 expect(await page.evaluate(()=>Meteor.userId())).toBe(user2.id);
 await expect(page.locator('.js-scrum-sprint')).toBeVisible();
});
