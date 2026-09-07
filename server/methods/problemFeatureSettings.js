import { Meteor } from 'meteor/meteor';
import { setProblemFeatureSettingForAdmin } from '/server/lib/problemFeatureSettings';

Meteor.methods({
  async setProblemFeatureSetting(pane, field, enabled) {
    return setProblemFeatureSettingForAdmin(this.userId, pane, field, enabled);
  },
});
