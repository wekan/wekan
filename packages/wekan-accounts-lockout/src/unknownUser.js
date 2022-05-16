import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import _AccountsLockoutCollection from './accountsLockoutCollection';

class UnknownUser {
  constructor(
    settings,
    {
      AccountsLockoutCollection = _AccountsLockoutCollection,
    } = {},
  ) {
    this.AccountsLockoutCollection = AccountsLockoutCollection;
    this.settings = settings;
  }

  startup() {
    if (!(this.settings instanceof Function)) {
      this.updateSettings();
    }
    this.scheduleUnlocksForLockedAccounts();
    this.unlockAccountsIfLockoutAlreadyExpired();
    this.hookIntoAccounts();
  }

  updateSettings() {
    const settings = UnknownUser.unknownUsers();
    if (settings) {
      settings.forEach(function updateSetting({ key, value }) {
        this.settings[key] = value;
      });
    }
    this.validateSettings();
  }

  validateSettings() {
    if (
      !this.settings.failuresBeforeLockout ||
      this.settings.failuresBeforeLockout < 0
    ) {
      throw new Error('"failuresBeforeLockout" is not positive integer');
    }
    if (
      !this.settings.lockoutPeriod ||
      this.settings.lockoutPeriod < 0
    ) {
      throw new Error('"lockoutPeriod" is not positive integer');
    }
    if (
      !this.settings.failureWindow ||
      this.settings.failureWindow < 0
    ) {
      throw new Error('"failureWindow" is not positive integer');
    }
  }

  scheduleUnlocksForLockedAccounts() {
    const lockedAccountsCursor = this.AccountsLockoutCollection.find(
      {
        'services.accounts-lockout.unlockTime': {
          $gt: Number(new Date()),
        },
      },
      {
        fields: {
          'services.accounts-lockout.unlockTime': 1,
        },
      },
    );
    const currentTime = Number(new Date());
    lockedAccountsCursor.forEach((connection) => {
      let lockDuration = this.unlockTime(connection) - currentTime;
      if (lockDuration >= this.settings.lockoutPeriod) {
        lockDuration = this.settings.lockoutPeriod * 1000;
      }
      if (lockDuration <= 1) {
        lockDuration = 1;
      }
      Meteor.setTimeout(
        this.unlockAccount.bind(this, connection.clientAddress),
        lockDuration,
      );
    });
  }

