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
  }) {
    this.settings = {
      knownUsers,
      unknownUsers,
    };
  }

  startup() {
    (new KnownUser(this.settings.knownUsers)).startup();
    (new UnknownUser(this.settings.unknownUsers)).startup();
  }
}

export default AccountsLockout;
