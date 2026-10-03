'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');

// Exercise the real method, rendered bars and workbook rather than trusting
// a warning alone to prove that hidden estimates do not affect the report.
test('assigned-only charts and exports exclude hidden estimates and identify partial results',async({page,request,user2,board})=>{
 const cards=db.find('cards',{boardId:board.boardId});
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isReadAssignedOnly:true}}});
 db.updateOne('cards',{_id:cards[0]._id},{$set:{assignees:[user2.id]}});
 const snapshot={at:new Date(),unit:'points',estimateSource:'poker',completionPolicy:'dueComplete',
  cards:[{cardId:cards[0]._id,estimate:3,done:true},{cardId:cards[1]._id,estimate:999,done:true}],totalEstimate:1002,missingEstimates:0};
 db.insertOne('scrumSprints',{_id:`scope-${board.boardId}`,boardId:board.boardId,name:'Scoped result',state:'closed',revision:1,startSnapshot:snapshot,closeSnapshot:snapshot});
 try{
  await loginWithToken(page,user2.id,user2.token);await openBoard(page,board.boardId,board.slug);
  await page.locator('.js-toggle-board-view').first().click();await page.locator('.pop-over .js-open-velocity-view').click();
  await expect(page.locator('.scrum-partial-report')).toBeVisible();
  await expect(page.locator('.scrum-chart-row')).toHaveCount(1);
  await expect(page.locator('.scrum-chart-row')).toContainText('only part of the original snapshot');
  await expect(page.locator('.scrum-chart-label').first()).toHaveText('Committed: 1');
  await page.locator('.js-scrum-chart-metric').selectOption('estimate');
  await expect(page.locator('.scrum-chart-label').first()).toHaveText('Committed: 3');
  await expect(page.locator('.scrum-view')).not.toContainText('1002');
  await expect(page.locator('.scrum-view')).not.toContainText('999');
  const result=await page.evaluate(boardId=>Meteor.callAsync('scrum.getBoardData',boardId),board.boardId);
  // The board data carries the report, computed on the server from the rows
  // this reader may see, and never the rows themselves (2026-10-03: sprint
  // snapshot rows live outside the sprint).
  expect(result.sprints[0].closeSnapshot.cards).toBeUndefined();
  expect(result.sprints[0].report.committed).toEqual({count:1,estimate:3,unknown:0});
  expect(result.sprints[0].closeSnapshot.totalEstimate).toBe(3);
  expect(JSON.stringify(result)).not.toContain(cards[1]._id+'","estimate":999');
  const response=await request.get(`/api/boards/${board.boardId}/charts/scrumVelocity/exportExcel?authToken=${encodeURIComponent(user2.token)}`);
  expect(response.status()).toBe(200);
  const Excel=require('../../../node_modules/@wekanteam/exceljs');
  const workbook=new Excel.Workbook();await workbook.xlsx.load(await response.body());
  const row=workbook.worksheets[0].getRow(3);
  expect(row.getCell(1).value).toContain('only part of the original snapshot');
  expect(row.getCell(3).value).toBe(1);
  expect(row.getCell(4).value).toBe(3);
 }finally{db.deleteMany('scrumSprints',{boardId:board.boardId});}
});
