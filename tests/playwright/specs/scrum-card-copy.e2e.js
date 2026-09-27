'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(({method,args})=>Meteor.callAsync(method,...args),{method,args});
test('standalone card and subtask copies respect Scrum board boundaries',async({page,user,board})=>{
 const destination=db.seedBoard({ownerId:user.id,title:'Scrum copy destination'});
 try{
  await loginWithToken(page,user.id,user.token);
  const sprint=await call(page,'scrum.saveSprint',board.boardId,null,{name:'Source sprint'},null);
  const release=await call(page,'scrum.saveRelease',board.boardId,null,{name:'Source release'},null);
  const [parent,child]=db.find('cards',{boardId:board.boardId});
  const scrum={sprintId:sprint._id,releaseId:release._id,pastSprintIds:[],backlogRank:8,issueType:'Story',acceptanceCriteria:'Copy criteria'};
  for(const card of [parent,child])db.updateOne('cards',{_id:card._id},{$set:{scrum,scrumRevision:9}});
  db.updateOne('cards',{_id:child._id},{$set:{parentId:parent._id}});
  for(const target of [board,destination]){
   const list=db.find('lists',{boardId:target.boardId})[0];
   const id=await call(page,'copyCard',parent._id,target.boardId,target.swimlaneId,list._id,false,{});
   const expected=target.boardId===board.boardId?scrum:{issueType:'Story',acceptanceCriteria:'Copy criteria'};
   for(const copy of [db.findOne('cards',{_id:id}),db.findOne('cards',{parentId:id})]){
    expect(copy.boardId).toBe(target.boardId);expect(copy.scrum).toEqual(expected);expect(copy.scrumRevision).toBe(1);
   }
  }
  expect(db.findOne('cards',{_id:parent._id}).scrum).toEqual(scrum);
  expect(db.findOne('cards',{_id:child._id}).scrumRevision).toBe(9);
  expect(db.find('scrumSprints',{boardId:destination.boardId})).toHaveLength(0);
  await openBoard(page,destination.boardId,destination.slug);
  await expect(page.locator('.minicard').filter({hasText:parent.title}).first()).toBeVisible();
 }finally{
  db.cleanup({boardIds:[destination.boardId]});
  for(const collection of ['scrumSprints','scrumReleases'])db.deleteMany(collection,{boardId:board.boardId});
 }
});
