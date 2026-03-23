import AccessibilitySettings from '/models/accessibilitySettings';

Meteor.publish('accessibilitySettings', function() {
  return AccessibilitySettings.find({});
});
