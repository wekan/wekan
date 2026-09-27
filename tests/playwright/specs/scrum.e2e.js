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
  await view(page,'velocity');
  await expect(page.locator('.scrum-table tbody')).toContainText('Browser sprint');
  const excel=await request.get(`/api/boards/${board.boardId}/charts/scrumVelocity/exportExcel?authToken=${encodeURIComponent(user.token)}`);
  expect(excel.status()).toBe(200);expect(excel.headers()['content-type']).toContain('spreadsheet');
  const Excel=require('../../../node_modules/@wekanteam/exceljs');
  const workbook=new Excel.Workbook();await workbook.xlsx.load(await excel.body());
  expect(workbook.worksheets[0].getCell('A3').value).toBe('Browser sprint');
  const pdf=await request.get(`/api/boards/${board.boardId}/charts/scrumSprint/exportPDF?authToken=${encodeURIComponent(user.token)}&sprintId=${sprint._id}`);
  expect(pdf.status()).toBe(200);expect((await pdf.body()).subarray(0,4).toString()).toBe('%PDF');
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
 await expect(page.locator('.js-scrum-card')).toHaveCount(0);
 await expect(call(page,'scrum.configure',board.boardId,{enabled:true})).rejects.toThrow(/not-authorized/);
 await expect(call(page,'scrum.saveSprint',board.boardId,null,{name:'Forbidden'},null)).rejects.toThrow(/not-authorized/);
});

test('Board Settings reveals Scrum minicard fields and preserves independent card visibility',async({page,user,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('cards',{_id:card._id},{$set:{scrum:{issueType:'Story',backlogRank:4},scrumRevision:1}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await expect(page.locator('.minicard .scrum-metadata')).toHaveCount(0);
 await page.evaluate(()=>{Popup.close();const opener=document.body;Popup.open('boardCardSettings')({currentTarget:opener,target:opener,preventDefault(){},stopPropagation(){}});});
 const popup=page.locator('.pop-over[data-popup="boardCardSettingsPopup"]');
 await expect(popup).toBeVisible();
 const checkbox=popup.locator('input[data-key="minicardIssueType"]');
 await checkbox.check();
 await expect.poll(()=>db.findOne('boards',{_id:board.boardId}).scrum?.visibility?.minicardIssueType).toBe(true);
 expect(db.findOne('boards',{_id:board.boardId}).scrum?.visibility?.cardIssueType).not.toBe(true);
 await popup.locator('.js-close-pop-over').click();
 await expect(page.locator('.minicard .scrum-metadata').filter({hasText:'Story'})).toHaveCount(1);
 expect(errors).toEqual([]);
});
