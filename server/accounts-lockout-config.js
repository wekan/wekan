import { AccountsLockout } from 'meteor/wekan-accounts-lockout';
import LockoutSettings from '/models/lockoutSettings';

Meteor.startup(async () => {
  // Wait for the database to be ready
  Meteor.setTimeout(async () => {
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
    } catch (error) {
      console.error('Failed to initialize accounts lockout:', error);
    }
  }, 2000); // Small delay to ensure database is ready
});
