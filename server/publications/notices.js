Meteor.publish('notices', function() {
  return Notices.find();
});
