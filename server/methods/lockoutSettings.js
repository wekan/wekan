import { Meteor } from 'meteor/meteor';
// Absent from the Sandstorm .spk (releases/sandstorm-slim.mjs), so asked for
// only when the package is in the build.
const AccountsLockout = Package['wekan-accounts-lockout']
  ? require('meteor/wekan-accounts-lockout').AccountsLockout
  : null;
import { ReactiveCache } from '/imports/reactiveCache';
import LockoutSettings from '/models/lockoutSettings';
const { lockoutConfigs } = require('/models/lib/lockoutConfig');

// The lockout reporter (and why it names the TARGET): server/lib/lockoutReporter.js.
import { reportLockout } from '/server/lib/lockoutReporter';


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
    // No password login, so nothing to lock out (the Sandstorm .spk).
    if (!AccountsLockout) return false;

    try {
      // The same settings, defaults and per-setting fallback as at startup
      // (models/lib/lockoutConfig.js) - the delay after a wrong password included.
      const { knownUsers: knownUsersConfig, unknownUsers: unknownUsersConfig } = await lockoutConfigs(
        async id => (await LockoutSettings.findOneAsync(id))?.value,
        (id, fallback, error) => console.error(`Lockout setting ${id} unreadable, using ${fallback}:`, error),
      );

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
