// https://atmospherejs.com/lucasantoniassi/accounts-lockout
// server
import { AccountsLockout } from 'meteor/lucasantoniassi:accounts-lockout';

(new AccountsLockout({
  knownUsers: {
    failuresBeforeLockout: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE || 3,
    lockoutPeriod: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD || 60,
    failureWindow: process.env.ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW || 15,
  },
  unknownUsers: {
    failuresBeforeLockout: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE || 3,
    lockoutPeriod: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD || 60,
    failureWindow: process.env.ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW || 15,
  },
})).startup();
