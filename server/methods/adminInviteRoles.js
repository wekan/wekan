import { Meteor } from 'meteor/meteor';
import { setInviteRolesForAdmin } from '/server/lib/adminInviteRoles';

Meteor.methods({
  async setInviteToBoardRoles(roles) {
    return setInviteRolesForAdmin(this.userId, roles);
  },
});
