'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
test('list Sync displays rejected source errors without changing existing cards',async({page,user,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('lists',{_id:card.listId},{$set:{syncSource:{type:'jira',url:'https://example.invalid',projectKey:'TEST',enabled:false,lastSyncError:'Invalid jira import document shape'}}});
 const list=db.findOne('lists',{_id:card.listId});
 await loginWithToken(page,user.id,user.token);await openBoard(page,board.boardId,board.slug);
 await page.evaluate(list=>{Popup.close();Popup.open('listSync',{dataContext:list})({currentTarget:document.body,target:document.body,preventDefault(){},stopPropagation(){}});},list);
 await expect(page.locator('.list-sync-error')).toContainText('Invalid jira import document shape');
 expect(db.findOne('cards',{_id:card._id}).archived).not.toBe(true);
 expect(db.findOne('cards',{_id:card._id}).title).toBe(card.title);
});
