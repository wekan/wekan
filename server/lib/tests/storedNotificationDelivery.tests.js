import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Activities from '/models/activities';
import { EmailJobs, emailOutbox } from '/server/notifications/emailQueue';
import { trayDeliveryReceipts } from '/server/notifications/trayQueue';
import { SyncNotificationPlans, runStoredSyncNotifications } from '/server/notifications/storedDelivery';
import { getFeatureFlags } from '/models/lib/featureFlags';

describe('Stored Sync notification delivery',function(){
 this.timeout(30000);
 it('persists the real audience/content and rechecks permissions without rebuilding the plan',async function(){
  if(!Meteor.isAppTest)this.skip();
  const actor=Random.id(),watcher=Random.id(),later=Random.id(),restricted=Random.id(),ids=[actor,watcher,later,restricted];
  const boardId=Random.id(),listId=Random.id(),cardId=Random.id(),activityId=Random.id();
  const flags=getFeatureFlags(),original={...flags};
  const activity={_id:activityId,activityType:'createCard',userId:actor,boardId,listId,cardId,createdAt:new Date(),modifiedAt:new Date()};
  const options={activity,policy:{activities:true,notifications:true},assertCurrent:async()=>{}};
  try {
   flags.disableActivities=false;flags.disableNotifications=false;
   await Meteor.users.rawCollection().insertMany(ids.map(_id=>({_id,username:'stored-'+_id,
    profile:{notifyOverrideEmail:true,notifyOverrideTray:true,language:'en'}})));
   await Boards.rawCollection().insertOne({_id:boardId,title:'Original board',permission:'private',members:ids.map(userId=>({userId,isActive:true,isAdmin:userId===actor,isReadAssignedOnly:userId===restricted})),
    watchers:[{userId:watcher,level:'watching'},{userId:restricted,level:'watching'}]});
   await Lists.rawCollection().insertOne({_id:listId,boardId,title:'List',watchers:[]});
   await Cards.rawCollection().insertOne({_id:cardId,boardId,listId,title:'Original card',userId:actor,assignees:[],watchers:[]});
   await Activities.rawCollection().insertOne(activity);
   const enqueue=emailOutbox.enqueue;
   try {
    emailOutbox.enqueue=async job=>{if(job.userId===watcher)throw new Error('injected email interruption');return enqueue(job);};
    await assert.rejects(runStoredSyncNotifications(options),/injected email interruption/);
   }finally{emailOutbox.enqueue=enqueue;}
   assert.equal(await EmailJobs.find({userId:{$in:ids}}).countAsync(),0);
   assert.equal(await trayDeliveryReceipts.find({userId:{$in:ids}}).countAsync(),1);
   const retained=await SyncNotificationPlans.findOneAsync({'plan.activityId':activityId},{transform:null});
   await Meteor.users.rawCollection().updateOne({_id:watcher},{$set:{'profile.notifications':[],'profile.language':'fi'}});
   await Cards.rawCollection().updateOne({_id:cardId},{$set:{title:'Changed during interruption'}});
   const id=await runStoredSyncNotifications(options);
   const stored=await SyncNotificationPlans.findOneAsync(id,{transform:null});
   assert.deepEqual(stored,retained);
   const resumedMail=await EmailJobs.findOneAsync({userId:watcher,eventId:activityId});
   assert.equal(resumedMail.html,retained.plan.recipients[0].email.html);
   assert.equal(resumedMail.language,retained.plan.recipients[0].email.language);
   assert.deepEqual((await Meteor.users.findOneAsync(watcher)).profile.notifications,[]);
   assert.deepEqual(stored.plan.recipients.map(row=>row.userId),[watcher]);
   assert.equal(await EmailJobs.find({userId:{$in:ids}}).countAsync(),1);
   assert.equal(await trayDeliveryReceipts.find({userId:{$in:ids}}).countAsync(),1);
   const originalMail=await EmailJobs.findOneAsync({userId:watcher,eventId:activityId});
   await Meteor.users.rawCollection().updateOne({_id:watcher},{$set:{'profile.notifications':[],'profile.language':'fi'}});
   await Cards.rawCollection().updateOne({_id:cardId},{$set:{title:'Later card'}});
   await Boards.rawCollection().updateOne({_id:boardId},{$push:{watchers:{userId:later,level:'watching'}}});
   assert.equal(await runStoredSyncNotifications(options),id);
   assert.deepEqual(await SyncNotificationPlans.findOneAsync(id,{transform:null}),stored);
   assert.equal(await EmailJobs.find({userId:{$in:ids}}).countAsync(),1);
   assert.deepEqual((await Meteor.users.findOneAsync(watcher)).profile.notifications,[]);
   const mail=await EmailJobs.findOneAsync({userId:watcher,eventId:activityId});
   assert.equal(mail.html,originalMail.html);assert.equal(mail.language,originalMail.language);
   await Meteor.users.rawCollection().updateOne({_id:watcher},{$set:{loginDisabled:true}});
   await assert.rejects(runStoredSyncNotifications(options),/recipient-denied/);
   await Meteor.users.rawCollection().updateOne({_id:watcher},{$set:{loginDisabled:false,'profile.notifyOverrideTray':false}});
   await assert.rejects(runStoredSyncNotifications(options),/preference-changed/);
   await Meteor.users.rawCollection().updateOne({_id:watcher},{$set:{'profile.notifyOverrideTray':true}});
   await Boards.rawCollection().updateOne({_id:boardId},{$set:{'members.1.isActive':false}});
   await assert.rejects(runStoredSyncNotifications(options),/recipient-denied/);
   await Boards.rawCollection().updateOne({_id:boardId},{$set:{'members.1.isActive':true,'members.1.isReadAssignedOnly':true}});
   await assert.rejects(runStoredSyncNotifications(options),/recipient-denied/);
   await Cards.rawCollection().updateOne({_id:cardId},{$set:{assignees:[watcher]}});
   assert.equal(await runStoredSyncNotifications(options),id);
   flags.disableNotifications=true;
   await assert.rejects(runStoredSyncNotifications(options),/policy-changed/);flags.disableNotifications=false;
   await Activities.rawCollection().updateOne({_id:activityId},{$set:{value:'changed'}});
   await assert.rejects(runStoredSyncNotifications(options),/activity-changed/);
   await Activities.rawCollection().updateOne({_id:activityId},{$unset:{value:''}});
   await Cards.rawCollection().updateOne({_id:cardId},{$set:{listId:'other'}});
   await assert.rejects(runStoredSyncNotifications(options),/context-unavailable/);
   await Cards.rawCollection().updateOne({_id:cardId},{$set:{listId}});
   await SyncNotificationPlans.rawCollection().updateOne({_id:id},{$set:{checksum:'damaged'}});
   await assert.rejects(runStoredSyncNotifications(options),/plan-invalid/);
   assert.equal(await EmailJobs.find({userId:{$in:ids}}).countAsync(),1);
  }finally{
   Object.assign(flags,original);
   await SyncNotificationPlans.rawCollection().deleteMany({'plan.activityId':activityId});
   await EmailJobs.rawCollection().deleteMany({userId:{$in:ids}});await trayDeliveryReceipts.rawCollection().deleteMany({userId:{$in:ids}});
   await Activities.rawCollection().deleteMany({_id:activityId});await Cards.rawCollection().deleteMany({_id:cardId});
   await Lists.rawCollection().deleteMany({_id:listId});await Boards.rawCollection().deleteMany({_id:boardId});
   await Meteor.users.rawCollection().deleteMany({_id:{$in:ids}});
  }
 });
});
