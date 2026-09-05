import { AccountsLockout } from 'meteor/wekan-accounts-lockout';
import LockoutSettings from '/models/lockoutSettings';

// GHSA-rf3w-rj48-jxcc: a lockout firing is an ATTEMPT that the fix refused, so
// it belongs in Admin Panel -> Problems. A Meteor package cannot import app
// code, so the reporter is injected here. Wrapped, because the record of the
// defence must never be able to break the defence.
function reportLockout({ userId, username, ip, headers, failedAttempts, lockoutSeconds }) {
  try {
    require('/server/lib/securityLog').record({
      key: 'brute.lockout',
      action: 'blocked',
      source: 'DDP login',
      userId,
      username,
      ip,
      location: require('/models/lib/geoHeaders').locationFromHeaders(headers),
      detail: `locked one address out of account ${userId} after ${failedAttempts} `
        + `wrong passwords, for ${lockoutSeconds}s`,
    });
  } catch (e) { /* logging must never break the guard */ }
}

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
        onLockout: reportLockout,
      });

      // Start the accounts lockout mechanism
      accountsLockout.startup();
    } catch (error) {
      console.error('Failed to initialize accounts lockout:', error);
    }
  }, 2000); // Small delay to ensure database is ready
});
