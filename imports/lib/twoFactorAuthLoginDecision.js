// Pure state-machine logic for the sign-in form's second "enter your 6-digit
// code" step, driven by Meteor's official accounts-2fa package
// (https://docs.meteor.com/packages/accounts-2fa.html). WeKan does not
// generate or verify TOTP codes itself - that is accounts-2fa's job, done
// server-side by Accounts._check2faEnabled / Accounts._isTokenValid. This
// module only decides, from the error a normal Meteor.loginWithPassword
// call returned, whether the sign-in form must show the code-entry step,
// and what to tell the user, so a real WeKan-side login attempt does not
// have to be driven through the actual UI to test that decision.
//
// accounts-2fa documents exactly two relevant Meteor.Error codes on the
// `error` field of the callback error (see docs quoted above and
// packages/wekan-accounts-lockout/src/loginFailureDecision.js, which already
// treats 'no-2fa-code' as a non-failure step for lockout purposes):
//   'no-2fa-code'      - password was correct, account has 2FA enabled, no
//                         code was supplied yet -> show the code step.
//   'invalid-2fa-code' - a code was supplied and it did not verify -> stay
//                         on the code step and show an inline error.
// Any other error (wrong password, unknown user, disabled account, ...) is
// an ordinary login failure and must NOT show the 2FA step.

const NEED_CODE = 'no-2fa-code';
const INVALID_CODE = 'invalid-2fa-code';

// Returns one of:
//   'none'        - not a 2FA step; show/keep the normal error handling.
//   'need-code'   - first time around; show the code-entry step, no error yet.
//   'retry-code'  - the code just submitted was wrong; keep the code-entry
//                   step open and show an inline "invalid code" message.
function decideTwoFactorLoginStep(error, state) {
  if (!error || typeof error !== 'object') return 'none';
  // The 2FA step only ever applies to the sign-in form itself.
  if (state !== 'signIn') return 'none';
  if (error.error === NEED_CODE) return 'need-code';
  if (error.error === INVALID_CODE) return 'retry-code';
  return 'none';
}

function isTwoFactorLoginStep(step) {
  return step === 'need-code' || step === 'retry-code';
}

module.exports = {
  NEED_CODE,
  INVALID_CODE,
  decideTwoFactorLoginStep,
  isTwoFactorLoginStep,
};
