// Pure, dependency-free helper (no Meteor imports) so it can be unit tested
// directly with plain Node. Used by the `Accounts.validateLoginAttempt` hook
// registered in server/authentication.js.
//
// #4419 (Severity:Security): when an instance migrates a user from local
// password login to LDAP (Admin Panel sets `authenticationMethod: 'ldap'`),
// the user's old `services.password` hash is left in place, so the stale —
// possibly weaker — local password KEEPS working alongside the LDAP password.
// The safe fix (per this repo's own triage in CHANGELOG.md "TODO Later") is to
// reject password-service login attempts for such users at validation time
// instead of destructively `$unset`-ing `services.password`.
//
// The decision is deliberately conservative. A password-service login attempt
// is rejected ONLY when ALL of the following hold:
//
//   1. The attempted login service is 'password' (`attempt.type` from
//      Meteor's validateLoginAttempt). All other services — 'ldap', 'oidc',
//      'cas', 'saml', 'resume' (session token resume), … — are never touched,
//      so existing sessions and every non-password login flow keep working.
//   2. The user document has `authenticationMethod === 'ldap'`. Users without
//      the field, or with any other value ('password', 'oauth2', 'cas',
//      'saml', 'imported', …), are never rejected.
//   3. LDAP is actually enabled in this deployment: LDAP_ENABLE=true
//      (same env check as isLdapEnabled() in server/models/settings.js). If
//      LDAP has been turned off — e.g. an instance de-LDAPed or a directory
//      decommissioned — password login must keep working so admins are never
//      locked out.
//   4. LDAP_LOGIN_FALLBACK is NOT enabled. With LDAP_LOGIN_FALLBACK=true the
//      wekan-ldap login handler *intentionally* falls back to the local
//      password service and syncs the LDAP password into
//      `services.password` on every LDAP login (see
//      packages/wekan-ldap/server/loginHandler.js). That fallback surfaces in
//      validateLoginAttempt with type 'password', so rejecting it would break
//      the documented fallback feature.
//   5. The operator has not opted out. Setting
//      LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN=true restores the old behavior
//      (local password login stays valid for LDAP-migrated users), so no
//      deployment can be hard-locked by upgrading WeKan. Document/announce
//      this var wherever LDAP env vars are documented.
//
// The same rule applies to every user — admins are not treated differently.

'use strict';

// Error reason shown to the user when the guard rejects the login.
const LDAP_PASSWORD_LOGIN_DISABLED_REASON =
  'Use LDAP login; local password login is disabled for this account';

// Mirrors the truthiness convention used across server/models/settings.js
// (isLdapEnabled etc.): env vars are the string 'true', but a literal boolean
// true is also accepted.
function envFlagIsTrue(value) {
  return value === 'true' || value === true;
}

/**
 * Decide whether a login attempt must be rejected because the account was
 * migrated to LDAP but still carries a stale local password.
 *
 * @param {Object} params
 * @param {string} params.serviceName - the login service of the attempt
 *   (Meteor's `attempt.type`), e.g. 'password', 'ldap', 'resume', 'oidc'.
 * @param {Object|undefined} params.user - the user document of the attempt
 *   (may be undefined for unknown-user attempts).
 * @param {Object|undefined} params.env - the environment (process.env).
 * @return {boolean} true when the password-service login must be rejected.
 */
function shouldRejectPasswordLogin({ serviceName, user, env } = {}) {
  const environment = env || {};

  // (1) Only the local password service is ever guarded.
  if (serviceName !== 'password') {
    return false;
  }

  // (2) Only users explicitly migrated to LDAP.
  if (!user || user.authenticationMethod !== 'ldap') {
    return false;
  }

  // (3) Only when LDAP is enabled in this deployment; otherwise password
  // login must keep working (never lock admins out of a de-LDAPed instance).
  if (!envFlagIsTrue(environment.LDAP_ENABLE)) {
    return false;
  }

  // (4) LDAP_LOGIN_FALLBACK intentionally logs LDAP users in through the
  // password service; do not break that feature.
  if (envFlagIsTrue(environment.LDAP_LOGIN_FALLBACK)) {
    return false;
  }

  // (5) Operator opt-out: keep the pre-#4419-fix behavior.
  if (envFlagIsTrue(environment.LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN)) {
    return false;
  }

  return true;
}

module.exports = {
  shouldRejectPasswordLogin,
  LDAP_PASSWORD_LOGIN_DISABLED_REASON,
};
