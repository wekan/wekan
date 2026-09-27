'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,request)=>page.evaluate(request=>Meteor.callAsync('changeHistory.page',request),request);
test('history filters assigned-only rows before search, counts and contributor summaries',async({page,user,user2,board})=>{
 const cards=db.find('cards',{boardId:board.boardId});
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isReadAssignedOnly:true}}});
 db.updateOne('cards',{_id:cards[0]._id},{$set:{assignees:[user2.id]}});
 const base={boardId:board.boardId,entityType:'card',group:'description',changeType:'edited',userId:user.id,createdAt:new Date()};
 const known=db.uid('hist'),hidden=db.uid('hist');
 db.insertOne('changeHistory',{...base,_id:known,entityId:cards[0]._id,cardId:cards[0]._id,newContent:{value:'Visible history'}});
 db.insertOne('changeHistory',{...base,_id:hidden,entityId:cards[1]._id,cardId:cards[1]._id,newContent:{value:'Private historical content'}});
 await loginWithToken(page,user2.id,user2.token);await openBoard(page,board.boardId,board.slug);
 const result=await call(page,{scope:'board',scopeId:board.boardId});
 expect(result.rows.map(r=>r._id)).toContain(known);expect(result.rows.map(r=>r._id)).not.toContain(hidden);
 const searched=await call(page,{scope:'board',scopeId:board.boardId,search:'Private historical content'});
 expect(searched.total).toBe(0);expect(searched.contributors).toEqual([]);
});
test('own member history no longer exposes a private board after access is removed',async({page,user,board})=>{
 db.insertOne('changeHistory',{_id:db.uid('hist'),boardId:board.boardId,entityType:'board',entityId:board.boardId,group:'title',changeType:'edited',userId:user.id,createdAt:new Date(),newContent:{value:'Former private title'}});
 await loginWithToken(page,user.id,user.token);
 const before=await call(page,{userId:user.id});expect(before.total).toBeGreaterThan(0);
 db.updateOne('boards',{_id:board.boardId},{$set:{members:[],permission:'private'}});
 const after=await call(page,{userId:user.id});expect(after.rows.filter(r=>r.boardId===board.boardId)).toEqual([]);
});
test('assigned-only writers cannot restore hidden card history by guessing a row ID',async({page,user,user2,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isNormalAssignedOnly:true}}});
 const id=db.uid('hist');
 db.insertOne('changeHistory',{_id:id,boardId:board.boardId,entityType:'card',entityId:card._id,cardId:card._id,group:'description',changeType:'edited',userId:user.id,createdAt:new Date(),newContent:{field:'description',value:'Hidden historical description'}});
 await loginWithToken(page,user2.id,user2.token);
 const result=await page.evaluate(async id=>{try{return await Meteor.callAsync('changeHistory.restore',[id]);}catch(error){return {error:error.error};}},id);
 expect(result.error).toBe('not-authorized');
 expect(db.findOne('cards',{_id:card._id}).description).not.toBe('Hidden historical description');
});
test('an assigned-only writer can restore currently assigned card history',async({page,user,user2,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isNormalAssignedOnly:true}}});
 db.updateOne('cards',{_id:card._id},{$set:{assignees:[user2.id]}});
 const id=db.uid('hist');
 db.insertOne('changeHistory',{_id:id,boardId:board.boardId,entityType:'card',entityId:card._id,cardId:card._id,group:'description',changeType:'edited',userId:user.id,createdAt:new Date(),newContent:{field:'description',value:'Allowed history restore'}});
 await loginWithToken(page,user2.id,user2.token);
 const result=await page.evaluate(id=>Meteor.callAsync('changeHistory.restore',[id]),id);
 expect(result.restored).toBe(1);
 expect(db.findOne('cards',{_id:card._id}).description).toBe('Allowed history restore');
});
test('History cannot edit a card moved to a board the former owner cannot access',async({page,user,user2,board})=>{
 const card=db.find('cards',{boardId:board.boardId})[0];
 const foreign=db.seedBoard({ownerId:user2.id,title:'Private destination'});
 try{
  db.updateOne('cards',{_id:card._id},{$set:{boardId:foreign.boardId,listId:foreign.listIds[0],swimlaneId:foreign.swimlaneId}});
  const id=db.uid('hist');
  db.insertOne('changeHistory',{_id:id,boardId:board.boardId,entityType:'card',entityId:card._id,cardId:card._id,group:'description',changeType:'edited',userId:user.id,createdAt:new Date(),newContent:{field:'description',value:'Unauthorized moved-card edit'}});
  await loginWithToken(page,user.id,user.token);
  const result=await page.evaluate(async id=>{try{return await Meteor.callAsync('changeHistory.restore',[id]);}catch(error){return {error:error.error};}},id);
  expect(result.error).toBe('not-authorized');
  expect(db.findOne('cards',{_id:card._id}).description).not.toBe('Unauthorized moved-card edit');
 }finally{db.cleanup({boardIds:[foreign.boardId]});}
});
test('History scans multiple batches before paging readable search matches',async({page,user,user2,board})=>{
 const cards=db.find('cards',{boardId:board.boardId});
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isReadAssignedOnly:true}}});
 db.updateOne('cards',{_id:cards[0]._id},{$set:{assignees:[user2.id]}});
 const marker=db.uid('paged-history');
 const rows=Array.from({length:215},(_,i)=>({_id:`${marker}-${i}`,boardId:board.boardId,
  cardId:cards[i%2]._id,entityId:cards[i%2]._id,entityType:'card',group:'title',changeType:'edited',
  userId:i%2?user2.id:user.id,createdAt:new Date(1700000000000+i),
  newContent:{field:'title',value:i%4===0||i%2?marker:'not a search match'}}));
 db.insertMany('changeHistory',rows);
 await loginWithToken(page,user2.id,user2.token);
 const request={scope:'board',scopeId:board.boardId,search:marker,pageSize:10};
 const first=await call(page,request);
 expect(first.total).toBe(54);expect(first.page).toBe(1);
 expect(first.rows.map(row=>row._id)).toEqual(Array.from({length:10},(_,i)=>`${marker}-${212-i*4}`));
 expect(first.contributors).toEqual([{userId:user.id,count:54}]);
 const last=await call(page,{...request,page:999});
 expect(last.page).toBe(6);expect(last.total).toBe(54);
 expect(last.rows.map(row=>row._id)).toEqual([12,8,4,0].map(i=>`${marker}-${i}`));
});
