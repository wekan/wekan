// Breached-password check for the forms that set a NEW password - sign-up,
// Change Password, reset and enrolment (models/lib/passwordPolicy.js says why
// it is done in the browser). It captures the submit before useraccounts sees
// it, asks the server for the SHA-1 range of the password - five hex digits,
// never the password - and replays the submit when the password is not in it.
//
// A form that sets a new password is the one with a "password again" or a
// "current password" field; the sign-in form has neither and is left alone.

const { isPwned, breachLookupDigest } = require('../../models/lib/passwordPolicy');

function isNewPasswordForm(form) {
  return !!(form && form.id === 'at-pwd-form' && form.querySelector('#at-field-password')
    && (form.querySelector('#at-field-password_again') || form.querySelector('#at-field-current_password')));
}

// policy() -> { checkPwned } (cached by the caller); range(prefix) -> Promise
// of suffixes or null; subtle is crypto.subtle (absent outside a secure
// context, where the check is skipped); showError(message); replay(form).
function createNewPasswordSubmitHandler({ policy, range, subtle, showError, replay, pwnedMessage }) {
  let replaying = false;
  let pending = false;
  return async function submit(event) {
    const form = event.target;
    if (replaying || !isNewPasswordForm(form) || !policy().checkPwned || !subtle) return;
    const password = form.querySelector('#at-field-password').value;
    if (!password) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pending) return;
    pending = true;
    try {
      let breached = false;
      try {
        const hex = await breachLookupDigest(password, subtle);
        const suffixes = await range(hex.slice(0, 5));
        breached = Array.isArray(suffixes) && isPwned(hex, suffixes);
      } catch (e) {
        // An unreachable service must not stop anybody from setting a password.
        breached = false;
      }
      if (breached) {
        showError(pwnedMessage());
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 0));
      replaying = true;
      try { replay(form); } finally { replaying = false; }
    } finally {
      pending = false;
    }
  };
}

module.exports = { createNewPasswordSubmitHandler, isNewPasswordForm };
