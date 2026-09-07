import { Meteor } from 'meteor/meteor';
import { saveEmailAccessForAdmin } from '/server/lib/adminEmailSettings';

Meteor.methods({
  async saveAdminEmailAccess(input) {
    return saveEmailAccessForAdmin(this.userId, input);
  },
});
