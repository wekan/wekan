import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { trayDeliveryReceipts, recoverTrayDeliveries } from '/server/notifications/trayQueue';
import { prepareActivityEmail } from '/server/notifications/email';
import { EmailJobs } from '/server/notifications/emailQueue';
import { Notifications } from '/server/notifications/notifications';

describe('Awaited notification delivery', function () {
  this.timeout(30000);
  it('confirms profile writes, preserves read state on concurrent retries and refuses deleted recipients', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId=Random.id(),activityId=Random.id();
    try {
      await Meteor.users.rawCollection().insertOne({_id:userId,username:'notify-'+userId,
        profile:{notifyOverrideTray:true,notifyOverrideEmail:false}});
      const user=await Meteor.users.findOneAsync(userId);
      const services=await Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId});
      assert.ok(services.includes('email'));assert.ok(services.includes('profile'));
      const saved=await Meteor.users.findOneAsync(userId);
      assert.deepEqual(saved.profile.notifications,[{activity:activityId,read:null}]);
      await Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId});
      assert.equal((await Meteor.users.findOneAsync(userId)).profile.notifications.length,1);
      const readAt=new Date(123456);
      await Meteor.users.rawCollection().updateOne({_id:userId},{$set:{'profile.notifications.0.read':readAt}});
      await Promise.all(Array.from({length:5},()=>Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId})));
      assert.deepEqual((await Meteor.users.findOneAsync(userId)).profile.notifications,[{activity:activityId,read:readAt}]);
      const nextId=Random.id();
      await Promise.all(Array.from({length:5},()=>user.addNotification(nextId)));
      assert.deepEqual((await Meteor.users.findOneAsync(userId)).profile.notifications,
        [{activity:activityId,read:readAt},{activity:nextId,read:null}]);
      await user.removeNotification(activityId);
      await Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId});
      assert.deepEqual((await Meteor.users.findOneAsync(userId)).profile.notifications,[{activity:nextId,read:null}]);
      assert.equal(await trayDeliveryReceipts.find({userId}).countAsync(),1);
      await recoverTrayDeliveries();
      await Meteor.users.rawCollection().deleteOne({_id:userId});
      await assert.rejects(Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId:Random.id()}),
        error=>error.message==='notification-delivery-incomplete' && error.services.includes('profile'));
    } finally {
      await Meteor.users.rawCollection().deleteMany({_id:userId});
      await trayDeliveryReceipts.rawCollection().deleteMany({userId});
    }
  });
  it('recovers a dismissed event from its retained marker through the registered recovery scan', async function () {
    if (!Meteor.isAppTest) this.skip();
    const { receiptFor, PENDING, REVISION } = require('/server/lib/trayDelivery');
    const userId=Random.id(),activityId=Random.id(),receipt=receiptFor(userId,activityId);
    try {
      await Meteor.users.rawCollection().insertOne({_id:userId,username:'recovery-'+userId,
        profile:{notifications:[]},[PENDING]:receipt,[REVISION]:Random.id()});
      await recoverTrayDeliveries();
      assert.deepEqual(await trayDeliveryReceipts.findOneAsync(receipt._id,{transform:null}),receipt);
      const user=await Meteor.users.findOneAsync(userId);
      assert.deepEqual(user.profile.notifications,[]);
      assert.equal(Object.hasOwn(user,PENDING),false);
    } finally {
      await Meteor.users.rawCollection().deleteMany({_id:userId});
      await trayDeliveryReceipts.rawCollection().deleteMany({userId});
    }
  });

  it('prepares rendered email without queuing and the ordinary subscriber persists that content', async function () {
    if (!Meteor.isAppTest) this.skip();
    const userId=Random.id(),activityId=Random.id();
    try {
      await Meteor.users.rawCollection().insertOne({_id:userId,username:'prepare-'+userId,
        profile:{notifyOverrideEmail:true,notifyOverrideTray:false,language:'en'}});
      const user=await Meteor.users.findOneAsync(userId);
      const params={activityId,card:'Prepared card',user:'Author',url:'http://localhost:4100/card'};
      const job=await prepareActivityEmail(user,'act-activity-notify','act-createCard',params);
      assert.equal(job.userId,userId);assert.equal(job.eventId,activityId);
      assert.equal(job.language,user.getLanguage());assert.equal(typeof job.html,'string');
      assert.equal(await EmailJobs.find({userId}).countAsync(),0);
      await Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',params);
      const saved=await EmailJobs.findOneAsync({userId,eventId:activityId});
      assert.equal(saved.html,job.html);assert.equal(saved.subject,job.subject);assert.equal(saved.language,job.language);
      user.profile.notifyOverrideEmail=false;
      assert.equal(await prepareActivityEmail(user,'act-activity-notify','act-createCard',params),null);
    } finally {
      await EmailJobs.rawCollection().deleteMany({userId});
      await Meteor.users.rawCollection().deleteMany({_id:userId});
    }
  });

});