  unlockAccountsIfLockoutAlreadyExpired() {
    const currentTime = Number(new Date());
    const query = {
      'services.accounts-lockout.unlockTime': {
        $lt: currentTime,
      },
    };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0,
      },
    };
    this.AccountsLockoutCollection.update(query, data);
  }

  hookIntoAccounts() {
    Accounts.validateLoginAttempt(this.validateLoginAttempt.bind(this));
    Accounts.onLogin(this.onLogin.bind(this));
  }

  validateLoginAttempt(loginInfo) {
    // don't interrupt non-password logins
    if (
      loginInfo.type !== 'password' ||
      loginInfo.user !== undefined ||
      loginInfo.error === undefined ||
      loginInfo.error.reason !== 'User not found'
    ) {
      return loginInfo.allowed;
    }

    if (this.settings instanceof Function) {
      this.settings = this.settings(loginInfo.connection);
      this.validateSettings();
    }

    const clientAddress = loginInfo.connection.clientAddress;
    const unlockTime = this.unlockTime(loginInfo.connection);
    let failedAttempts = 1 + this.failedAttempts(loginInfo.connection);
    const firstFailedAttempt = this.firstFailedAttempt(loginInfo.connection);
    const currentTime = Number(new Date());

    const canReset = (currentTime - firstFailedAttempt) > (1000 * this.settings.failureWindow);
    if (canReset) {
      failedAttempts = 1;
      this.resetAttempts(failedAttempts, clientAddress);
    }

    const canIncrement = failedAttempts < this.settings.failuresBeforeLockout;
    if (canIncrement) {
      this.incrementAttempts(failedAttempts, clientAddress);
    }

    const maxAttemptsAllowed = this.settings.failuresBeforeLockout;
    const attemptsRemaining = maxAttemptsAllowed - failedAttempts;
    if (unlockTime > currentTime) {
      let duration = unlockTime - currentTime;
      duration = Math.ceil(duration / 1000);
      duration = duration > 1 ? duration : 1;
      UnknownUser.tooManyAttempts(duration);
    }
    if (failedAttempts === maxAttemptsAllowed) {
      this.setNewUnlockTime(failedAttempts, clientAddress);

      let duration = this.settings.lockoutPeriod;
      duration = Math.ceil(duration);
      duration = duration > 1 ? duration : 1;
      return UnknownUser.tooManyAttempts(duration);
    }
    return UnknownUser.userNotFound(
      failedAttempts,
      maxAttemptsAllowed,
      attemptsRemaining,
    );
  }

  resetAttempts(
    failedAttempts,
    clientAddress,
  ) {
    const currentTime = Number(new Date());
    const query = { clientAddress };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.firstFailedAttempt': currentTime,
      },
    };
    this.AccountsLockoutCollection.upsert(query, data);
  }

  incrementAttempts(
    failedAttempts,
    clientAddress,
  ) {
    const currentTime = Number(new Date());
    const query = { clientAddress };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
      },
    };
    this.AccountsLockoutCollection.upsert(query, data);
  }

  setNewUnlockTime(
    failedAttempts,
    clientAddress,
  ) {
    const currentTime = Number(new Date());
    const newUnlockTime = (1000 * this.settings.lockoutPeriod) + currentTime;
    const query = { clientAddress };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.unlockTime': newUnlockTime,
      },
    };
    this.AccountsLockoutCollection.upsert(query, data);
    Meteor.setTimeout(
      this.unlockAccount.bind(this, clientAddress),
      this.settings.lockoutPeriod * 1000,
    );
  }

  onLogin(loginInfo) {
    if (loginInfo.type !== 'password') {
      return;
    }
    const clientAddress = loginInfo.connection.clientAddress;
    const query = { clientAddress };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0,
      },
    };
    this.AccountsLockoutCollection.update(query, data);
  }

  static userNotFound(
    failedAttempts,
    maxAttemptsAllowed,
    attemptsRemaining,
  ) {
    throw new Meteor.Error(
      403,
      'User not found',
      JSON.stringify({
        message: 'User not found',
        failedAttempts,
        maxAttemptsAllowed,
        attemptsRemaining,
      }),
    );
  }

  static tooManyAttempts(duration) {
    throw new Meteor.Error(
      403,
      'Too many attempts',
      JSON.stringify({
        message: 'Wrong emails were submitted too many times. Account is locked for a while.',
        duration,
      }),
    );
  }

  static unknownUsers() {
    let unknownUsers;
    try {
      unknownUsers = Meteor.settings['accounts-lockout'].unknownUsers;
    } catch (e) {
      unknownUsers = false;
    }
    return unknownUsers || false;
  }

  findOneByConnection(connection) {
    return this.AccountsLockoutCollection.findOne({
      clientAddress: connection.clientAddress,
    });
  }

  unlockTime(connection) {
    connection = this.findOneByConnection(connection);
    let unlockTime;
    try {
      unlockTime = connection.services['accounts-lockout'].unlockTime;
    } catch (e) {
      unlockTime = 0;
    }
    return unlockTime || 0;
  }

  failedAttempts(connection) {
    connection = this.findOneByConnection(connection);
    let failedAttempts;
    try {
      failedAttempts = connection.services['accounts-lockout'].failedAttempts;
    } catch (e) {
      failedAttempts = 0;
    }
    return failedAttempts || 0;
  }

  lastFailedAttempt(connection) {
    connection = this.findOneByConnection(connection);
    let lastFailedAttempt;
    try {
      lastFailedAttempt = connection.services['accounts-lockout'].lastFailedAttempt;
    } catch (e) {
      lastFailedAttempt = 0;
    }
    return lastFailedAttempt || 0;
  }

  firstFailedAttempt(connection) {
    connection = this.findOneByConnection(connection);
    let firstFailedAttempt;
    try {
      firstFailedAttempt = connection.services['accounts-lockout'].firstFailedAttempt;
    } catch (e) {
      firstFailedAttempt = 0;
    }
    return firstFailedAttempt || 0;
  }

  unlockAccount(clientAddress) {
    const query = { clientAddress };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0,
      },
    };
    this.AccountsLockoutCollection.update(query, data);
  }
}

export default UnknownUser;
