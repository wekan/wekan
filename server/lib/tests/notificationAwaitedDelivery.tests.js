import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { trayDeliveryReceipts, recoverTrayDeliveries } from '/server/notifications/trayQueue';
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

});
