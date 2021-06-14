/* eslint-disable no-underscore-dangle */

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

class KnownUser {
  constructor(settings) {
    this.unchangedSettings = settings;
    this.settings = settings;
  }

  startup() {
    if (!(this.unchangedSettings instanceof Function)) {
      this.updateSettings();
    }
    this.scheduleUnlocksForLockedAccounts();
    KnownUser.unlockAccountsIfLockoutAlreadyExpired();
    this.hookIntoAccounts();
  }

  updateSettings() {
    const settings = KnownUser.knownUsers();
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
    const lockedAccountsCursor = Meteor.users.find(
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
    lockedAccountsCursor.forEach((user) => {
      let lockDuration = KnownUser.unlockTime(user) - currentTime;
      if (lockDuration >= this.settings.lockoutPeriod) {
        lockDuration = this.settings.lockoutPeriod * 1000;
      }
      if (lockDuration <= 1) {
        lockDuration = 1;
      }
      Meteor.setTimeout(
        KnownUser.unlockAccount.bind(null, user._id),
        lockDuration,
      );
    });
  }

  static unlockAccountsIfLockoutAlreadyExpired() {
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
    Meteor.users.update(query, data);
  }

  hookIntoAccounts() {
    Accounts.validateLoginAttempt(this.validateLoginAttempt.bind(this));
    Accounts.onLogin(KnownUser.onLogin);
  }


  validateLoginAttempt(loginInfo) {
    if (
      // don't interrupt non-password logins
      loginInfo.type !== 'password' ||
      loginInfo.user === undefined ||
      // Don't handle errors unless they are due to incorrect password
      (loginInfo.error !== undefined && loginInfo.error.reason !== 'Incorrect password')
    ) {
      return loginInfo.allowed;
    }

    // If there was no login error and the account is NOT locked, don't interrupt
    const unlockTime = KnownUser.unlockTime(loginInfo.user);
    if (loginInfo.error === undefined && unlockTime === 0) {
      return loginInfo.allowed;
    }

    if (this.unchangedSettings instanceof Function) {
      this.settings = this.unchangedSettings(loginInfo.user);
      this.validateSettings();
    }

    const userId = loginInfo.user._id;
    let failedAttempts = 1 + KnownUser.failedAttempts(loginInfo.user);
    const firstFailedAttempt = KnownUser.firstFailedAttempt(loginInfo.user);
    const currentTime = Number(new Date());

    const canReset = (currentTime - firstFailedAttempt) > (1000 * this.settings.failureWindow);
    if (canReset) {
      failedAttempts = 1;
      KnownUser.resetAttempts(failedAttempts, userId);
    }

    const canIncrement = failedAttempts < this.settings.failuresBeforeLockout;
    if (canIncrement) {
      KnownUser.incrementAttempts(failedAttempts, userId);
    }

    const maxAttemptsAllowed = this.settings.failuresBeforeLockout;
    const attemptsRemaining = maxAttemptsAllowed - failedAttempts;
    if (unlockTime > currentTime) {
      let duration = unlockTime - currentTime;
      duration = Math.ceil(duration / 1000);
      duration = duration > 1 ? duration : 1;
      KnownUser.tooManyAttempts(duration);
    }
    if (failedAttempts === maxAttemptsAllowed) {
      this.setNewUnlockTime(failedAttempts, userId);

      let duration = this.settings.lockoutPeriod;
      duration = Math.ceil(duration);
      duration = duration > 1 ? duration : 1;
      return KnownUser.tooManyAttempts(duration);
    }
    return KnownUser.incorrectPassword(
      failedAttempts,
      maxAttemptsAllowed,
      attemptsRemaining,
    );
  }

  static resetAttempts(
    failedAttempts,
    userId,
  ) {
    const currentTime = Number(new Date());
    const query = { _id: userId };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.firstFailedAttempt': currentTime,
      },
    };
    Meteor.users.update(query, data);
  }

  static incrementAttempts(
    failedAttempts,
    userId,
  ) {
    const currentTime = Number(new Date());
    const query = { _id: userId };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
      },
    };
    Meteor.users.update(query, data);
  }

  setNewUnlockTime(
    failedAttempts,
    userId,
  ) {
    const currentTime = Number(new Date());
    const newUnlockTime = (1000 * this.settings.lockoutPeriod) + currentTime;
    const query = { _id: userId };
    const data = {
      $set: {
        'services.accounts-lockout.failedAttempts': failedAttempts,
        'services.accounts-lockout.lastFailedAttempt': currentTime,
        'services.accounts-lockout.unlockTime': newUnlockTime,
      },
    };
    Meteor.users.update(query, data);
    Meteor.setTimeout(
      KnownUser.unlockAccount.bind(null, userId),
      this.settings.lockoutPeriod * 1000,
    );
  }

  static onLogin(loginInfo) {
    if (loginInfo.type !== 'password') {
      return;
    }
    const userId = loginInfo.user._id;
    const query = { _id: userId };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0,
      },
    };
    Meteor.users.update(query, data);
  }

  static incorrectPassword(
    failedAttempts,
    maxAttemptsAllowed,
    attemptsRemaining,
  ) {
    throw new Meteor.Error(
      403,
      'Incorrect password',
      JSON.stringify({
        message: 'Incorrect password',
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
        message: 'Wrong passwords were submitted too many times. Account is locked for a while.',
        duration,
      }),
    );
  }

  static knownUsers() {
    let knownUsers;
    try {
      knownUsers = Meteor.settings['accounts-lockout'].knownUsers;
    } catch (e) {
      knownUsers = false;
    }
    return knownUsers || false;
  }

  static unlockTime(user) {
    let unlockTime;
    try {
      unlockTime = user.services['accounts-lockout'].unlockTime;
    } catch (e) {
      unlockTime = 0;
    }
    return unlockTime || 0;
  }

  static failedAttempts(user) {
    let failedAttempts;
    try {
      failedAttempts = user.services['accounts-lockout'].failedAttempts;
    } catch (e) {
      failedAttempts = 0;
    }
    return failedAttempts || 0;
  }

  static lastFailedAttempt(user) {
    let lastFailedAttempt;
    try {
      lastFailedAttempt = user.services['accounts-lockout'].lastFailedAttempt;
    } catch (e) {
      lastFailedAttempt = 0;
    }
    return lastFailedAttempt || 0;
  }

  static firstFailedAttempt(user) {
    let firstFailedAttempt;
    try {
      firstFailedAttempt = user.services['accounts-lockout'].firstFailedAttempt;
    } catch (e) {
      firstFailedAttempt = 0;
    }
    return firstFailedAttempt || 0;
  }

  static unlockAccount(userId) {
    const query = { _id: userId };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0,
      },
    };
    Meteor.users.update(query, data);
  }
}

export default KnownUser;
