'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(async({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(e){throw new Error(`${e.error}: ${e.reason||e.message}`);}},{method,args});
function clean(boardId){for(const collection of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(collection,{boardId});db.deleteOne('scrumHistoryPending',{_id:boardId});}
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
  expect((await call(page,'changeHistory.redoLast',board.boardId)).redone).toBe(true);
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
  const appliedRevision=db.findOne('cards',{_id:card._id}).scrumRevision;
  // Recreate the durable state immediately before checkpoint cleanup.
  db.insertOne('scrumHistoryPending',dates({_id:board.boardId,rowId:row._id,direction:'undo',userId:user.id,
    operationId:checkpoint.batchId,content:row.previousContent,before:row.newContent,revisions:[revision]}));
  expect((await call(page,'changeHistory.undoLast',board.boardId)).undone).toBe(true);
  expect(db.find('changeHistory',{boardId:board.boardId}).length).toBe(count);
  expect(db.findOne('cards',{_id:card._id}).scrumRevision).toBe(appliedRevision);
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
