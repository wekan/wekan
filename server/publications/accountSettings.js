Meteor.publish('accountSettings', function() {
  return AccountSettings.find();
});
