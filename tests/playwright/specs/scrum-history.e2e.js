'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(async({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(e){throw new Error(`${e.error}: ${e.reason||e.message}`);}},{method,args});
function clean(boardId){for(const collection of ['scrumSprints','scrumReleases','scrumEvents','scrumHistoryCompletions','scrumHistoryRequests'])db.deleteMany(collection,{boardId});db.deleteOne('scrumHistoryPending',{_id:boardId});}
test('Scrum views open the existing board History filtered to Scrum changes',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  await call(page,'scrum.saveSprint',board.boardId,null,{name:'Visible Scrum History'},null);
  await page.locator('.js-toggle-board-view').first().click();
  await page.locator('.pop-over .js-open-sprints-view').click();
  await page.locator('.js-scrum-history').click();
  await expect(page.locator('.pop-over .history-table')).toBeVisible();
  await expect(page.locator('.pop-over .history-rows')).toContainText('Visible Scrum History');
  const row=db.findOne('changeHistory',{boardId:board.boardId,entityType:'scrum'});
  await page.locator(`.js-history-select[data-id="${row._id}"]`).click();
  await page.locator('.js-history-restore').click();
  await expect.poll(()=>db.find('changeHistory',{boardId:board.boardId,restoredFromId:row._id}).length).toBe(1);
 }finally{clean(board.boardId);}
});
test('Scrum changes use History and undo a sprint close with all card moves as one operation',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'History sprint',plannedStart:'2026-09-01',plannedEnd:'2026-09-30'},null);
  const next=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Next sprint'},null);
  const cards=db.find('cards',{boardId:board.boardId});
  for(const card of cards)await call(page,'scrum.updateCard',board.boardId,card._id,{sprintId:sprint._id},0);
  const active=await call(page,'scrum.startSprint',board.boardId,sprint._id,sprint.revision);
  const before=db.find('changeHistory',{boardId:board.boardId,entityType:'scrum'}).length;
  await call(page,'scrum.closeSprint',board.boardId,sprint._id,active.revision,next._id);
  expect(db.find('changeHistory',{boardId:board.boardId,entityType:'scrum'}).length).toBe(before+1);
  const close=db.find('changeHistory',{boardId:board.boardId,entityType:'scrum'}).find(row=>row.newContent.records.some(r=>r.type==='scrum-sprint'&&r.document?.state==='closed'));
  expect(close.newContent.records).toHaveLength(4);
  expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
  expect(db.findOne('scrumSprints',{_id:sprint._id}).state).toBe('active');
  for(const card of cards)expect(db.findOne('cards',{_id:card._id}).scrum.sprintId).toBe(sprint._id);
  expect(db.findOne('scrumHistoryPending',{_id:board.boardId})).toBe(null);
  expect(db.find('scrumHistoryCompletions',{boardId:board.boardId,rowId:close._id,direction:'undo'})).toHaveLength(1);
  expect((await call(page,'changeHistory.redoLast',board.boardId)).redone).toBe(true);
  expect(db.find('scrumHistoryCompletions',{boardId:board.boardId,rowId:close._id,direction:'redo'})).toHaveLength(1);
  expect(db.findOne('scrumSprints',{_id:sprint._id}).state).toBe('closed');
  for(const card of cards)expect(db.findOne('cards',{_id:card._id}).scrum.sprintId).toBe(next._id);
 }finally{clean(board.boardId);}
});
test('Scrum metadata history preserves unrelated card edits and rejects conflicting metadata',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story',acceptanceCriteria:'Initial criteria'},0);
  db.updateOne('cards',{_id:card._id},{$set:{title:'Unrelated later title'}});
  expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
  expect(db.findOne('cards',{_id:card._id}).title).toBe('Unrelated later title');
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBeUndefined();
  expect((await call(page,'changeHistory.redoLast',board.boardId)).redone).toBe(true);
  db.updateOne('cards',{_id:card._id},{$set:{'scrum.issueType':'Newer edit'},$inc:{scrumRevision:1}});
  await expect(call(page,'changeHistory.undoLast',board.boardId)).rejects.toThrow(/scrum-conflict/);
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Newer edit');
 }finally{clean(board.boardId);}
});
test('ordinary board writers cannot restore administrator sprint configuration',async({page,user,user2,board})=>{
 try{
  db.addBoardMember({boardId:board.boardId,userId:user2.id});
  await loginWithToken(page,user.id,user.token);
  await call(page,'scrum.saveSprint',board.boardId,null,{name:'Admin plan'},null);
  const row=db.findOne('changeHistory',{boardId:board.boardId,entityType:'scrum'});
  await loginWithToken(page,user2.id,user2.token);
  await expect(call(page,'changeHistory.restore',[row._id])).rejects.toThrow(/not-authorized/);
  expect(db.findOne('scrumSprints',{boardId:board.boardId}).name).toBe('Admin plan');
 }finally{clean(board.boardId);}
});
test('planning record creation can be undone and redone without deleting referenced releases',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Event sprint'},null);
  for(const [method,collection,values] of [
    ['scrum.saveRelease','scrumReleases',{name:'History release',state:'planned'}],
    ['scrum.saveEvent','scrumEvents',{sprintId:sprint._id,kind:'review',startsAt:'2026-09-30T12:00:00Z'}],
  ]){
    const record=await call(page,method,board.boardId,null,values,null);
    expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
    expect(db.findOne(collection,{_id:record._id})).toBe(null);
    expect((await call(page,'changeHistory.redoLast',board.boardId)).redone).toBe(true);
    expect(db.findOne(collection,{_id:record._id})).not.toBe(null);
  }
  const release=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Referenced release'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  db.updateOne('cards',{_id:card._id},{$set:{'scrum.releaseId':release._id}});
  await expect(call(page,'changeHistory.undoLast',board.boardId)).rejects.toThrow(/scrum-conflict/);
  expect(db.findOne('scrumReleases',{_id:release._id})).not.toBe(null);
  expect(db.findOne('scrumHistoryPending',{_id:board.boardId})).toBe(null);
 }finally{clean(board.boardId);}
});
function dates(value){
 if(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value))return new Date(value);
 if(Array.isArray(value))return value.map(dates);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,dates(v)]));
 return value;
}
test('retry after Scrum undo finalization does not undo an older row or duplicate its timeline',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story'},0);
  const row=db.findOne('changeHistory',{boardId:board.boardId,entityType:'scrum'});
  const revision=db.findOne('cards',{_id:card._id}).scrumRevision;
  await call(page,'changeHistory.undoLast',board.boardId);
  const checkpoint=db.findOne('changeHistory',{boardId:board.boardId,restoredFromId:row._id,isCheckpoint:true});
  const count=db.find('changeHistory',{boardId:board.boardId}).length;
  const undoneAt=db.findOne('changeHistory',{_id:row._id}).undoneAt;
  const appliedRevision=db.findOne('cards',{_id:card._id}).scrumRevision;
  // Recreate the durable state before completion receipt persistence and
  // checkpoint cleanup. Leaving the receipt from the completed fixture undo
  // would test a historical completion, not unfinished undo finalization.
  db.deleteOne('scrumHistoryCompletions',{_id:checkpoint.batchId});
  db.insertOne('scrumHistoryPending',dates({_id:board.boardId,rowId:row._id,direction:'undo',userId:user.id,
    operationId:checkpoint.batchId,content:row.previousContent,before:row.newContent,revisions:[revision]}));
  expect(checkpoint._id).toMatch(/^scrum-restore-[a-f0-9]{64}$/);
  // A matching operation ID must not acknowledge damaged timeline evidence.
  db.updateOne('changeHistory',{_id:checkpoint._id},{$set:{integrityHash:'damaged'}});
  await expect(call(page,'changeHistory.undoLast',board.boardId)).rejects.toThrow(/scrum-history-pending/);
  expect(db.findOne('scrumHistoryPending',{_id:board.boardId})).not.toBe(null);
  expect(db.find('changeHistory',{boardId:board.boardId}).length).toBe(count);
  db.updateOne('changeHistory',{_id:checkpoint._id},{$set:{integrityHash:checkpoint.integrityHash}});
  // An acknowledged timeline is insufficient if undo finalization is damaged.
  db.updateOne('changeHistory',{_id:row._id},{$set:{undoneAt:null}});
  await expect(call(page,'changeHistory.undoLast',board.boardId)).rejects.toThrow(/scrum-history-pending/);
  expect(db.findOne('scrumHistoryPending',{_id:board.boardId})).not.toBe(null);
  db.updateOne('changeHistory',{_id:row._id},{$set:{undoneAt:new Date(undoneAt)}});
  expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
  expect(db.find('changeHistory',{boardId:board.boardId}).length).toBe(count);
  expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(appliedRevision);
  expect(db.findOne('changeHistory',{_id:row._id}).undoneAt).toBe(undoneAt);
  expect(db.findOne('scrumHistoryPending',{_id:board.boardId})).toBe(null);
 }finally{clean(board.boardId);}
});
test('an interrupted compound Scrum undo resumes without repeating completed writes',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Recoverable close',plannedStart:'2026-09-01',plannedEnd:'2026-09-30'},null);
  const cards=db.find('cards',{boardId:board.boardId});
  for(const card of cards)await call(page,'scrum.updateCard',board.boardId,card._id,{sprintId:sprint._id},0);
  const active=await call(page,'scrum.startSprint',board.boardId,sprint._id,sprint.revision);
  await call(page,'scrum.closeSprint',board.boardId,sprint._id,active.revision,null);
  const row=db.find('changeHistory',{boardId:board.boardId,entityType:'scrum'}).find(row=>row.newContent.records.some(r=>r.type==='scrum-sprint'&&r.document?.state==='closed'));
  const revisions=row.newContent.records.map(entry=>{
    const doc=db.findOne(entry.type==='card'?'cards':'scrumSprints',{_id:entry.id});
    return entry.type==='card'?doc.scrumRevision:doc.revision;
  });
  db.insertOne('scrumHistoryPending',dates({_id:board.boardId,rowId:row._id,direction:'undo',userId:user.id,content:row.previousContent,before:row.newContent,revisions}));
  const first=row.previousContent.records.find(entry=>entry.type==='card');
  db.updateOne('cards',{_id:first.id},{$set:{scrum:first.document.scrum},$inc:{scrumRevision:1}});
  const alreadyAppliedRevision=db.findOne('cards',{_id:first.id}).scrumRevision;
  await expect(call(page,'scrum.configure',board.boardId,{productGoal:'Must wait'})).rejects.toThrow(/scrum-history-pending/);
  expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
  expect(db.findOne('cards',{_id:first.id}).scrumRevision).toBe(alreadyAppliedRevision);
  expect(db.findOne('scrumSprints',{_id:sprint._id}).state).toBe('active');
  for(const card of cards)expect(db.findOne('cards',{_id:card._id}).scrum.sprintId).toBe(sprint._id);
  expect(db.findOne('scrumHistoryPending',{_id:board.boardId})).toBe(null);
 }finally{clean(board.boardId);}
});
test('pending Scrum redo cannot revive a source invalidated by a newer ordinary edit',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story'},0);
  const row=db.findOne('changeHistory',{boardId:board.boardId,entityType:'scrum'});
  await call(page,'changeHistory.undoLast',board.boardId);
  const undone=db.findOne('cards',{_id:card._id});
  const operationId='superseded-redo';
  db.insertOne('scrumHistoryPending',dates({_id:board.boardId,rowId:row._id,direction:'redo',userId:user.id,
    operationId,content:row.newContent,before:row.previousContent,revisions:[undone.scrumRevision]}));
  // This ordinary edit runs real redo invalidation while recovery is pending.
  await call(page,'/cards/update',{_id:card._id},{$set:{title:'Newer ordinary edit'}});
  expect(db.findOne('changeHistory',{_id:row._id}).superseded).toBe(true);
  const count=db.find('changeHistory',{boardId:board.boardId}).length;
  for(let attempt=0;attempt<2;attempt++){
   await expect(call(page,'changeHistory.redoLast',board.boardId)).rejects.toThrow(/scrum-conflict/);
   const current=db.findOne('cards',{_id:card._id});
   expect(current.scrum).toEqual(undone.scrum);
   expect(current.scrumRevision).toBe(undone.scrumRevision);
   expect(current.title).toBe('Newer ordinary edit');
   expect(db.findOne('changeHistory',{_id:row._id}).undone).toBe(true);
   expect(db.findOne('scrumHistoryPending',{_id:board.boardId}).operationId).toBe(operationId);
   expect(db.find('changeHistory',{boardId:board.boardId}).length).toBe(count);
  }
 }finally{clean(board.boardId);}
});
test('matching restored Scrum values at a newer revision cannot complete an old checkpoint',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story'},0);
  const row=db.findOne('changeHistory',{boardId:board.boardId,entityType:'scrum'});
  const revision=db.findOne('cards',{_id:card._id}).scrumRevision;
  await call(page,'changeHistory.undoLast',board.boardId);
  const checkpoint=db.findOne('changeHistory',{boardId:board.boardId,restoredFromId:row._id,isCheckpoint:true});
  db.insertOne('scrumHistoryPending',dates({_id:board.boardId,rowId:row._id,direction:'undo',userId:user.id,
    operationId:checkpoint.batchId,content:row.previousContent,before:row.newContent,revisions:[revision]}));
  // Model an intervening writer returning to the same values. Equality of
  // projected Scrum content must not hide the newer revision from recovery.
  db.updateOne('cards',{_id:card._id},{$inc:{scrumRevision:1}});
  const current=db.findOne('cards',{_id:card._id});
  const count=db.find('changeHistory',{boardId:board.boardId}).length;
  for(let retry=0;retry<2;retry++){
   await expect(call(page,'changeHistory.undoLast',board.boardId)).rejects.toThrow(/scrum-conflict/);
   expect(db.findOne('cards',{_id:card._id}).scrum).toEqual(current.scrum);
   expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(current.scrumRevision);
   expect(db.findOne('scrumHistoryPending',{_id:board.boardId}).operationId).toBe(checkpoint.batchId);
   expect(db.find('changeHistory',{boardId:board.boardId}).length).toBe(count);
  }
 }finally{clean(board.boardId);}
});

