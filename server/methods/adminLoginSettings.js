import { Meteor } from 'meteor/meteor';
import {
  setLoginAllowForAdmin,
  setLoginIdentityForAdmin,
} from '/server/lib/adminLoginSettings';

Meteor.methods({
  async setAdminLoginAllow(key, allowed) {
    return setLoginAllowForAdmin(this.userId, key, allowed);
  },
  async setAdminLoginIdentity(input) {
    return setLoginIdentityForAdmin(this.userId, input);
  },
});
