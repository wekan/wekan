import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { lockoutPageForAdmin, unlockAllUsersForAdmin,
  unlockUserForAdmin } from '/server/lib/adminLockout';

// Method to find locked users and release them if needed
Meteor.methods({
  async getLockedUsers() {
    return (await lockoutPageForAdmin(this.userId)).lockedUsers;
  },

  async unlockUser(userId) {
    check(userId, String);
    return unlockUserForAdmin(this.userId, userId);
  },

  async unlockAllUsers() {
    return unlockAllUsersForAdmin(this.userId);
  }
});
