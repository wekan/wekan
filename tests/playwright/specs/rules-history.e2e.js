'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
const {loginWithToken,navigateInApp}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(async ({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(e){throw new Error(`${method}: ${e.error}: ${e.reason || e.message}`);}},{method,args});
function rows(boardId){return db.find('changeHistory',{boardId,entityType:'rule'});}

test('rule create, compound edit, enable and delete use existing history and reversible snapshots',async({page,board,user})=>{
 await loginWithToken(page,user.id,user.token);
 await navigateInApp(page,`/b/${board.boardId}/${board.slug}/rules`);
 const ids=await call(page,'rules.createRule',board.boardId,'Original rule',{activityType:'createCard',listName:'*',userId:'*',advanced:{preserve:true}},{actionType:'archive'});
 await expect.poll(()=>rows(board.boardId).length).toBe(1);
 await call(page,'rules.updateRule',ids._id,'Edited rule',{activityType:'moveCard',listName:'Done',userId:'*'},{actionType:'unarchive'});
 await expect.poll(()=>rows(board.boardId).length).toBe(2);
 const edit=rows(board.boardId).find(r=>r.changeType==='edited');
 expect(edit.previousContent.trigger.advanced).toEqual({preserve:true});
 expect(edit.newContent.action.actionType).toBe('unarchive');
 expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('Original rule');
 expect(db.findOne('triggers',{_id:ids.triggerId}).advanced).toEqual({preserve:true});
 expect((await call(page,'changeHistory.redoLast',board.boardId)).redone).toBe(true);
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('Edited rule');
 await call(page,'rules.setEnabled',ids._id,false);
 expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
 expect(db.findOne('rules',{_id:ids._id}).enabled).toBe(true);
 await call(page,'rules.deleteRule',ids._id);
 expect(db.findOne('rules',{_id:ids._id})).toBeNull();
 expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('unarchive');
 await page.locator('.js-toggle-page-sidebar').first().click();
 await page.locator('.js-rules-history').click();
 await expect(page.locator('.history-table')).toBeVisible();
 const added=rows(board.boardId).find(r=>r.changeType==='added');
 await page.locator(`.js-history-select[data-id="${added._id}"]`).click();
 await page.locator('.js-history-restore').click();
 await expect.poll(()=>db.findOne('rules',{_id:ids._id}).title).toBe('Original rule');
 expect(db.findOne('triggers',{_id:ids.triggerId}).advanced).toEqual({preserve:true});
});

test('ordinary board members cannot restore rule configuration through History',async({page,board,user,user2})=>{
 await loginWithToken(page,user.id,user.token);
 const ids=await call(page,'rules.createRule',board.boardId,'Protected',{activityType:'createCard'},{actionType:'archive'});
 const row=rows(board.boardId)[0];
 db.addBoardMember({boardId:board.boardId,userId:user2.id});
 await loginWithToken(page,user2.id,user2.token);
 const error=await page.evaluate(async id=>{try{await Meteor.callAsync('changeHistory.restore',id);return null;}catch(e){return e.error;}},row._id);
 expect(error).toBe('not-authorized');
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('Protected');
 expect(rows(board.boardId)).toHaveLength(1);
});

test('undo refuses to overwrite another administrator’s newer rule edit',async({page,board,user,user2})=>{
 await loginWithToken(page,user.id,user.token);
 const ids=await call(page,'rules.createRule',board.boardId,'Before',{activityType:'createCard'},{actionType:'archive'});
 await call(page,'rules.updateRule',ids._id,'My edit',{activityType:'createCard'},{actionType:'unarchive'});
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isAdmin:true,isActive:true}}});
 await loginWithToken(page,user2.id,user2.token);
 await call(page,'rules.setEnabled',ids._id,false);
 await loginWithToken(page,user.id,user.token);
 const error=await page.evaluate(async id=>{try{await Meteor.callAsync('changeHistory.undoLast',id);return null;}catch(e){return e.error;}},board.boardId);
 expect(error).toBe('history-conflict');
 expect(db.findOne('rules',{_id:ids._id}).enabled).toBe(false);
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('My edit');
});
