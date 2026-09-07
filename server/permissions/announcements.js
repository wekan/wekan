import { Meteor } from 'meteor/meteor';
import Announcements from '/models/announcements';

Announcements.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});