test('keyed Scrum undo and redo return their original result without moving the stack again',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story'},0);
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Bug'},1);
  const undoId='undo-request-'+db.uid(),redoId='redo-request-'+db.uid();
  const first=await call(page,'changeHistory.undoLast',board.boardId,undoId);
  expect(first.undone).toBe(true);
  const revision=db.findOne('cards',{_id:card._id}).scrumRevision;
  const count=db.find('changeHistory',{boardId:board.boardId}).length;
  // Reload the actual browser to discard in-memory method state and then retry.
  await page.reload();
  await loginWithToken(page,user.id,user.token);
  expect(await call(page,'changeHistory.undoLast',board.boardId,undoId)).toEqual(first);
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Story');
  expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(revision);
  expect(db.find('changeHistory',{boardId:board.boardId}).length).toBe(count);
  const redo=await call(page,'changeHistory.redoLast',board.boardId,redoId);
  expect(redo.redone).toBe(true);
  const afterRedo=db.findOne('cards',{_id:card._id});
  expect(afterRedo.scrum.issueType).toBe('Bug');
  expect(await call(page,'changeHistory.undoLast',board.boardId,undoId)).toEqual(first);
  expect(await call(page,'changeHistory.redoLast',board.boardId,redoId)).toEqual(redo);
  expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(afterRedo.scrumRevision);
  await expect(call(page,'changeHistory.redoLast',board.boardId,undoId)).rejects.toThrow(/scrum-history-request-conflict/);
  expect(db.find('scrumHistoryRequests',{boardId:board.boardId})).toHaveLength(2);
  expect((await call(page,'changeHistory.undoLast',board.boardId,'new-undo-'+db.uid())).undone).toBe(true);
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Story');
  expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(afterRedo.scrumRevision+1);
 }finally{clean(board.boardId);}
});

