import LockoutSettings from '/models/lockoutSettings';

Meteor.publish('lockoutSettings', function() {
  const ret = LockoutSettings.find();
  return ret;
});
