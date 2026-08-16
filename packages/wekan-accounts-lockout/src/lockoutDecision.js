/* eslint-disable no-underscore-dangle */

// What the known-user lockout should do about one login attempt.
//
// Pure, so the two faults in GHSA-rf3w-rj48-jxcc can be tested without a Meteor
// server, a database or a socket. Both were in this decision and neither was
// visible from the surrounding plumbing:
//
//   1. THE COUNTER WAS GLOBAL. See lockoutScope.js - the scope is per (user,
//      source address) now, and this function is told which scope's state it is
//      looking at.
//
//   2. A CORRECT PASSWORD WAS REFUSED WHILE LOCKED, and counted as another
//      failure on the way. The old code allowed the attempt only when there was
//      no error AND no lock:
//
//        if (loginInfo.error === undefined && unlockTime === 0) return allowed;
//
//      so during a lock the real owner, typing the right password, fell through
//      to the same `tooManyAttempts` throw as the attacker - and incremented the
//      counter that was locking them out. The lock is meant to stop guessing.
//      Somebody who did not have to guess has proved they are not the attacker,
//      so a correct password is ALWAYS allowed and always clears the state.
//
// The result says what to do and never how: the caller writes to Mongo, throws
// the Meteor errors and sets the timers.

// `attempt` is { hadError, now, settings, scope } where scope is the state from
// lockoutScope.scopeStateOf and settings has failuresBeforeLockout,
// lockoutPeriod and failureWindow (seconds).
function decideKnownUserAttempt({ hadError, now, settings, scope }) {
  // A correct password ends it, whatever the counter says. This is the fix for
  // fault 2, and it is deliberately the FIRST thing: no lock check above it can
  // reject a login that has already proved itself.
  if (!hadError) {
    return { action: 'allow', clearScope: true };
  }

  const { failuresBeforeLockout, lockoutPeriod, failureWindow } = settings;

  // Locked, and still wrong: say how long is left and do not extend it. Not
  // extending matters - an attacker who keeps hammering during a lock would
  // otherwise push the unlock time further out for as long as they liked, which
  // is the denial of service again inside the mechanism meant to stop it.
  if (scope.unlockTime > now) {
    return {
      action: 'locked',
      secondsRemaining: Math.max(1, Math.ceil((scope.unlockTime - now) / 1000)),
    };
  }

  // The failure window has passed since the first failure in this run, so this
  // attempt starts a new one.
  const windowExpired = scope.firstFailedAttempt > 0
    && (now - scope.firstFailedAttempt) > (1000 * failureWindow);
  const failedAttempts = windowExpired ? 1 : scope.failedAttempts + 1;
  const startsWindow = windowExpired || scope.failedAttempts === 0;

  if (failedAttempts >= failuresBeforeLockout) {
    return {
      action: 'lock',
      failedAttempts,
      startsWindow,
      unlockTime: now + (1000 * lockoutPeriod),
      secondsRemaining: Math.max(1, Math.ceil(lockoutPeriod)),
    };
  }

  return {
    action: 'count',
    failedAttempts,
    startsWindow,
    maxAttemptsAllowed: failuresBeforeLockout,
    attemptsRemaining: failuresBeforeLockout - failedAttempts,
  };
}

module.exports = { decideKnownUserAttempt };
