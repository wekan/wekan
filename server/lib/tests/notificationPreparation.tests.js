import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Activities from '/models/activities';
import { EmailJobs } from '/server/notifications/emailQueue';
import { trayDeliveryReceipts } from '/server/notifications/trayQueue';
import { prepareActivityDeliveryPlan } from '/server/notifications/prepareDelivery';
import { getFeatureFlags } from '/models/lib/featureFlags';

describe('Shared notification preparation',function(){
 this.timeout(30000);
 it('captures the ordinary authorized audience and services without delivery',async function(){
  if(!Meteor.isAppTest)this.skip();
  const actor=Random.id(),watcher=Random.id(),muted=Random.id(),inactive=Random.id(),ids=[actor,watcher,muted,inactive];
  const boardId=Random.id(),listId=Random.id(),cardId=Random.id(),activityId=Random.id();
  const flags=getFeatureFlags(),original=flags.disableNotifications;
  try {
   flags.disableNotifications=false;
   await Meteor.users.rawCollection().insertMany(ids.map(_id=>({_id,username:'plan-'+_id,
    profile:{notifyOverrideEmail:true,notifyOverrideTray:_id!==watcher,language:'en'}})));
   await Boards.rawCollection().insertOne({_id:boardId,title:'Audience',permission:'private',members:ids.map(userId=>({userId,isActive:userId!==inactive,isAdmin:userId===actor})),
    watchers:ids.map(userId=>({userId,level:userId===muted?'muted':'watching'}))});
   await Lists.rawCollection().insertOne({_id:listId,boardId,title:'List',watchers:[]});
   await Cards.rawCollection().insertOne({_id:cardId,boardId,listId,title:'Prepared card',userId:actor,members:[muted],watchers:[]});
   const activity={_id:activityId,activityType:'createCard',userId:actor,boardId,listId,cardId,createdAt:new Date()};
   const plan=await prepareActivityDeliveryPlan({activity,assertCurrent:async()=>{}});
   assert.deepEqual(plan.recipients.map(row=>row.userId),[watcher]);
   assert.equal(plan.recipients[0].tray,false);assert.equal(plan.recipients[0].email.userId,watcher);
   assert.equal(plan.recipients[0].email.cardId,cardId);assert.equal(plan.recipients[0].email.boardId,boardId);
   await Lists.rawCollection().updateOne({_id:listId},{$set:{watchers:[muted]}});
   const scoped=await prepareActivityDeliveryPlan({activity,assertCurrent:async()=>{}});
   assert.deepEqual(scoped.recipients.map(row=>row.userId).sort(),[watcher,muted].sort());
   flags.disableNotifications=true;
   const disabled=await prepareActivityDeliveryPlan({activity,assertCurrent:async()=>{}});
   assert.deepEqual(disabled.recipients,[]);
   assert.equal(await EmailJobs.find({userId:{$in:ids}}).countAsync(),0);
   assert.equal(await trayDeliveryReceipts.find({userId:{$in:ids}}).countAsync(),0);
   assert.equal(await Activities.find({_id:activityId}).countAsync(),0);
   flags.disableNotifications=false;
   await Cards.rawCollection().updateOne({_id:cardId},{$set:{boardId:'foreign'}});
   await assert.rejects(prepareActivityDeliveryPlan({activity,assertCurrent:async()=>{}}),/context-unavailable/);
   await Cards.rawCollection().deleteOne({_id:cardId});
   await assert.rejects(prepareActivityDeliveryPlan({activity,assertCurrent:async()=>{}}),/context-unavailable/);
   await assert.rejects(prepareActivityDeliveryPlan({activity,assertCurrent:async()=>{throw new Error('lease lost');}}),/lease lost/);
  } finally {
   flags.disableNotifications=original;
   await Meteor.users.rawCollection().deleteMany({_id:{$in:ids}});
   await Boards.rawCollection().deleteMany({_id:boardId});await Lists.rawCollection().deleteMany({_id:listId});await Cards.rawCollection().deleteMany({_id:cardId});
   await EmailJobs.rawCollection().deleteMany({userId:{$in:ids}});await trayDeliveryReceipts.rawCollection().deleteMany({userId:{$in:ids}});
  }
 });
});
