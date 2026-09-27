'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
for(const message of ['Sync archive conflict: an active subtask is not in the source archive plan.','Invalid jira import document shape','Sync text conflict: KEY-1 (title). Align local and source text before retrying.'])
test(`list Sync displays ${message} without changing existing cards`,async({page,user,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('lists',{_id:card.listId},{$set:{syncSource:{type:'jira',url:'https://example.invalid',projectKey:'TEST',enabled:false,lastSyncError:message}}});
 const list=db.findOne('lists',{_id:card.listId});
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await page.evaluate(list=>{Popup.close();Popup.open('listSync',{dataContext:list})({currentTarget:document.body,target:document.body,preventDefault(){},stopPropagation(){}});},list);
 await expect(page.locator('.list-sync-error')).toContainText(message);
 // Simulate the method's structured failure, not a transport exception.
 await page.evaluate(message=>{
  const original=Meteor.call;
  Meteor.call=function(name,...args){
   if(name==='syncListNow'){args[args.length-1](null,{error:message});return;}
   return original.apply(this,[name,...args]);
  };
 },message);
 await page.locator('.js-list-sync-now').click();
 await expect(page.locator('.pop-over .list-sync-now-error')).toContainText(message);
 expect(db.findOne('cards',{_id:card._id}).archived).not.toBe(true);
 expect(db.findOne('cards',{_id:card._id}).title).toBe(card.title);
});

test('Sync field selection saves, reopens and rejects unsupported field names',async({page,user,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('lists',{_id:card.listId},{$set:{syncSource:{type:'jira',url:'https://example.invalid',projectKey:'TEST',enabled:false}}});
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 const open=async()=>page.evaluate(list=>{Popup.close();Popup.open('listSync',{dataContext:list})({currentTarget:document.body,target:document.body,preventDefault(){},stopPropagation(){}});},db.findOne('lists',{_id:card.listId}));
 await open();
 await expect(page.locator('.js-toggle-sync-field .is-checked')).toHaveCount(2);
 await expect(page.locator('.js-toggle-sync-field[data-field="spentTime"] .is-checked')).toHaveCount(0);
 await page.locator('.js-toggle-sync-field[data-field="description"]').click();
 await page.locator('.js-toggle-sync-field[data-field="spentTime"]').click();
 await page.locator('.js-list-sync-save').click();
 await expect.poll(()=>db.findOne('lists',{_id:card.listId}).syncSource.fields).toEqual(['title','spentTime']);
 await open();
 await expect(page.locator('.js-toggle-sync-field[data-field="title"] .is-checked')).toHaveCount(1);
 await expect(page.locator('.js-toggle-sync-field[data-field="spentTime"] .is-checked')).toHaveCount(1);
 await expect(page.locator('.js-toggle-sync-field[data-field="description"] .is-checked')).toHaveCount(0);
 const result=await page.evaluate(async id=>{try{await Meteor.callAsync('setListSyncSource',id,{type:'jira',projectKey:'TEST',fields:['members']});return 'accepted';}catch(error){return 'rejected';}},card.listId);
 expect(result).toBe('rejected');
 expect(db.findOne('lists',{_id:card.listId}).syncSource.fields).toEqual(['title','spentTime']);
});
