import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { reloadLockoutForAdmin, saveLockoutSettingsForAdmin } from '/server/lib/adminLockout';

Meteor.methods({
  async reloadAccountsLockout() {
    return reloadLockoutForAdmin(this.userId);
  },
  async saveAccountsLockoutSettings(input) {
    check(input, Object);
    return saveLockoutSettingsForAdmin(this.userId, input);
  },
});
