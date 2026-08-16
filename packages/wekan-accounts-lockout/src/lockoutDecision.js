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
//
// INCREASING DELAYS. The lockout on its own is a step function - two failures
// cost nothing, the third costs sixty seconds. A guesser spends the two free
// attempts of every window and waits; somebody who mistyped their password gets
// no warning that they are close to being locked out. A delay that GROWS with
// each failure costs a guesser far more than it costs a person, and it degrades
// instead of slamming shut: the account is never unavailable, it is only slower
// to try again.
//
// The delay is per (user, source address), like the counter, and for the same
// reason - an attacker must not be able to slow down the account's owner. And a
// correct password is still allowed immediately, delay or no delay: somebody who
// did not have to guess has proved they are not who this is for.

// How long to wait after the nth failure, in milliseconds. Doubling from a base,
// capped - so it becomes expensive quickly and then stops growing rather than
// running away into hours nobody wants to support.
function delayAfterFailures(n, settings = {}) {
  const base = Number(settings.loginDelayBase) || 0;
  if (base <= 0 || n < 1) return 0;
  const max = Number(settings.loginDelayMax) || 0;
  const grown = base * (2 ** (n - 1));
  const capped = max > 0 ? Math.min(grown, max) : grown;
  return Math.round(capped * 1000);
}

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

  // Too soon after the last failure. Refused WITHOUT counting: the delay is
  // there to slow a guesser down, and letting a refused-too-early attempt add
  // to the counter would let an attacker lock the address out faster by trying
  // faster - which is the wrong way round. Like the lock above, it is not
  // extended by hammering.
  if (scope.nextAttemptAt > now) {
    return {
      action: 'too-soon',
      secondsRemaining: Math.max(1, Math.ceil((scope.nextAttemptAt - now) / 1000)),
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

  const delayMs = delayAfterFailures(failedAttempts, settings);
  return {
    action: 'count',
    failedAttempts,
    startsWindow,
    maxAttemptsAllowed: failuresBeforeLockout,
    attemptsRemaining: failuresBeforeLockout - failedAttempts,
    // When this address may try again. Zero when delays are switched off, and
    // the caller then writes no nextAttemptAt at all.
    delayMs,
    nextAttemptAt: delayMs > 0 ? now + delayMs : 0,
  };
}

module.exports = { decideKnownUserAttempt, delayAfterFailures };
