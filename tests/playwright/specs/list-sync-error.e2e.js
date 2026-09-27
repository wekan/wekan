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
