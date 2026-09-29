'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
const {navigateInApp}=require('../helpers/auth');
const { waitForImportedBoard } = require('../helpers/import');
test('Jira time import reuses spent hours and hidden numeric estimates, retaining them in native export',async({loggedInPage:page,request,user})=>{
 let boardId, roundTrip;
 const nativeCopies=[];
 const source={board:{name:`Jira time ${db.uniqueSuffix()}`},issues:[
  {key:'TIME-1',fields:{summary:'Tracked issue',status:{name:'Open'},timetracking:{originalEstimateSeconds:7200,remainingEstimateSeconds:0,timeSpentSeconds:1800}}},
  {key:'TIME-2',fields:{summary:'No estimates',status:{name:'Open'}}},
 ]};
 try{
  await navigateInApp(page,'/import/jira');
  await page.locator('#import-textarea').fill(JSON.stringify(source));
  await page.locator('.js-import-without-mapping').click();
  await waitForImportedBoard(page);boardId=page.url().match(/\/b\/([^/]+)/)[1];
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
  await page.evaluate(field=>{
    Popup.close();
    Popup.open('editCustomField',{dataContext:field})({currentTarget:document.body,target:document.body,preventDefault(){},stopPropagation(){}});
  },original);
  const editor=page.locator('.pop-over .js-field-name');
  await editor.fill('Renamed original estimate');
  await page.locator('.pop-over .primary').click();
  await expect.poll(()=>db.findOne('customFields',{_id:original._id}).name).toBe('Renamed original estimate');
  expect(db.findOne('customFields',{_id:original._id}).settings.jiraTimeField).toBe('original');
  const jiraUrl=`/api/boards/${boardId}/export/jira?authToken=${encodeURIComponent(user.token)}`;
  const jiraResponse=await request.get(jiraUrl);expect(jiraResponse.status()).toBe(200);
  const jira=await jiraResponse.json();
  const issue=jira.issues.find(issue=>issue.fields.summary.includes('TIME-1'));
  expect(issue.fields.timetracking).toEqual({originalEstimateSeconds:7200,remainingEstimateSeconds:0,timeSpentSeconds:1800});
  for(const [fields,expected] of [['dates',{timeSpentSeconds:1800}],['custom-fields',{originalEstimateSeconds:7200,remainingEstimateSeconds:0}],['description',undefined]]){
    const response=await request.get(`${jiraUrl}&fields=${fields}`);expect(response.status()).toBe(200);
    const body=await response.json();
    expect(body.issues.find(issue=>issue.fields.summary.includes('TIME-1')).fields.timetracking).toEqual(expected);
  }
  roundTrip=await page.evaluate(input=>Meteor.callAsync('importBoard',input,{},'jira'),jira);
  const restored=db.find('cards',{boardId:roundTrip}).find(card=>card.title.includes('TIME-1'));
  expect(restored.spentTime).toBe(.5);
  expect(restored.customFields.map(field=>field.value)).toEqual([2,0]);
  await page.evaluate(({boardId,id})=>Meteor.callAsync('scrum.configure',boardId,{estimateSource:'customField',estimateCustomFieldId:id,estimateUnit:'hours'},0),{boardId,id:original._id});
  expect(db.findOne('boards',{_id:boardId}).scrum.estimateCustomFieldId).toBe(original._id);
  const nativeResponse=await request.get(`/api/boards/${boardId}/export?authToken=${encodeURIComponent(user.token)}`);
  expect(nativeResponse.status()).toBe(200);
  const native=await nativeResponse.json();
  expect(native.customFields.find(field=>field._id===original._id).settings.jiraTimeField).toBe('original');
  const imported=await page.evaluate(input=>Meteor.callAsync('importBoard',input,{},'wekan'),native);nativeCopies.push(imported);
  const copied=await page.evaluate(id=>Meteor.callAsync('copyBoard',id,{}),boardId);nativeCopies.push(copied);
  for(const id of nativeCopies){
    const field=db.findOne('customFields',{boardIds:id,'settings.jiraTimeField':'original'});
    expect(field._id).not.toBe(original._id);expect(field.name).toBe('Renamed original estimate');
    expect(db.findOne('boards',{_id:id}).scrum.estimateCustomFieldId).toBe(field._id);
    const card=db.find('cards',{boardId:id}).find(card=>card.title.includes('TIME-1'));
    expect(card.customFields).toContainEqual({_id:field._id,value:2});
    const response=await request.get(`/api/boards/${id}/export/jira?authToken=${encodeURIComponent(user.token)}`);
    expect(response.status()).toBe(200);
    const body=await response.json();
    expect(body.issues.find(issue=>issue.fields.summary.includes('TIME-1')).fields.timetracking).toEqual(issue.fields.timetracking);
  }
  const invalid={...source,board:{name:`Invalid ${source.board.name}`},issues:[{key:'BAD-1',fields:{summary:'Invalid',timespent:-1}}]};
  const error=await page.evaluate(async input=>{try{await Meteor.callAsync('importBoard',input,{},'jira');return null;}catch(error){return error.error;}},invalid);
  expect(error).toBe('invalid-jira-time');expect(db.find('boards',{title:invalid.board.name})).toHaveLength(0);
 }finally{for(const id of [boardId,roundTrip,...nativeCopies].filter(Boolean)){db.deleteMany('customFields',{boardIds:id});db.cleanup({boardIds:[id]});}}
});

test('Jira import section controls exclude estimates and spent time independently',async({loggedInPage:page})=>{
 const ids=[];
 try{
  for(const selected of ['dates','custom-fields']){
   await navigateInApp(page,'/import/jira');
   for(const toggle of await page.locator('.js-import-part-toggle').all()){
    const wanted=(await toggle.getAttribute('data-field'))===selected;
    const checked=await toggle.locator('.materialCheckBox').evaluate(el=>el.classList.contains('is-checked'));
    if(wanted!==checked)await toggle.click();
   }
   await page.locator('#import-textarea').fill(JSON.stringify({board:{name:`Selected Jira ${selected}`},issues:[{key:'SELECT-1',fields:{summary:'Selected time',timespent:1800,timeoriginalestimate:7200,timeestimate:0,timetracking:{timeSpentSeconds:1800,originalEstimateSeconds:7200,remainingEstimateSeconds:0}}}]}));
   await page.locator('.js-import-without-mapping').click();await waitForImportedBoard(page);
   const id=page.url().match(/\/b\/([^/]+)/)[1];ids.push(id);
   const card=db.findOne('cards',{boardId:id});
   if(selected==='dates'){
    expect(card.spentTime).toBe(.5);
    expect(card.customFields).toEqual([]);expect(db.find('customFields',{boardIds:id})).toHaveLength(0);
   }else{
    expect(card.spentTime||0).toBe(0);
    expect(card.customFields.map(field=>field.value)).toEqual([2,0]);
   }
  }
 }finally{for(const id of ids){db.deleteMany('customFields',{boardIds:id});db.cleanup({boardIds:[id]});}}
});
