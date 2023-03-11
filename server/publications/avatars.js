import Avatars from '../../models/avatars';
Meteor.publish('my-avatars', function() {
  const ret = Avatars.find({ userId: this.userId }).cursor;
  return ret;
});
