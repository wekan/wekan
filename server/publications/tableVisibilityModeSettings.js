Meteor.publish('tableVisibilityModeSettings', function() {
  return TableVisibilityModeSettings.find();
});
