'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const {loginWithToken,openBoard}=require('../helpers/auth');
const call=(page,method,...args)=>page.evaluate(({method,args})=>Meteor.callAsync(method,...args),{method,args});

for(const operation of ['list','swimlane'])for(const reuse of [false,true]){
 test(`${operation} move ${reuse?'retains destination':'preserves source'} Scrum list category`,async({page,user,board})=>{
  const destination=db.seedBoard({ownerId:user.id,title:'Move category destination'});
  try{
   const list=db.find('lists',{boardId:board.boardId})[0];
   const destinationList=db.find('lists',{boardId:destination.boardId})[0];
   // Make the create/reuse cases explicit, independent of fixture titles.
   db.updateOne('lists',{_id:list._id},{$set:{title:'Scrum source list',scrum:{category:'doing'},scrumRevision:8}});
   if(reuse)db.updateOne('lists',{_id:destinationList._id},{$set:{title:'Scrum source list',scrum:{category:'done'},scrumRevision:6}});
   await loginWithToken(page,user.id,user.token);
   if(operation==='list')await call(page,'moveList',list._id,destination.boardId,destination.swimlaneId,null,'right','Scrum source list');
   else await call(page,'moveSwimlane',board.swimlaneId,destination.boardId,null,'below','Moved team');
   const target=db.findOne('lists',{boardId:destination.boardId,title:'Scrum source list',archived:false});
   expect(target.scrum).toEqual({category:reuse?'done':'doing'});
   expect(target.scrumRevision).toBe(reuse?6:1);
   if(reuse)expect(target._id).toBe(destinationList._id);
   expect(db.find('cards',{listId:target._id,boardId:destination.boardId}).length).toBeGreaterThan(0);
   await openBoard(page,destination.boardId,destination.slug);
   await expect(page.locator('.list').filter({hasText:'Scrum source list'}).first()).toBeVisible();
  }finally{db.cleanup({boardIds:[destination.boardId]});}
 });
}
