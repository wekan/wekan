import { AccountsLockout } from 'meteor/wekan-accounts-lockout';
import { ReactiveCache } from '/imports/reactiveCache';
import LockoutSettings from '/models/lockoutSettings';

Meteor.methods({
  async reloadAccountsLockout() {
    // Check if user has admin rights
    const userId = Meteor.userId();
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
