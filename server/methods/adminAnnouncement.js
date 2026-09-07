import { Meteor } from 'meteor/meteor';
import { setAnnouncementFieldForAdmin } from '/server/lib/adminAnnouncement';

Meteor.methods({
  async setAdminAnnouncement(field, value) {
    return setAnnouncementFieldForAdmin(this.userId, field, value);
  },
});
