import KnownUser from './knownUser';
import UnknownUser from './unknownUser';

class AccountsLockout {
  constructor({
    knownUsers = {
      failuresBeforeLockout: 3,
      lockoutPeriod: 60,
      failureWindow: 15,
    },
    unknownUsers = {
      failuresBeforeLockout: 3,
      lockoutPeriod: 60,
      failureWindow: 15,
    },
    // Called when a lockout FIRES, so an attempt shows in Admin Panel ->
    // Problems. A Meteor package cannot import app code, so the app injects the
    // reporter: server/accounts-lockout-config.js passes one that writes a
    // security-log event. Optional, and never awaited - the lockout is the
    // defence, and reporting must not be able to hold it up or break it.
    onLockout = null,
  }) {
    this.settings = {
      knownUsers,
      unknownUsers,
    };
    this.onLockout = onLockout;
  }

  startup() {
    (new KnownUser(this.settings.knownUsers, this.onLockout)).startup();
    (new UnknownUser(this.settings.unknownUsers)).startup();
  }
}

export default AccountsLockout;
