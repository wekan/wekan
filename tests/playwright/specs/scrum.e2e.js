'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
async function view(page,slug){
 await page.locator('.js-toggle-board-view').first().click();
 await page.locator(`.pop-over .js-open-${slug}-view`).click();
 await expect(page.locator('.scrum-view')).toBeVisible();
 await expect(page.locator('.scrum-view [role="status"]')).toHaveCount(0);
}
const call=(page,method,...args)=>page.evaluate(async({method,args})=>{try{return await Meteor.callAsync(method,...args);}catch(e){throw new Error(`${e.error}: ${e.reason||e.message}`);}},{method,args});
function cleanup(boardId){for(const collection of ['scrumSprints','scrumReleases','scrumEvents'])db.deleteMany(collection,{boardId});}

test('Scrum menus plan work, retain closed snapshots and export Excel/PDF',async({page,request,user,board})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const cards=db.find('cards',{boardId:board.boardId});
 db.updateOne('cards',{_id:cards[0]._id},{$set:{'poker.estimation':3,dueComplete:true}});
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  await call(page,'scrum.configure',board.boardId,{workingDays:[7]},0);
  await view(page,'sprints');
  await page.locator('.scrum-view summary').filter({hasText:'Create or edit a planned sprint'}).click();
  const form=page.locator('.js-scrum-sprint-form');
  await form.locator('[name="name"]').fill('Browser sprint');
  await form.locator('[name="goal"]').fill('Deliver verified planning');
  await form.locator('[name="plannedStart"]').fill('2026-09-01');
  await form.locator('[name="plannedEnd"]').fill('2026-09-30');
  await form.locator('button[type="submit"]').click();
  await expect.poll(()=>db.find('scrumSprints',{boardId:board.boardId}).length).toBe(1);
  const sprint=db.findOne('scrumSprints',{boardId:board.boardId});
  await view(page,'product-backlog');
  const card=page.locator(`form.js-scrum-card[data-card-id="${cards[0]._id}"]`);
  await card.locator('[name="sprintId"]').selectOption(sprint._id);
  await card.locator('[name="backlogRank"]').fill('2');
  await card.locator('[name="acceptanceCriteria"]').fill('A retained result\nA working export');
  await card.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('cards',{_id:cards[0]._id}).scrum?.sprintId).toBe(sprint._id);
  await view(page,'sprints');
  await page.locator('.js-scrum-sprint').selectOption(sprint._id);
  await page.locator('.js-scrum-start').click();
  await expect(page.locator('.js-scrum-close')).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('.js-scrum-close').click();
  await expect.poll(()=>db.findOne('scrumSprints',{_id:sprint._id}).state).toBe('closed');
  expect(db.findOne('scrumSprints',{_id:sprint._id}).startSnapshot.workingDays).toEqual([7]);
  await call(page,'scrum.configure',board.boardId,{workingDays:[1,2,3,4,5]},db.findOne('boards',{_id:board.boardId}).scrumRevision);
  await view(page,'velocity');
  await expect(page.locator('.scrum-working-days')).toHaveText('4');
  await expect(page.locator('.scrum-table tbody')).toContainText('Browser sprint');
  await expect(page.locator('.scrum-chart-row')).toHaveCount(1);
  await expect(page.locator('.scrum-chart-label').first()).toContainText('1');
  await page.locator('.js-scrum-chart-metric').selectOption('estimate');
  await expect(page.locator('.scrum-chart-label').first()).toContainText('3');
  expect(await page.locator('.scrum-chart-bar').first().evaluate(el => el.style.width)).toBe('100%');
  await page.setViewportSize({width:375,height:812});
  const fits=await page.locator('.scrum-chart').evaluate(el=>el.scrollWidth<=el.clientWidth);
  expect(fits).toBe(true);
  await page.setViewportSize({width:1280,height:900});
  const excel=await request.get(`/api/boards/${board.boardId}/charts/scrumVelocity/exportExcel?authToken=${encodeURIComponent(user.token)}`);
  expect(excel.status()).toBe(200);expect(excel.headers()['content-type']).toContain('spreadsheet');
  const Excel=require('../../../node_modules/@wekanteam/exceljs');
  const workbook=new Excel.Workbook();await workbook.xlsx.load(await excel.body());
  expect(workbook.worksheets[0].getCell('A3').value).toBe('Browser sprint');
  expect(workbook.worksheets[0].getCell('R3').value).toBe(4);
  expect(workbook.worksheets[0].getCell('S3').value).toBe('poker');
  expect(workbook.worksheets[0].getCell('U3').value).toBe('dueComplete');
  expect(workbook.worksheets[0].getCell('V3').value).toBe(1);
  expect(workbook.worksheets[0].getCell('W3').value).toBe(3);
  expect(workbook.worksheets[0].getCell('X3').value).toBe(0);
  const pdf=await request.get(`/api/boards/${board.boardId}/charts/scrumSprint/exportPDF?authToken=${encodeURIComponent(user.token)}&sprintId=${sprint._id}`);
  expect(pdf.status()).toBe(200);expect((await pdf.body()).subarray(0,4).toString()).toBe('%PDF');
  await view(page,'sprint-report');
  await page.locator('.js-scrum-sprint').selectOption(sprint._id);
  // The sprint report's own rows: the daily and change-by-change charts below
  // it use the same series markup and load on their own time.
  const report=page.locator('figure.scrum-chart-row:not(.scrum-daily-row):not(.scrum-scope-row)');
  await expect(report.locator('.scrum-chart-series')).toHaveCount(5);
  await expect(report.locator('.scrum-chart-label').last()).toContainText('0');
  expect(errors).toEqual([]);
 }finally{cleanup(board.boardId);}
});

