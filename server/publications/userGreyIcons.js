// Publish only the current logged-in user's GreyIcons profile flag
import { Meteor } from 'meteor/meteor';

Meteor.publish('userGreyIcons', function publishUserGreyIcons() {
  if (!this.userId) return this.ready();
  return Meteor.users.find({ _id: this.userId }, { fields: { 'profile.GreyIcons': 1 } });
});
