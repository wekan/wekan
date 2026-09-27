'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
test('Scrum team and working-day settings save through existing validation',async({page,user,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false}}});
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await page.locator('.js-toggle-board-view').first().click();
 await page.locator('.pop-over .js-open-sprints-view').click();
 const form=page.locator('.js-scrum-settings');
 await page.locator('.scrum-settings > summary').click();
 await expect(form).toBeVisible();
 await form.locator('[name="productOwnerId"]').selectOption(user.id);
 await form.locator('[name="scrumMasterId"]').selectOption(user2.id);
 await form.locator('[name="developerIds"]').selectOption([user.id,user2.id]);
 await form.locator('[name="workingDays"]').selectOption(['1','3','5','7']);
 await form.locator('button[type="submit"]').click();
 await expect.poll(()=>db.findOne('boards',{_id:board.boardId}).scrum?.workingDays).toEqual([1,3,5,7]);
 const saved=db.findOne('boards',{_id:board.boardId});
 expect(saved.scrum.productOwnerId).toBe(user.id);expect(saved.scrum.scrumMasterId).toBe(user2.id);
 expect(saved.scrum.developerIds).toEqual([user.id,user2.id]);
 await expect(form.locator('[name="scrumMasterId"]')).toHaveValue(user2.id);
 const rejects=await page.evaluate(async({boardId,revision})=>{
  const results=[];
  for(const settings of [{developerIds:['foreign-user']},{workingDays:[]},{workingDays:[8]}]){
   try{await Meteor.callAsync('scrum.configure',boardId,settings,revision);results.push(false);}catch(error){results.push(true);}
  }return results;
 },{boardId:board.boardId,revision:saved.scrumRevision});
 expect(rejects).toEqual([true,true,true]);
 expect(db.findOne('boards',{_id:board.boardId}).scrum).toEqual(saved.scrum);
 if(!await form.isVisible())await page.locator('.scrum-settings > summary').click();
 await form.locator('[name="productOwnerId"]').selectOption('');
 await form.locator('[name="developerIds"]').selectOption([]);
 await form.locator('button[type="submit"]').click();
 await expect.poll(()=>db.findOne('boards',{_id:board.boardId}).scrum?.developerIds).toEqual([]);
 expect(db.findOne('boards',{_id:board.boardId}).scrum.productOwnerId).toBeNull();
 await page.evaluate(id=>Meteor.callAsync('changeHistory.undoLast',id),board.boardId);
 expect(db.findOne('boards',{_id:board.boardId}).scrum.developerIds).toEqual([user.id,user2.id]);
 await page.evaluate(id=>Meteor.callAsync('changeHistory.redoLast',id),board.boardId);
 expect(db.findOne('boards',{_id:board.boardId}).scrum.developerIds).toEqual([]);
 expect(db.findOne('boards',{_id:board.boardId}).members.find(member=>member.userId===user2.id).isAdmin).toBe(false);
 await loginWithToken(page,user2.id,user2.token);
 const denied=await page.evaluate(async id=>{try{await Meteor.callAsync('scrum.configure',id,{workingDays:[2]},null);return false;}catch(error){return error.error==='not-authorized';}},board.boardId);
 expect(denied).toBe(true);
});