test('Scrum fields default hidden and non-admin members cannot configure or start sprints',async({page,user,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isAdmin:false,isActive:true,isReadOnly:true}}});
 await loginWithToken(page,user2.id,user2.token);await openBoard(page,board.boardId,board.slug);
 await expect(page.locator('.minicard .scrum-metadata')).toHaveCount(0);
 await view(page,'sprints');
 await expect(page.locator('.js-scrum-settings')).toHaveCount(0);
 await expect(page.locator('.js-scrum-sprint-form')).toHaveCount(0);
 await expect(page.locator('.js-scrum-release')).toHaveCount(0);
 await expect(page.locator('.js-scrum-event')).toHaveCount(0);
 await expect(page.locator('.js-scrum-card')).toHaveCount(0);
 await expect(call(page,'scrum.configure',board.boardId,{enabled:true})).rejects.toThrow(/not-authorized/);
 await expect(call(page,'scrum.saveSprint',board.boardId,null,{name:'Forbidden'},null)).rejects.toThrow(/not-authorized/);
 await expect(call(page,'scrum.saveRelease',board.boardId,null,{name:'Forbidden'},null)).rejects.toThrow(/not-authorized/);
 await expect(call(page,'scrum.saveEvent',board.boardId,null,{name:'Forbidden'},null)).rejects.toThrow(/not-authorized/);
});

