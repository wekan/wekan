'use strict';

// The login settings that turn something OFF, decided on the server
// (docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
//
// PASSWORD_LOGIN_ENABLED=false (Admin Panel / People / Login, or the
// environment variable) used to hide the password form and nothing else: a
// DDP `login` with { user, password } or a POST /users/login still signed in
// with a local password. Now every password-service sign-in is refused on the
// server:
//
//   * DDP: Accounts.validateLoginAttempt for type 'password' - the `login`
//     method, and also 'resetPassword', 'verifyEmail' and 'createUser', which
//     Meteor signs in through the password service too;
//   * REST: POST /users/login (server/apiAuthRoutes.js), before any user is
//     looked up, so the refusal says nothing about an account.
//
// LDAP is not a password login, even when it arrives through the password
// service. packages/wekan-ldap/server/loginHandler.js falls back to the local
// password service when LDAP_LOGIN_FALLBACK=true, and that fallback reaches
// validateLoginAttempt with type 'password'; its login request still carries
// `ldap: true`. That fallback is the operator's explicit LDAP decision, so it
// keeps working - but only while LDAP itself is enabled: with LDAP_ENABLE off
// the LDAP handler always falls back, which is then a plain password login.
//
// DISABLE_FORGOT_PASSWORD (Admin Panel / People / Registration) used to hide
// the "Forgot your password?" link; Meteor's `forgotPassword` method still
// e-mailed a reset link. It is refused now, and so is it while password login
// is off, because the reset link would only lead to a refused sign-in.
//
// Pure CommonJS, no Meteor: tests/passwordLoginPolicy.test.cjs.

const isTrue = value => value === 'true' || value === true;

// Default on; only the exact value false turns it off (as the
// isPasswordLoginEnabled method has always answered).
function passwordLoginEnabled(env) {
  const value = env && env.PASSWORD_LOGIN_ENABLED;
  return !(value === 'false' || value === false);
}

// The LDAP handler's own fallback to the local password, which the operator
// turned on together with LDAP.
function isLdapFallback(loginRequest, env) {
  return Boolean(loginRequest && typeof loginRequest === 'object' && loginRequest.ldap === true)
    && isTrue(env && env.LDAP_ENABLE) && isTrue(env && env.LDAP_LOGIN_FALLBACK);
}

// A DDP login attempt (Meteor's validateLoginAttempt): null when allowed, or
// the error code. `loginRequest` is the attempt's methodArguments[0].
function passwordLoginRefusal({ type, loginRequest, env } = {}) {
  if (type !== 'password') return null;
  if (passwordLoginEnabled(env)) return null;
  if (isLdapFallback(loginRequest, env)) return null;
  return 'password-login-disabled';
}

// Meteor's `login` method, before any account is looked up: a request in the
// password service's own shape ({ user, password }) while password login is
// off. Refused there rather than only in validateLoginAttempt, because a
// later hook of that chain (the lockout's "User not found" / "Incorrect
// password") would overwrite the refusal for a wrong password and leave it
// for a right one - answering, while password login is off, whether a
// password is right. An LDAP request ({ ldap: true, ldapPass }) has no
// `password` and is never refused here.
function loginRequestRefusal(loginRequest, env) {
  if (!loginRequest || typeof loginRequest !== 'object') return null;
  if (!('password' in loginRequest) || !('user' in loginRequest)) return null;
  return passwordLoginEnabled(env) ? null : 'password-login-disabled';
}

// POST /users/login: which way a username/email + password request goes.
//   'refuse'  - password login is off and the request cannot be LDAP
//   'ldap'    - password login is off, LDAP is on and a username was given:
//               only the directory may answer (its own fallback included)
//   null      - password login is on: the route decides as it always did
function restPasswordLoginRoute({ env, usernameProvided } = {}) {
  if (passwordLoginEnabled(env)) return null;
  if (isTrue(env && env.LDAP_ENABLE) && usernameProvided) return 'ldap';
  return 'refuse';
}

// Meteor's forgotPassword method: null when allowed, or the error code.
function forgotPasswordRefusal({ setting, env } = {}) {
  if (setting && setting.disableForgotPassword === true) return 'forgot-password-disabled';
  if (!passwordLoginEnabled(env)) return 'password-login-disabled';
  return null;
}

const REFUSAL_MESSAGES = Object.freeze({
  'password-login-disabled': 'Password login is disabled',
  'forgot-password-disabled': 'Forgot password is disabled',
});

module.exports = {
  passwordLoginEnabled,
  isLdapFallback,
  passwordLoginRefusal,
  loginRequestRefusal,
  restPasswordLoginRoute,
  forgotPasswordRefusal,
  REFUSAL_MESSAGES,
};
