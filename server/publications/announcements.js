import Announcements from '/models/announcements';

Meteor.publish('announcements', function() {
  const ret = Announcements.find();
  return ret;
});
