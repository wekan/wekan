Meteor.publish('accessibilitySettings', function() {
  return AccessibilitySettings.find({});
});