test('keyed empty and unsupported History requests never reselect later Scrum work',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);
  const card=db.find('cards',{boardId:board.boardId})[0];
  db.deleteMany('changeHistory',{boardId:board.boardId});
  const emptyId='empty-request-'+db.uid();
  expect(await call(page,'changeHistory.undoLast',board.boardId,emptyId)).toEqual({undone:false});
  // An ordinary title edit is deliberately outside this keyed Scrum contract.
  await call(page,'/cards/update',{_id:card._id},{$set:{title:'Ordinary title'}});
  const unsupportedId='other-request-'+db.uid();
  await expect(call(page,'changeHistory.undoLast',board.boardId,unsupportedId)).rejects.toThrow(/scrum-history-request-unsupported/);
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story'},0);
  expect(await call(page,'changeHistory.undoLast',board.boardId,emptyId)).toEqual({undone:false});
  await expect(call(page,'changeHistory.undoLast',board.boardId,unsupportedId)).rejects.toThrow(/scrum-history-request-unsupported/);
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Story');
  expect(db.findOne('cards',{_id:card._id}).title).toBe('Ordinary title');
  await expect(call(page,'changeHistory.undoLast',board.boardId,'short')).rejects.toThrow(/scrum-history-request-conflict/);
 }finally{clean(board.boardId);}
});

