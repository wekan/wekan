import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
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
      await Meteor.users.rawCollection().deleteOne({_id:userId});
      await assert.rejects(Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId}),
        error=>error.message==='notification-delivery-incomplete' && error.services.includes('profile'));
    } finally {
      await Meteor.users.rawCollection().deleteMany({_id:userId});
    }
  });
});
