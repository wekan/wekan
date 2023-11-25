import Avatars from '../../models/avatars';
Meteor.publish('my-avatars', function() {
  const ret = ReactiveCache.getAvatars({ userId: this.userId }, {}, true).cursor;
  return ret;
});
