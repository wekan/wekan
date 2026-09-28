import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Notifications } from '/server/notifications/notifications';

describe('Awaited notification delivery', function () {
  this.timeout(30000);
  it('waits for the actual profile helper write and refuses a deleted recipient', async function () {
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
      await Meteor.users.rawCollection().deleteOne({_id:userId});
      await assert.rejects(Notifications.notifyAndWait(user,'act-activity-notify','act-createCard',{activityId}),
        error=>error.message==='notification-delivery-incomplete' && error.services.includes('profile'));
    } finally {
      await Meteor.users.rawCollection().deleteMany({_id:userId});
    }
  });
});
