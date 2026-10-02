import { AccountsLockout } from 'meteor/wekan-accounts-lockout';
import LockoutSettings from '/models/lockoutSettings';

// The lockout reporter (and why it names the TARGET): server/lib/lockoutReporter.js.
import { reportLockout } from '/server/lib/lockoutReporter';

// A setting that cannot be read falls back to its default instead of
// abandoning the whole lockout: the old catch around everything left the
// server with NO login lockout at all whenever one read failed at startup.
async function lockoutSetting(id, fallback) {
  try {
    return (await LockoutSettings.findOneAsync(id))?.value || fallback;
  } catch (error) {
    console.error(`Lockout setting ${id} unreadable, using ${fallback}:`, error);
    return fallback;
  }
}

Meteor.startup(async () => {
  // Wait for the database to be ready
  Meteor.setTimeout(async () => {
    // Get configurations from database
    const knownUsersConfig = {
      failuresBeforeLockout: await lockoutSetting('known-failuresBeforeLockout', 3),
      lockoutPeriod: await lockoutSetting('known-lockoutPeriod', 60),
      failureWindow: await lockoutSetting('known-failureWindow', 15),
    };

    const unknownUsersConfig = {
      failuresBeforeLockout: await lockoutSetting('unknown-failuresBeforeLockout', 3),
      lockoutPeriod: await lockoutSetting('unknown-lockoutPeriod', 60),
      failureWindow: await lockoutSetting('unknown-failureWindow', 15),
    };

    try {
      // Initialize the AccountsLockout with configuration
      const accountsLockout = new AccountsLockout({
        knownUsers: knownUsersConfig,
        unknownUsers: unknownUsersConfig,
        onLockout: reportLockout,
      });

      // Start the accounts lockout mechanism
      accountsLockout.startup();
    } catch (error) {
      console.error('Failed to initialize accounts lockout:', error);
    }
  }, 2000); // Small delay to ensure database is ready
});
