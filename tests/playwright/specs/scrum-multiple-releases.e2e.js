'use strict';
// More than one release per card (2026-10-08): the Product Backlog's and the
// card details' multiple select, the release reports counting a card in each
// of its releases, History undo, and the refusals - a release of another
// board, a contradiction - with duplicates collapsed and a card written the
// old way (`releaseId` alone) still shown and editable.
// Pure coverage: tests/scrumMultipleReleases.test.cjs.
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(async({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(e){throw new Error(`${e.error}: ${e.reason||e.message}`);}},{method,args});
const view=async(page,name)=>{await page.locator('.js-toggle-board-view').first().click();await page.locator(`.pop-over .js-open-${name}-view`).click();};
const selected=locator=>locator.evaluate(select=>[...select.selectedOptions].map(option=>option.value));
function clean(boardIds){for(const boardId of boardIds)for(const collection of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(collection,{boardId});}

test('the Product Backlog puts a card in several releases, reports it in each, and undoes',async({page,user,board})=>{
 const foreign=db.seedBoard({ownerId:user.id,title:'Other releases'});
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  const first=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Spring'},null);
  const second=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Autumn'},null);
  const elsewhere=await call(page,'scrum.saveRelease',foreign.boardId,null,{name:'Spring'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await view(page,'product-backlog');
  const row=page.locator(`tr[data-card-id="${card._id}"]`);
  const form=row.locator('.js-scrum-card');
  const releases=form.locator('select[name="releaseIds"]');
  expect(await releases.evaluate(select=>select.multiple)).toBe(true);
  await releases.selectOption([first._id,second._id]);
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseIds).toEqual([first._id,second._id]);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBe(first._id);
  await expect(row.locator('.scrum-card-release')).toHaveText('Spring, Autumn');
  expect(await selected(releases)).toEqual([first._id,second._id]);
  // The release reports count the card once in each release.
  await view(page,'sprints');
  for(const release of [first,second])await expect(page.locator(`.scrum-release-scope[data-release-id="${release._id}"]`)).toContainText(/\b1 cards\b/);
  // Down to one, then back through History.
  await view(page,'product-backlog');
  await releases.selectOption([second._id]);
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseIds).toEqual([second._id]);
  await call(page,'changeHistory.undoLast',board.boardId);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseIds).toEqual([first._id,second._id]);
  await call(page,'changeHistory.redoLast',board.boardId);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseIds).toEqual([second._id]);
  // Negative: another board's release (even of the same name) is refused, and
  // so is a releaseId that contradicts the list; nothing changes.
  let current=db.findOne('cards',{_id:card._id});
  await expect(call(page,'scrum.updateCard',board.boardId,card._id,{releaseIds:[first._id,elsewhere._id]},current.scrumRevision)).rejects.toThrow(/invalid-scrum/);
  await expect(call(page,'scrum.updateCard',board.boardId,card._id,{releaseIds:[first._id],releaseId:second._id},current.scrumRevision)).rejects.toThrow(/invalid-scrum/);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseIds).toEqual([second._id]);
  // Duplicates collapse.
  await call(page,'scrum.updateCard',board.boardId,card._id,{releaseIds:[first._id,first._id,second._id]},current.scrumRevision);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseIds).toEqual([first._id,second._id]);
  // Cleared: no release at all.
  await page.reload();await view(page,'product-backlog');
  await releases.selectOption([]);
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseIds).toEqual([]);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBeNull();
  await expect(row.locator('.scrum-card-release')).toHaveText('—');
  // A card written the old way still shows, counts and saves.
  current=db.findOne('cards',{_id:card._id});
  const legacy={...current.scrum};delete legacy.releaseIds;legacy.releaseId=second._id;
  db.updateOne('cards',{_id:card._id},{$set:{scrum:legacy}});
  await page.reload();await view(page,'product-backlog');
  await expect(row.locator('.scrum-card-release')).toHaveText('Autumn');
  expect(await selected(releases)).toEqual([second._id]);
  await releases.selectOption([second._id,first._id]);
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseIds?.length).toBe(2);
 }finally{clean([board.boardId,foreign.boardId]);}
});

test('the card details edit a card\'s releases with a multiple select',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  await call(page,'scrum.configure',board.boardId,{enabled:true,visibility:{cardRelease:true,minicardRelease:true}},0);
  const first=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Alpha'},null);
  const second=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Beta'},null);
  const card=db.find('cards',{boardId:board.boardId})[0];
  await call(page,'scrum.updateCard',board.boardId,card._id,{releaseIds:[first._id,second._id]},0);
  await expect(page.locator('.minicard .scrum-metadata',{hasText:'Alpha, Beta'})).toHaveCount(1);
  await page.locator('.minicard',{hasText:card.title}).first().click();
  const details=page.locator('.js-card-details');
  await expect(details.locator('.scrum-metadata')).toContainText('Alpha, Beta');
  await details.locator('.scrum-metadata details > summary').click();
  const select=details.locator('.js-scrum-metadata select[name="releaseIds"]');
  expect(await select.evaluate(element=>element.multiple)).toBe(true);
  expect(await selected(select)).toEqual([first._id,second._id]);
  await select.selectOption([second._id]);
  await details.locator('.js-scrum-metadata button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:card._id}).scrum?.releaseIds).toEqual([second._id]);
  expect(db.findOne('cards',{_id:card._id}).scrum.releaseId).toBe(second._id);
  await expect(details.locator('.scrum-metadata')).toContainText('Beta');
 }finally{clean([board.boardId]);}
});
