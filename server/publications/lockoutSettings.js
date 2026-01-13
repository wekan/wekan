import LockoutSettings from '/models/lockoutSettings';
import { Settings } from '../../models/settings';

Meteor.publish('lockoutSettings', function() {
  const ret = LockoutSettings.find();
  return ret;
});
