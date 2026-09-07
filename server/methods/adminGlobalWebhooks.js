import { Meteor } from 'meteor/meteor';
import { saveGlobalWebhookForAdmin } from '/server/lib/adminGlobalWebhooks';

Meteor.methods({
  async saveAdminGlobalWebhook(id, input) {
    return saveGlobalWebhookForAdmin(this.userId, id, input);
  },
});