test('Board Settings reveals Scrum minicard fields and preserves independent card visibility',async({page,user,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('cards',{_id:card._id},{$set:{scrum:{issueType:'Story',backlogRank:4},scrumRevision:1}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await expect(page.locator('.minicard .scrum-metadata')).toHaveCount(0);
 // The issue type is a minicard badge on every board now, not a Scrum toggle.
 await expect(page.locator('.minicard .minicard-issue-type',{hasText:'Story'})).toHaveCount(1);
 await page.evaluate(()=>{Popup.close();const opener=document.body;Popup.open('boardCardSettings')({currentTarget:opener,target:opener,preventDefault(){},stopPropagation(){}});});
 const popup=page.locator('.pop-over[data-popup="boardCardSettingsPopup"]');
 await expect(popup).toBeVisible();
 // Every Scrum field is a row of both columns (2026-10-02), "Scrum settings: <field>",
 // ordered with the other rows; the old separate Scrum checkbox list is gone.
 await expect(popup.locator('input.js-scrum-visibility')).toHaveCount(0);
 for(const side of ['card','minicard']){
  const row=popup.locator(`.js-card-field-order-row[data-side="${side}"][data-key="scrumBacklogRank"]`);
  await expect(row).toContainText('Scrum settings: Backlog rank');
  await expect(popup.locator(`.js-card-field-order-row[data-side="${side}"][data-key="scrumSprint"]`)).toContainText('Scrum settings: Sprint');
 }
 await popup.locator('.js-card-field-order-row[data-side="minicard"][data-key="scrumBacklogRank"] .card-field-order-toggle').click();
 await expect.poll(()=>db.findOne('boards',{_id:board.boardId}).scrum?.visibility?.minicardBacklogRank).toBe(true);
 expect(db.findOne('boards',{_id:board.boardId}).scrum?.visibility?.cardBacklogRank).not.toBe(true);
 // The minicard's work item type row is the badge's own switch, on by default.
 const issueType=popup.locator('.js-card-field-order-row[data-side="minicard"][data-key="scrumIssueType"] .card-field-order-toggle');
 await expect(issueType).toHaveClass(/is-checked/);
 await issueType.click();
 await expect.poll(()=>db.findOne('boards',{_id:board.boardId}).allowsIssueTypeOnMinicard).toBe(false);
 await expect(page.locator('.minicard .minicard-issue-type')).toHaveCount(0);
 await issueType.click();
 await expect(page.locator('.minicard .minicard-issue-type',{hasText:'Story'})).toHaveCount(1);
 await popup.locator('.js-close-pop-over').click();
 await expect(page.locator('.minicard .scrum-metadata').filter({hasText:'4'})).toHaveCount(1);
 expect(errors).toEqual([]);
});

test('release and event editors update existing records and retain linked follow-up cards',async({page,user,board})=>{
 try{
  await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Editor sprint'},null);
  await view(page,'sprints');
  const releaseForm=page.locator('.js-scrum-release');
  await releaseForm.locator('[name="name"]').fill('Release one');
  await releaseForm.locator('[name="plannedStart"]').fill('2026-09-01');
  await releaseForm.locator('[name="plannedEnd"]').fill('2026-09-30');
  await releaseForm.locator('button[type="submit"]').click();
  await expect.poll(()=>db.find('scrumReleases',{boardId:board.boardId}).length).toBe(1);
  const release=db.findOne('scrumReleases',{boardId:board.boardId});
  await page.locator('.js-scrum-release-select').selectOption(release._id);
  await expect(releaseForm.locator('[name="name"]')).toHaveValue('Release one');
  await releaseForm.locator('[name="name"]').fill('Release revised');
  await releaseForm.locator('[name="state"]').selectOption('released');
  await releaseForm.locator('[name="releasedAt"]').fill('2026-09-27T13:45');
  await releaseForm.locator('[name="notes"]').fill('Release notes\nSecond line');
  await releaseForm.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('scrumReleases',{_id:release._id}).state).toBe('released');
  expect(db.find('scrumReleases',{boardId:board.boardId})).toHaveLength(1);
  await page.locator('.js-scrum-sprint').selectOption(sprint._id);
  const eventForm=page.locator('.js-scrum-event');
  await eventForm.locator('[name="name"]').fill('Review one');
  await eventForm.locator('[name="kind"]').selectOption('review');
  await eventForm.locator('[name="startsAt"]').fill('2026-09-28T09:30:12.123');
  const card=db.find('cards',{boardId:board.boardId})[0];
  await eventForm.locator('[name="followUpCardIds"]').selectOption(card._id);
  await eventForm.locator('button[type="submit"]').click();
  await expect.poll(()=>db.find('scrumEvents',{boardId:board.boardId}).length).toBe(1);
  const record=db.findOne('scrumEvents',{boardId:board.boardId});
  await page.locator('.js-scrum-event-select').selectOption(record._id);
  await expect(eventForm.locator('[name="startsAt"]')).toHaveValue('2026-09-28T09:30:12.123');
  await expect(eventForm.locator('[name="followUpCardIds"]')).toHaveValues([card._id]);
  await eventForm.locator('[name="notes"]').fill('Review outcome\nFollow up with the linked card');
  await eventForm.locator('button[type="submit"]').click();
  await expect.poll(()=>db.findOne('scrumEvents',{_id:record._id}).notes).toContain('Review outcome');
  expect(db.find('scrumEvents',{boardId:board.boardId})).toHaveLength(1);
  expect(db.findOne('scrumEvents',{_id:record._id}).followUpCardIds).toEqual([card._id]);
  expect(db.findOne('scrumEvents',{_id:record._id}).startsAt).toBe(record.startsAt);
  await call(page,'changeHistory.undoLast',board.boardId);
  expect(db.findOne('scrumEvents',{_id:record._id}).notes).toBe('');
 }finally{cleanup(board.boardId);}
});
