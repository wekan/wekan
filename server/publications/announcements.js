Meteor.publish('announcements', function() {
  return Announcements.find();
});
