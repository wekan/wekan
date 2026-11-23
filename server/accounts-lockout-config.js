// Not imported statically: the Sandstorm .spk is built without
// wekan-accounts-lockout, like the password login it locks out
// (releases/sandstorm-slim.mjs,
// docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md).
const AccountsLockout = Package['wekan-accounts-lockout']
  ? require('meteor/wekan-accounts-lockout').AccountsLockout
  : null;
import LockoutSettings from '/models/lockoutSettings';
const { lockoutConfigs } = require('/models/lib/lockoutConfig');

// The lockout reporter (and why it names the TARGET): server/lib/lockoutReporter.js.
import { reportLockout } from '/server/lib/lockoutReporter';

// The lockout's settings: every one of them, with its default, from
// models/lib/lockoutConfig.js. A setting that cannot be read falls back to its
// default instead of abandoning the whole lockout: the old catch around
// everything left the server with NO login lockout at all whenever one read
// failed at startup.
const readLockoutSetting = async id => (await LockoutSettings.findOneAsync(id))?.value;
const logUnreadable = (id, fallback, error) =>
  console.error(`Lockout setting ${id} unreadable, using ${fallback}:`, error);

Meteor.startup(async () => {
  if (!AccountsLockout) return;
  // Wait for the database to be ready
  Meteor.setTimeout(async () => {
    const { knownUsers: knownUsersConfig, unknownUsers: unknownUsersConfig } =
      await lockoutConfigs(readLockoutSetting, logUnreadable);

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