test('Ctrl+Z sends a persisted request ID, retries it after a lost reply, and falls back for ordinary edits',async({page,user,board})=>{
 try{
  // Seeded users have keyboard shortcuts switched off in their profile.
  db.updateOne('users',{_id:user.id},{$set:{'profile.keyboardShortcuts':true}});
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Story'},0);
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Bug'},1);
  await call(page,'scrum.updateCard',board.boardId,card._id,{issueType:'Epic'},2);
  await page.locator('body').click({position:{x:5,y:5}});
  await page.keyboard.press('Control+z');
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Bug');
  const requests=db.find('scrumHistoryRequests',{boardId:board.boardId});
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(()=>sessionStorage.getItem('wekan-history-key-request'))).toBeNull();
  // A keystroke whose undo ran but whose reply was lost before the tab
  // reloaded: its ID is still stored, so the next Ctrl+Z repeats THAT request
  // and leaves Story in place instead of also undoing Story.
  const requestId='lost-reply-'+db.uid().replace(/[^A-Za-z0-9_-]/g,'');
  await call(page,'changeHistory.undoLast',board.boardId,requestId);
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Story');
  const revision=db.findOne('cards',{_id:card._id}).scrumRevision;
  await page.evaluate(({boardId,requestId})=>sessionStorage.setItem('wekan-history-key-request',
    JSON.stringify({boardId,direction:'undo',requestId,at:Date.now()})),{boardId:board.boardId,requestId});
  await page.reload();await openBoard(page,board.boardId,board.slug);
  await page.locator('body').click({position:{x:5,y:5}});
  await page.keyboard.press('Control+z');
  await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('wekan-history-key-request'))).toBeNull();
  expect(db.find('scrumHistoryRequests',{boardId:board.boardId})).toHaveLength(2);
  expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(revision);
  expect(db.findOne('cards',{_id:card._id}).scrum.issueType).toBe('Story');
  // An ordinary title edit is outside the keyed contract: Ctrl+Z still undoes it.
  const rows=db.find('changeHistory',{boardId:board.boardId}).length;
  await call(page,'/cards/update',{_id:card._id},{$set:{title:'Keyboard title'}});
  await expect.poll(()=>db.find('changeHistory',{boardId:board.boardId}).length).toBeGreaterThan(rows);
  await page.keyboard.press('Control+z');
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).title).not.toBe('Keyboard title');
 }finally{clean(board.boardId);}
});
