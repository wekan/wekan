import { Settings } from '../../models/settings';

Meteor.publish('tableVisibilityModeSettings', function() {
  const ret = TableVisibilityModeSettings.find();
  return ret;
});
