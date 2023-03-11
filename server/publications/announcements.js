Meteor.publish('announcements', function() {
  const ret = Announcements.find();
  return ret;
});
