import { Meteor } from 'meteor/meteor';
import { setSecurityFeatureSettingForAdmin } from '/server/lib/problemFeatureSettings';

Meteor.methods({
  async setSecurityFeatureSetting(field, enabled) {
    return setSecurityFeatureSettingForAdmin(this.userId, field, enabled);
  },
});
