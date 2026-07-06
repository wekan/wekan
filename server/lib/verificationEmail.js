// verificationEmail.js
//
// Pure, Meteor-free helper hardening the sign-up verification-email send.
// Extracted so it can be unit-tested in plain Node (see
// tests/verificationEmail.test.cjs).
//
// #5672: "Internal Server Error When Signing Up Despite Successful Account
// Creation". useraccounts' ATCreateUserServer method creates the account and
// THEN calls `Accounts.sendVerificationEmail(userId, email)`. When SMTP is not
// configured (no/invalid MAIL_URL / MAIL_FROM, or the mail server is
// unreachable), that send throws AFTER the user row is already inserted, and the
// exception propagates out of the createUser method as an opaque HTTP 500 — so
// the user sees "Internal server error" even though the account was created and
// can sign in.
//
// The verification email is best-effort at sign-up: the account already exists,
// so a mail failure must not fail the registration. Wrap the sender so a send
// failure is logged and swallowed (registration completes and redirects to
// sign-in). An "already verified" error is re-thrown unchanged so the separate
// "resend verification email" flow (ATResendVerificationEmail) can still report
// it.

// True when the error is accounts-password signalling that the address is
// already verified (there is nothing to send), as opposed to a mail-transport
// failure. Kept broad but conservative: only the word "verified" qualifies.
function isAlreadyVerifiedError(error) {
  const message = ((error && (error.reason || error.message)) || '')
    .toString()
    .toLowerCase();
  return message.includes('verified');
}

// Wrap an Accounts.sendVerificationEmail-style sender so a transport failure at
// sign-up is logged via `logWarning` and swallowed (resolves to undefined)
// instead of bubbling up as an HTTP 500. Already-verified errors are re-thrown.
// A non-function `originalSend` is returned unchanged.
function wrapSendVerificationEmail(originalSend, logWarning) {
  if (typeof originalSend !== 'function') {
    return originalSend;
  }
  const warn = typeof logWarning === 'function' ? logWarning : () => {};
  return async function wrappedSendVerificationEmail(...args) {
    try {
      return await originalSend.apply(this, args);
    } catch (error) {
      // Preserve the "resend to an already-verified address" signal.
      if (isAlreadyVerifiedError(error)) {
        throw error;
      }
      warn(
        '[sendVerificationEmail] Could not send the verification email — is ' +
          'SMTP configured (MAIL_URL / MAIL_FROM)? The account was still ' +
          'created and can sign in. ' +
          ((error && (error.message || error.reason)) || error),
      );
      return undefined;
    }
  };
}

module.exports = { isAlreadyVerifiedError, wrapSendVerificationEmail };
