'use strict';

// Decides whether a login attempt must be counted as a failed password attempt
// for the accounts-lockout brute-force protection.
//
// GHSA-2g94-9x3m-hv37 (User Enumeration + Unthrottled Password Brute-Force):
// the two lockout hooks used to gate on the English failure *reason string*
// ('Incorrect password' for a known user, 'User not found' for an unknown one).
// At runtime that reason never arrives. Meteor's accounts-base ships
// `ambiguousErrorMessages` defaulting to true (see accounts_server.js
// `_handleError`), so every credential failure is rewritten to the single
// message "Something went wrong. Please check your credentials." before the
// validateLoginAttempt hooks run. The `reason !== 'Incorrect password'` /
// `reason !== 'User not found'` guards therefore ALWAYS matched, both hooks
// returned early, the failure counter was never incremented, and the lockout
// never fired — unlimited unthrottled password guessing.
//
// The fix is to decide from the STRUCTURAL fields of the attempt (login type,
// whether a user matched, whether the attempt failed) instead of a localized,
// Meteor-internal reason string that we do not control.

// Meteor error CODES (the `error` field of a Meteor.Error, NOT the `reason`
// message) that represent a step which is NOT a failed password guess and must
// therefore never count toward a lockout:
//
//   'no-2fa-code' — accounts-2fa throws this AFTER the password already checked
//   out, to ask the client for the second factor. It is the normal first leg of
//   every two-factor login; counting it would lock out legitimate 2FA users
//   after a few ordinary sign-ins.
//
// A wrong second factor ('invalid-2fa-code') is intentionally NOT excluded: the
// password was correct, so repeated wrong codes are a real guessing attempt and
// should count.
const NON_FAILURE_ERROR_CODES = new Set(['no-2fa-code']);

function isNonFailureError(error) {
  return (
    error !== undefined &&
    error !== null &&
    NON_FAILURE_ERROR_CODES.has(error.error)
  );
}

// True when this attempt is a real, countable credential failure (any password
// failure that is not one of the benign non-failure steps above), regardless of
// the (now ambiguous) reason string.
function isCountableFailure(error) {
  if (error === undefined || error === null) return false;
  return !isNonFailureError(error);
}

// The known-user hook must run for (a) genuine credential failures — to count
// them — AND (b) successful logins, so it can still enforce an already-active
// lockout window. It must NOT run for the benign 'no-2fa-code' step.
function shouldProcessKnownUser(loginInfo) {
  if (!loginInfo || loginInfo.type !== 'password') return false;
  if (loginInfo.user === undefined || loginInfo.user === null) return false;
  if (isNonFailureError(loginInfo.error)) return false;
  return true;
}

// The unknown-user hook counts failed password logins for which NO user matched,
// keyed by client address. Only failures (an error is present) are counted;
// there is no success path to guard here.
function shouldProcessUnknownUser(loginInfo) {
  if (!loginInfo || loginInfo.type !== 'password') return false;
  if (loginInfo.user !== undefined && loginInfo.user !== null) return false;
  return isCountableFailure(loginInfo.error);
}

module.exports = {
  NON_FAILURE_ERROR_CODES,
  isNonFailureError,
  isCountableFailure,
  shouldProcessKnownUser,
  shouldProcessUnknownUser,
};
