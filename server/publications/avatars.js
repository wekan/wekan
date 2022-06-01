import Avatars from '../../models/avatars';
Meteor.publish('my-avatars', function() {
  return Avatars.find({ userId: this.userId }).cursor;
});
