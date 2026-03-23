import Avatars from '../../models/avatars';
import { ReactiveCache } from '/imports/reactiveCache';

Meteor.publish('my-avatars', async function() {
  const ret = (await ReactiveCache.getAvatars({ userId: this.userId }, {}, true)).cursor;
  return ret;
});
