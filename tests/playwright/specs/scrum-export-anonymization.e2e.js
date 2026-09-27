'use strict';
const {test,expect}=require('../fixtures');
const db=require('../helpers/db');
test('native streaming export anonymizes Scrum prose only when enabled',async({request,user,board})=>{
 const settings=db.findOne('settings',{});
 const original=settings.anonymizeExportUsers;
 const username=db.findOne('users',{_id:user.id}).username;
 const mention=`@${username}`;
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('boards',{_id:board.boardId},{$set:{scrum:{productGoal:`Goal ${mention}`,definitionOfDone:`Reviewed ${mention}`,productOwnerId:user.id}}});
 db.updateOne('cards',{_id:card._id},{$set:{scrum:{acceptanceCriteria:`Approved ${mention}`,issueType:'Story'}}});
 db.updateOne('swimlanes',{_id:board.swimlaneId},{$set:{scrum:{purpose:`Team ${mention}`}}});
 const url=`/api/boards/${board.boardId}/export?authToken=${encodeURIComponent(user.token)}`;
 try{
  db.updateOne('settings',{_id:settings._id},{$set:{anonymizeExportUsers:true}});
  const response=await request.get(url);expect(response.status()).toBe(200);
  const result=await response.json();
  const replacement=`@${result.users.find(u=>u._id===user.id).username}`;
  expect(replacement).not.toBe(mention);
  expect(result.scrum.productGoal).toBe(`Goal ${replacement}`);
  expect(result.scrum.definitionOfDone).toBe(`Reviewed ${replacement}`);
  expect(result.scrum.productOwnerId).toBe(user.id);
  expect(result.cards.find(c=>c._id===card._id).scrum.acceptanceCriteria).toBe(`Approved ${replacement}`);
  expect(result.swimlanes.find(s=>s._id===board.swimlaneId).scrum.purpose).toBe(`Team ${replacement}`);
  db.updateOne('settings',{_id:settings._id},{$set:{anonymizeExportUsers:false}});
  const plain=await request.get(url);expect(plain.status()).toBe(200);
  expect((await plain.json()).scrum.productGoal).toBe(`Goal ${mention}`);
  expect(db.findOne('boards',{_id:board.boardId}).scrum.productGoal).toBe(`Goal ${mention}`);
 }finally{
  db.updateOne('settings',{_id:settings._id},original===undefined?{$unset:{anonymizeExportUsers:''}}:{$set:{anonymizeExportUsers:original}});
 }
});
