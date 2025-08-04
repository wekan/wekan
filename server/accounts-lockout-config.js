import { AccountsLockout } from 'meteor/wekan-accounts-lockout';
import LockoutSettings from '/models/lockoutSettings';

Meteor.startup(() => {
  // Wait for the database to be ready
  Meteor.setTimeout(() => {
    try {
      // Get configurations from database
      const knownUsersConfig = {
        failuresBeforeLockout: LockoutSettings.findOne('known-failuresBeforeLockout')?.value || 3,
        lockoutPeriod: LockoutSettings.findOne('known-lockoutPeriod')?.value || 60,
        failureWindow: LockoutSettings.findOne('known-failureWindow')?.value || 15
      };

      const unknownUsersConfig = {
        failuresBeforeLockout: LockoutSettings.findOne('unknown-failuresBeforeLockout')?.value || 3,
        lockoutPeriod: LockoutSettings.findOne('unknown-lockoutPeriod')?.value || 60,
        failureWindow: LockoutSettings.findOne('unknown-failureWindow')?.value || 15
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
