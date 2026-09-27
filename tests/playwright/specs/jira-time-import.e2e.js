'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
const {navigateInApp}=require('../helpers/auth');
test('Jira time import reuses spent hours and hidden numeric estimates, retaining them in native export',async({loggedInPage:page,request,user})=>{
 let boardId;
 const source={board:{name:`Jira time ${db.uniqueSuffix()}`},issues:[
  {key:'TIME-1',fields:{summary:'Tracked issue',status:{name:'Open'},timetracking:{originalEstimateSeconds:7200,remainingEstimateSeconds:0,timeSpentSeconds:1800}}},
  {key:'TIME-2',fields:{summary:'No estimates',status:{name:'Open'}}},
 ]};
 try{
  await navigateInApp(page,'/import/jira');
  await page.locator('#import-textarea').fill(JSON.stringify(source));
  await page.locator('.js-import-without-mapping').click();
  await page.waitForURL(/\/b\//);boardId=page.url().match(/\/b\/([^/]+)/)[1];
  const fields=db.find('customFields',{boardIds:boardId});expect(fields).toHaveLength(2);
  expect(fields.every(field=>field.type==='number'&&field.showOnCard===false&&field.alwaysOnCard===false)).toBe(true);
  const original=fields.find(field=>field.name==='Jira original estimate (hours)');
  const remaining=fields.find(field=>field.name==='Jira remaining estimate (hours)');
  const cards=db.find('cards',{boardId});const tracked=cards.find(card=>card.title.includes('TIME-1'));
  expect(tracked.spentTime).toBe(.5);
  expect(tracked.customFields).toEqual([{_id:original._id,value:2},{_id:remaining._id,value:0}]);
  expect(cards.find(card=>card.title.includes('TIME-2')).customFields).toEqual([]);
  await expect(page.locator('.minicard-title').filter({hasText:'Tracked issue'})).toBeVisible();
  await expect(page.locator('.minicard').filter({hasText:'Jira original estimate'})).toHaveCount(0);
  const response=await request.get(`/api/boards/${boardId}/export?authToken=${encodeURIComponent(user.token)}`);expect(response.status()).toBe(200);
  const exported=await response.json();const exportedCard=exported.cards.find(card=>card._id===tracked._id);
  expect(exportedCard.spentTime).toBe(.5);expect(exportedCard.customFields).toEqual(tracked.customFields);
  await page.evaluate(({boardId,id})=>Meteor.callAsync('scrum.configure',boardId,{estimateSource:'customField',estimateCustomFieldId:id,estimateUnit:'hours'},0),{boardId,id:original._id});
  expect(db.findOne('boards',{_id:boardId}).scrum.estimateCustomFieldId).toBe(original._id);
  const invalid={...source,board:{name:`Invalid ${source.board.name}`},issues:[{key:'BAD-1',fields:{summary:'Invalid',timespent:-1}}]};
  const error=await page.evaluate(async input=>{try{await Meteor.callAsync('importBoard',input,{},'jira');return null;}catch(error){return error.error;}},invalid);
  expect(error).toBe('invalid-jira-time');expect(db.find('boards',{title:invalid.board.name})).toHaveLength(0);
 }finally{if(boardId){db.deleteMany('customFields',{boardIds:boardId});db.cleanup({boardIds:[boardId]});}}
});
