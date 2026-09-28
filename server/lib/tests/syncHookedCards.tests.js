import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Cards from '/models/cards';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
const { createSyncHookedCards } = require('/server/lib/syncHookedCards');
const { prepareSyncOperationMutation } = require('/server/lib/syncOperationMutation');

// Run against the full app so the real schema, consistency and recording hooks
// are installed. Plain test mode deliberately does not claim this coverage.
describe('Sync hooked card adapter', function () {
  this.timeout(30000);
  it('keeps schema defaults and defers only the owning write, then records ordinary edits', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId=Random.id(),boardId=Random.id(),listId=Random.id(),swimlaneId=Random.id(),cardId=Random.id();
    const withActor=(actor,fn)=>DDP._CurrentMethodInvocation.withValue({userId:actor,isSimulation:false},fn);
    try {
      await Meteor.users.rawCollection().insertOne({_id:userId,username:'sync-hook-'+userId,profile:{}});
      await Boards.rawCollection().insertOne({_id:boardId,title:'Sync test',permission:'private',members:[{userId,isAdmin:true,isActive:true}],archived:false});
      await Swimlanes.rawCollection().insertOne({_id:swimlaneId,boardId,title:'Lane',type:'swimlane',archived:false,sort:0});
      await Lists.rawCollection().insertOne({_id:listId,boardId,swimlaneId,title:'List',archived:false,sort:0});
      const after={_id:cardId,boardId,listId,swimlaneId,title:'  Preserved  ',description:'',sort:0,archived:false};
      const creation={kind:'create',cardId,before:null,after};
      const writer=createSyncHookedCards({cards:Cards,step:creation,userId,withActor});
      await writer.insertOne(prepareSyncOperationMutation(creation).document);
      const saved=await Cards.findOneAsync(cardId);
      assert.equal(saved.title,after.title);assert.equal(saved.description,'');assert.equal(saved.userId,userId);
      assert.ok(saved.createdAt instanceof Date);assert.ok(saved.dateLastActivity instanceof Date);
      assert.equal(await Activities.find({cardId}).countAsync(),0);
      const step={kind:'update',cardId,before:after,after:{...after,title:'Updated'}};
      const mutation=prepareSyncOperationMutation(step),update=createSyncHookedCards({cards:Cards,step,userId,withActor});
      assert.equal((await update.updateOne(mutation.beforeSelector,mutation.modifier)).matchedCount,1);
      assert.equal(await ChangeHistory.find({cardId}).countAsync(),0);
      assert.equal(await Activities.find({cardId}).countAsync(),0);
      assert.equal((await update.updateOne(mutation.beforeSelector,mutation.modifier)).matchedCount,0);
      const beforeFields={...step.after,customFields:[]};
      const afterFields={...beforeFields,title:'Planned title',description:'Planned description',archived:true,
        archivedAt:new Date(),customFields:[{_id:'points',value:0}],
        syncLastSource:{estimate:0,estimateMapping:JSON.stringify(['points','customfield_1','points'])}};
      const fieldStep={kind:'archive',cardId,before:beforeFields,after:afterFields};
      const fieldMutation=prepareSyncOperationMutation(fieldStep);
      const fieldWriter=createSyncHookedCards({cards:Cards,step:fieldStep,userId,withActor});
      assert.equal((await fieldWriter.updateOne(fieldMutation.beforeSelector,fieldMutation.modifier)).matchedCount,1);
      assert.equal(await Activities.find({cardId}).countAsync(),0);
      assert.equal(await ChangeHistory.find({cardId}).countAsync(),0);
      const invalid={kind:'update',cardId,before:afterFields,after:{...afterFields,syncLastSource:{...afterFields.syncLastSource,spentTime:-1}}};
      const invalidMutation=prepareSyncOperationMutation(invalid);
      const invalidWriter=createSyncHookedCards({cards:Cards,step:invalid,userId,withActor});
      await assert.rejects(invalidWriter.updateOne(invalidMutation.beforeSelector,invalidMutation.modifier));
      assert.equal((await Cards.findOneAsync(cardId)).title,'Planned title');
      await withActor(userId,()=>Cards.updateAsync(cardId,{$set:{title:'Ordinary edit'}}));
      assert.equal(await Activities.find({cardId,activityType:'a-changedTitle'}).countAsync(),1);
      assert.equal(await ChangeHistory.find({cardId,group:'title'}).countAsync(),1);
    } finally {
      for(const collection of [Activities,ChangeHistory])await collection.rawCollection().deleteMany({cardId});
      await Cards.rawCollection().deleteMany({_id:cardId});
      await Lists.rawCollection().deleteMany({_id:listId});await Swimlanes.rawCollection().deleteMany({_id:swimlaneId});
      await Boards.rawCollection().deleteMany({_id:boardId});await Meteor.users.rawCollection().deleteMany({_id:userId});
    }
  });
});
