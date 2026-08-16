/* eslint-disable no-underscore-dangle */

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// GHSA-2g94-9x3m-hv37: decide from the attempt's structural fields, not the
// (ambiguous, Meteor-rewritten) reason string. See loginFailureDecision.js.
const { shouldProcessKnownUser } = require('./loginFailureDecision');
// GHSA-rf3w-rj48-jxcc: which counter an attempt belongs to, and what to do
// about it. Both are pure modules so the decision can be tested without a
// server - see lockoutScope.js and lockoutDecision.js for what went wrong.
const {
  clientAddressOf, scopeFieldFor, scopeStateOf, SCOPE_ROOT,
} = require('./lockoutScope');
const { decideKnownUserAttempt } = require('./lockoutDecision');

class KnownUser {
  constructor(settings, onLockout = null) {
    this.unchangedSettings = settings;
    this.settings = settings;
    this.onLockout = onLockout;
  }

  async startup() {
    if (!(this.unchangedSettings instanceof Function)) {
      this.updateSettings();
    }
    await this.scheduleUnlocksForLockedAccounts();
    await KnownUser.unlockAccountsIfLockoutAlreadyExpired();
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

  // The two sweeps below read the PRE-FIX flat fields
  // (services.accounts-lockout.unlockTime), which nothing writes any more. They
  // are kept as the upgrade path: an account left locked by the old global
  // counter is freed at the next startup rather than waiting out a lock whose
  // owner cannot see the end of. Per-address locks need no sweep - each carries
  // its own unlockTime and decideKnownUserAttempt treats an expired one as not
  // locked, so a stale entry is inert and is overwritten by the next failure.
  async scheduleUnlocksForLockedAccounts() {
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
    for await (const user of lockedAccountsCursor) {
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
    }
  }

  static async unlockAccountsIfLockoutAlreadyExpired() {
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
    await Meteor.users.updateAsync(query, data);
  }

  hookIntoAccounts() {
    Accounts.validateLoginAttempt(this.validateLoginAttempt.bind(this));
    Accounts.onLogin(KnownUser.onLogin);
  }

  async validateLoginAttempt(loginInfo) {
    // GHSA-2g94-9x3m-hv37: this used to early-return whenever
    // `loginInfo.error.reason !== 'Incorrect password'`, but with Meteor's
    // default `ambiguousErrorMessages` the reason is never that literal, so the
    // hook always bailed out and the lockout never counted a single failure.
    // Decide from the structural fields instead (password login of a known user
    // that is not the benign 'no-2fa-code' step), so any wrong-password attempt
    // is counted and the lockout actually fires.
    if (!shouldProcessKnownUser(loginInfo)) {
      return loginInfo.allowed;
    }

    const userId = loginInfo.user._id;
    const hadError = loginInfo.error !== undefined;

    // GHSA-rf3w-rj48-jxcc, fault 2: a correct password is allowed even while
    // this address is locked, and clears the lock. Checked before anything else
    // reads the counter, and before the settings callback, so there is no path
    // by which a proven login can be refused. Somebody who did not have to guess
    // is not who the lockout is for.
    if (!hadError) {
      await KnownUser.clearLockout(userId);
      return loginInfo.allowed;
    }

    if (this.unchangedSettings instanceof Function) {
      this.settings = this.unchangedSettings(loginInfo.user);
      this.validateSettings();
    }

    // GHSA-rf3w-rj48-jxcc, fault 1: the counter is per (user, source address).
    const address = clientAddressOf(loginInfo.connection, process.env.HTTP_FORWARDED_COUNT);
    const field = scopeFieldFor(address);
    const decision = decideKnownUserAttempt({
      hadError,
      now: Number(new Date()),
      settings: this.settings,
      scope: scopeStateOf(loginInfo.user, address),
    });

    if (decision.action === 'locked') {
      return KnownUser.tooManyAttempts(decision.secondsRemaining);
    }

    // Refused for being too soon after the last failure, and NOT counted - see
    // lockoutDecision.js. Nothing is written, so trying faster cannot make the
    // address reach the lockout sooner.
    if (decision.action === 'too-soon') {
      return KnownUser.tooSoon(decision.secondsRemaining);
    }

    const now = Number(new Date());
    const set = {
      [`${field}.failedAttempts`]: decision.failedAttempts,
      [`${field}.lastFailedAttempt`]: now,
    };
    if (decision.startsWindow) set[`${field}.firstFailedAttempt`] = now;
    if (decision.nextAttemptAt) set[`${field}.nextAttemptAt`] = decision.nextAttemptAt;
    if (decision.action === 'lock') {
      set[`${field}.unlockTime`] = decision.unlockTime;
      // A DISPLAY field, for Admin Panel -> People only: Mongo cannot ask "which
      // accounts are locked" over dynamically-named subdocuments without an
      // aggregation. Never read by the decision above - a field that says "this
      // ACCOUNT is locked" is the vulnerability this fix removed.
      set['services.accounts-lockout.lockedUntil'] = decision.unlockTime;
    }
    await Meteor.users.updateAsync({ _id: userId }, { $set: set });

    if (decision.action === 'lock') {
      Meteor.setTimeout(
        KnownUser.unlockAddress.bind(null, userId, field),
        this.settings.lockoutPeriod * 1000,
      );
      // An administrator should be able to SEE that somebody tried. A lock
      // firing means this many wrong passwords in a row from ONE address - not
      // something ordinary use produces, which is what makes it worth a line in
      // Admin Panel -> Problems rather than noise that buries one.
      //
      // The lock is what matters; the record of it is not. So the reporter is
      // optional, is never awaited, and cannot throw into this path.
      try {
        if (this.onLockout) {
          this.onLockout({
            userId,
            failedAttempts: decision.failedAttempts,
            lockoutSeconds: decision.secondsRemaining,
          });
        }
      } catch (e) { /* reporting must never break the lockout */ }
      return KnownUser.tooManyAttempts(decision.secondsRemaining);
    }
    return KnownUser.incorrectPassword(
      decision.failedAttempts,
      decision.maxAttemptsAllowed,
      decision.attemptsRemaining,
    );
  }

  // Everything this user has accumulated, from every address, plus the flat
  // fields written by versions before this fix - so an account left locked by
  // the old global counter is freed by its owner's next correct password
  // instead of waiting out a lock nobody can see the end of.
  static async clearLockout(userId) {
    await Meteor.users.updateAsync({ _id: userId }, {
      $unset: {
        [SCOPE_ROOT]: '',
        'services.accounts-lockout.unlockTime': '',
        'services.accounts-lockout.failedAttempts': '',
        'services.accounts-lockout.firstFailedAttempt': '',
        'services.accounts-lockout.lastFailedAttempt': '',
        'services.accounts-lockout.lockedUntil': '',
      },
    });
  }

  static async unlockAddress(userId, field) {
    await Meteor.users.updateAsync({ _id: userId }, { $unset: { [field]: '' } });
    // If that was the last address still locked, the account is not locked, and
    // the display field must stop saying it is.
    const user = await Meteor.users.findOneAsync(
      { _id: userId },
      { fields: { 'services.accounts-lockout': 1 } },
    );
    // Is any OTHER address still locked out of this account? Asked here rather
    // than through models/lib/accountLockout.js, which is app code: a Meteor
    // package is compiled separately and cannot import from the app. The shape
    // is the one that file documents, and tests/lockoutPerSourceAddress.test.cjs
    // checks the two agree.
    const stillLocked = (() => {
      let byAddress;
      try { byAddress = user.services['accounts-lockout'].byAddress; } catch (e) { return false; }
      if (!byAddress || typeof byAddress !== 'object') return false;
      const now = Number(new Date());
      return Object.keys(byAddress).some(k => {
        const entry = byAddress[k];
        return entry && typeof entry.unlockTime === 'number' && entry.unlockTime > now;
      });
    })();
    if (user && !stillLocked) {
      await Meteor.users.updateAsync(
        { _id: userId },
        { $unset: { 'services.accounts-lockout.lockedUntil': '' } },
      );
    }
  }

  static async onLogin(loginInfo) {
    if (loginInfo.type !== 'password') {
      return;
    }
    // Same clearing as the success path in validateLoginAttempt, so a login can
    // never leave state behind that would count against the next one.
    await KnownUser.clearLockout(loginInfo.user._id);
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

  // Not a lockout: the address may try again in `duration` seconds. Said with
  // its own message so somebody who mistyped can see that they are being slowed
  // down rather than shut out, and how long for.
  static tooSoon(duration) {
    throw new Meteor.Error(
      403,
      'Too soon',
      JSON.stringify({
        message: 'Wait a moment before trying again.',
        duration,
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

  static async unlockAccount(userId) {
    const query = { _id: userId };
    const data = {
      $unset: {
        'services.accounts-lockout.unlockTime': 0,
        'services.accounts-lockout.failedAttempts': 0,
      },
    };
    await Meteor.users.updateAsync(query, data);
  }
}

export default KnownUser;
