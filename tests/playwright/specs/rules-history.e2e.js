'use strict';
const { openRulesMenuEntry } = require('../helpers/rulesMenu');
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
const {loginWithToken,navigateInApp,openBoard}=require('../helpers/auth');
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
 await openRulesMenuEntry(page,'js-open-rules-history');
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

test('Rules REST writes create one attributed History entry per compound operation',async({page,request,board,user,user2})=>{
 await loginWithToken(page,user.id,user.token);
 const headers={Authorization:`Bearer ${user.token}`};
 const base=`/api/boards/${board.boardId}/rules`;
 const payload={title:'REST original',trigger:{activityType:'createCard'},action:{actionType:'archive'}};
 const created=await request.post(base,{headers,data:payload});expect(created.status()).toBe(200);
 const ids=await created.json();
 expect(rows(board.boardId)).toHaveLength(1);
 expect(rows(board.boardId)[0].userId).toBe(user.id);
 const edited=await request.put(`${base}/${ids._id}`,{headers,data:{title:'REST edited',enabled:false,trigger:{activityType:'moveCard',listName:'Done'},action:{actionType:'unarchive'}}});
 expect(edited.status()).toBe(200);expect(rows(board.boardId)).toHaveLength(2);
 const entry=rows(board.boardId).find(row=>row.changeType==='edited');
 expect(entry.previousContent.rule.title).toBe('REST original');expect(entry.newContent.action.actionType).toBe('unarchive');
 expect(entry.newContent.rule.enabled).toBe(false);expect(entry.userId).toBe(user.id);
 await call(page,'changeHistory.undoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('REST original');
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('archive');
 await call(page,'changeHistory.redoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('REST edited');
 const before=rows(board.boardId).length;
 const unchanged=await request.put(`${base}/${ids._id}`,{headers,data:{}});
 expect(unchanged.status()).toBe(200);expect(rows(board.boardId)).toHaveLength(before);
 const denied=await request.put(`${base}/${ids._id}`,{headers:{Authorization:`Bearer ${user2.token}`},data:{title:'Denied'}});
 expect(denied.status()).not.toBe(200);expect(rows(board.boardId)).toHaveLength(before);
 const deleted=await request.delete(`${base}/${ids._id}`,{headers});expect(deleted.status()).toBe(200);
 expect(rows(board.boardId)).toHaveLength(before+1);
 expect(db.findOne('rules',{_id:ids._id})).toBeNull();
 await call(page,'changeHistory.undoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).title).toBe('REST edited');
 expect(db.findOne('triggers',{_id:ids.triggerId}).activityType).toBe('moveCard');
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('unarchive');
});

for(const transport of ['method','REST'])test(`${transport} deletion preserves shared rule components and History restores without overwriting them`,async({page,request,board,user})=>{
 await loginWithToken(page,user.id,user.token);
 const ids=await call(page,'rules.createRule',board.boardId,'Shared original',{activityType:'createCard'},{actionType:'archive'});
 const original=db.findOne('rules',{_id:ids._id});const sibling=db.uid('sharedRule');
 db.insertOne('rules',{...original,_id:sibling,title:'Shared sibling'});
 const remove=async()=>{
  if(transport==='method')await call(page,'rules.deleteRule',ids._id);
  else expect((await request.delete(`/api/boards/${board.boardId}/rules/${ids._id}`,{headers:{Authorization:`Bearer ${user.token}`}})).status()).toBe(200);
 };
 await remove();
 expect(db.findOne('rules',{_id:sibling})).not.toBeNull();
 expect(db.findOne('triggers',{_id:ids.triggerId})).not.toBeNull();
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('archive');
 expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
 expect(db.findOne('rules',{_id:ids._id}).triggerId).toBe(ids.triggerId);
 await remove();
 db.updateOne('actions',{_id:ids.actionId},{$set:{actionType:'unarchive'}});
 const outcome=await page.evaluate(async id=>{try{return await Meteor.callAsync('changeHistory.undoLast',id);}catch(error){return {error:error.error};}},board.boardId);
 expect(outcome.undone).not.toBe(true);
 expect(db.findOne('rules',{_id:ids._id})).toBeNull();
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('unarchive');
 await call(page,'rules.deleteRule',sibling);
 expect(db.findOne('actions',{_id:ids.actionId})).toBeNull();
 expect(db.findOne('triggers',{_id:ids.triggerId})).toBeNull();
});

for(const transport of ['method','REST'])test(`${transport} editing isolates shared rule components and supports undo/redo`,async({page,request,board,user})=>{
 await loginWithToken(page,user.id,user.token);
 const ids=await call(page,'rules.createRule',board.boardId,'Shared edit',{activityType:'createCard'},{actionType:'archive'});
 const original=db.findOne('rules',{_id:ids._id});const sibling=db.uid('sharedEdit');
 db.insertOne('rules',{...original,_id:sibling,title:'Untouched sibling'});
 const before=rows(board.boardId).length;
 if(transport==='method')await call(page,'rules.updateRule',ids._id,'Isolated edit',{activityType:'moveCard',listName:'Done'},{actionType:'unarchive'});
 else expect((await request.put(`/api/boards/${board.boardId}/rules/${ids._id}`,{headers:{Authorization:`Bearer ${user.token}`},data:{title:'Isolated edit',trigger:{activityType:'moveCard',listName:'Done'},action:{actionType:'unarchive'}}})).status()).toBe(200);
 const edited=db.findOne('rules',{_id:ids._id});
 expect(edited.triggerId).not.toBe(ids.triggerId);expect(edited.actionId).not.toBe(ids.actionId);
 expect(rows(board.boardId)).toHaveLength(before+1);
 expect(db.findOne('rules',{_id:sibling}).actionId).toBe(ids.actionId);
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('archive');
 expect(db.findOne('triggers',{_id:ids.triggerId}).activityType).toBe('createCard');
 await call(page,'changeHistory.undoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).actionId).toBe(ids.actionId);
 expect(db.findOne('actions',{_id:edited.actionId})).toBeNull();
 expect(db.findOne('triggers',{_id:edited.triggerId})).toBeNull();
 await call(page,'changeHistory.redoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).actionId).toBe(edited.actionId);
 expect(db.findOne('actions',{_id:edited.actionId}).actionType).toBe('unarchive');
 expect(db.findOne('actions',{_id:ids.actionId}).actionType).toBe('archive');
});

for(const transport of ['method','REST'])test(`${transport} button trigger changes synchronize menu metadata and History`,async({page,request,board,user})=>{
 await loginWithToken(page,user.id,user.token);
 const base=`/api/boards/${board.boardId}/rules`,headers={Authorization:`Bearer ${user.token}`};
 const trigger={activityType:'button',buttonType:'board',buttonLabel:'Manual action'},action={actionType:'archive'};
 let ids;
 if(transport==='method')ids=await call(page,'rules.createRule',board.boardId,'Button rule',trigger,action);
 else {const response=await request.post(base,{headers,data:{title:'Button rule',trigger,action}});expect(response.status()).toBe(200);ids=await response.json();}
 expect(db.findOne('rules',{_id:ids._id}).buttonType).toBe('board');
 await openBoard(page,board.boardId,board.slug);
 const button=page.locator(`.js-run-board-button[data-rule-id="${ids._id}"]`);
 await expect(button).toBeVisible();
 const changed={activityType:'createCard'};
 if(transport==='method')await call(page,'rules.updateRule',ids._id,'Automatic rule',changed,action);
 else expect((await request.put(`${base}/${ids._id}`,{headers,data:{title:'Automatic rule',trigger:changed}})).status()).toBe(200);
 expect(db.findOne('rules',{_id:ids._id}).buttonType).toBeUndefined();
 expect(db.findOne('rules',{_id:ids._id}).buttonLabel).toBeUndefined();
 await expect(button).toHaveCount(0);
 await call(page,'changeHistory.undoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).buttonType).toBe('board');
 expect(db.findOne('rules',{_id:ids._id}).buttonLabel).toBe('Manual action');
 await expect(button).toBeVisible();
 await call(page,'changeHistory.redoLast',board.boardId);
 expect(db.findOne('rules',{_id:ids._id}).buttonType).toBeUndefined();
 await expect(button).toHaveCount(0);
});
