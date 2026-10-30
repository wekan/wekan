'use strict';

// REQUIRE_2FA (Admin Panel / People / Login): make two-factor authentication
// compulsory - 'off' (the default), 'admins' or 'all'.
//
// WHO IT APPLIES TO. accounts-2fa asks for the code on a PASSWORD login only, so
// the requirement covers the accounts that sign in with a WeKan password:
// authenticationMethod 'password' and a stored password. An LDAP, OAuth2,
// SAML, CAS or Sandstorm account signs in through its identity provider, whose
// own second factor is where that belongs; making it enrol here would protect
// nothing, because its login never asks.
//
// HOW IT IS ENFORCED (server/requireTwoFactor.js). Signing in is still allowed
// - the account has to sign in to enrol - but until it has 2FA:
//   - every Meteor method but signing in and out and the 2FA methods is refused,
//     and every publication but the login page's is empty;
//   - HTTP routes do not accept its login (server/lib/activeUser.js), and the
//     REST API does not give it a token;
//   - the browser shows only the 2FA set-up, over everything else.
// Once required, it cannot switch 2FA off again.
//
// Pure: no Meteor. Shared by the server, the client and plain-Node tests.

const MODES = ['off', 'admins', 'all'];

function requireTwoFactorMode(get) {
  const value = String(get('REQUIRE_2FA') || '').trim().toLowerCase();
  return MODES.includes(value) ? value : 'off';
}

function signsInWithPassword(user) {
  return !!(user && (user.authenticationMethod || 'password') === 'password'
    && user.services && user.services.password);
}

// Does the requirement cover this account?
function twoFactorApplies(user, mode) {
  if (!user || mode === 'off' || !MODES.includes(mode)) return false;
  if (!signsInWithPassword(user)) return false;
  return mode === 'all' || (mode === 'admins' && user.isAdmin === true);
}

// The same test accounts-2fa makes (Accounts._check2faEnabled).
function hasTwoFactor(user) {
  const tfa = user && user.services && user.services.twoFactorAuthentication;
  return !!(tfa && tfa.secret && tfa.type === 'otp');
}

function missingTwoFactor(user, mode) {
  return twoFactorApplies(user, mode) && !hasTwoFactor(user);
}

// Methods an account without its required 2FA may still call: signing in and
// out, enrolling, and what the sign-in page asks before anybody is signed in.
const ALLOWED_METHODS = new Set([
  'login', 'logout', 'logoutOtherClients', 'getNewToken', 'removeOtherTokens',
  'generate2faActivationQrCode', 'enableUser2fa', 'has2faEnabled',
  'getTwoFactorRequirement', 'getPasswordPolicy', 'passwordPwnedRange',
  'isPasswordLoginEnabled', 'isDisableRegistration', 'isDisableForgotPassword',
  'isOidcRedirectionEnabled', 'getOauthLogoutUrl', 'getOauthServerUrl', 'getOauthDashboardUrl',
  'getDefaultAuthenticationMethod', 'getAuthenticationsEnabled',
]);

// Publications the sign-in page already shows to nobody in particular.
const ALLOWED_PUBLICATIONS = new Set(['setting', 'user-authenticationMethod']);

module.exports = {
  MODES,
  requireTwoFactorMode,
  twoFactorApplies,
  hasTwoFactor,
  missingTwoFactor,
  signsInWithPassword,
  ALLOWED_METHODS,
  ALLOWED_PUBLICATIONS,
};
