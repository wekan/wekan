import { Meteor } from 'meteor/meteor';
import { AccountsLockout } from 'meteor/wekan-accounts-lockout';
import { ReactiveCache } from '/imports/reactiveCache';
import LockoutSettings from '/models/lockoutSettings';

// GHSA-rf3w-rj48-jxcc: a lockout firing is an ATTEMPT that the fix refused, so
// it belongs in Admin Panel -> Problems. A Meteor package cannot import app
// code, so the reporter is injected here. Wrapped, because the record of the
// defence must never be able to break the defence.
function reportLockout({ userId, failedAttempts, lockoutSeconds }) {
  try {
    require('/server/lib/securityLog').record({
      key: 'brute.lockout',
      action: 'blocked',
      source: 'DDP login',
      detail: `locked one address out of account ${userId} after ${failedAttempts} `
        + `wrong passwords, for ${lockoutSeconds}s`,
    });
  } catch (e) { /* logging must never break the guard */ }
}


Meteor.methods({
  async reloadAccountsLockout() {
    // Check if user has admin rights
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed');
    }

    try {
      // Get configurations from database
      const knownUsersConfig = {
        failuresBeforeLockout: (await LockoutSettings.findOneAsync('known-failuresBeforeLockout'))?.value || 3,
        lockoutPeriod: (await LockoutSettings.findOneAsync('known-lockoutPeriod'))?.value || 60,
        failureWindow: (await LockoutSettings.findOneAsync('known-failureWindow'))?.value || 15
      };

      const unknownUsersConfig = {
        failuresBeforeLockout: (await LockoutSettings.findOneAsync('unknown-failuresBeforeLockout'))?.value || 3,
        lockoutPeriod: (await LockoutSettings.findOneAsync('unknown-lockoutPeriod'))?.value || 60,
        failureWindow: (await LockoutSettings.findOneAsync('unknown-failureWindow'))?.value || 15
      };

      // Initialize the AccountsLockout with configuration
      const accountsLockout = new AccountsLockout({
        knownUsers: knownUsersConfig,
        unknownUsers: unknownUsersConfig,
        onLockout: reportLockout,
      });

      // Start the accounts lockout mechanism
      accountsLockout.startup();

      return true;
    } catch (error) {
      console.error('Failed to reload accounts lockout:', error);
      throw new Meteor.Error('error-reloading-settings', 'Error reloading settings');
    }
  }
});
