import Avatars from '../../models/avatars';
import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('my-avatars', async function() {
  const ret = (await ReactiveCache.getAvatars({ userId: this.userId }, {}, true)).cursor;
  return ret;
});

Meteor.publish('avatars-for-user', async function(targetUserId) {
  check(targetUserId, String);
  // Allow admins to view avatars for any user
  const currentUser = await Meteor.users.findOneAsync(this.userId);
  if (!currentUser || !currentUser.isAdmin) {
    return this.ready();
  }
  const ret = (await ReactiveCache.getAvatars({ userId: targetUserId }, {}, true)).cursor;
  return ret;
});
