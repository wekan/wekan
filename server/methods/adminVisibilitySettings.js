import { Meteor } from 'meteor/meteor';
import { saveVisibilitySettingsForAdmin } from '/server/lib/adminVisibilitySettings';

Meteor.methods({
  async saveAdminVisibilitySettings(group, values) {
    return saveVisibilitySettingsForAdmin(this.userId, group, values);
  },
});
