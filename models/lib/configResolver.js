// Admin Panel env-var-override resolution (maintainer request: "Add all settings
// from environment variables to Admin Panel where appropriate ... as possibility
// to override"). Pure, dependency-free helpers so they can be unit-tested without
// Meteor/Mongo and reused by every env-var-backed setting (LDAP first, extensible
// to OAuth2/SAML/CAS).
//
// Precedence, for an ordinary (non-secret) setting:
//   1. an explicitly-set, non-empty Admin Panel value wins;
//   2. otherwise the environment variable's value, if set;
//   3. otherwise undefined (caller's own default applies).
// The `source` tag ('admin' | 'env' | 'default') is what lets the Admin Panel UI
// clearly show which one is actually in effect - the maintainer's explicit
// requirement ("clearly visible, is in use environment variable or admin panel
// setting").
//
// SECURITY: this module resolves ordinary values. For a password/secret-shaped
// setting, use hasConfigValue() below instead - it never returns the secret
// itself, only whether one is configured and where it came from. Nothing in this
// file reads process.env for a *_PASSWORD/*_SECRET-shaped name and hands the
// value back to a caller that publishes to the client; callers are responsible
// for not doing that with resolveConfigValue() either, but the secret-safe
// helper exists precisely so a caller never has to.

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Resolve a single configuration value between an Admin Panel override and an
 * environment variable. `readEnv` defaults to reading process.env directly but
 * is injectable for tests and for callers that already have the value.
 *
 * @param {string} envVarName - e.g. 'LDAP_HOST'
 * @param {*} adminValue - the value currently stored in the Admin Panel setting
 * @param {object} [options]
 * @param {function(string): (string|undefined)} [options.readEnv]
 * @returns {{ value: *, source: 'admin'|'env'|'default' }}
 */
function resolveConfigValue(envVarName, adminValue, options = {}) {
  const readEnv = options.readEnv || (name => process.env[name]);

  if (!isEmpty(adminValue)) {
    return { value: adminValue, source: 'admin' };
  }

  const envValue = readEnv(envVarName);
  if (!isEmpty(envValue)) {
    return { value: envValue, source: 'env' };
  }

  return { value: undefined, source: 'default' };
}

/**
 * The secret-safe counterpart of resolveConfigValue(): tells a caller WHETHER a
 * password/secret is configured and WHERE it comes from, but never returns the
 * secret's value. Use this - never resolveConfigValue() - for anything that
 * ends up in code reachable by a client-facing method/publication.
 *
 * @param {string} envVarName
 * @param {*} adminValue - the raw admin-panel secret value (e.g. Settings doc's
 *   ldap.bindPassword), NEVER pass this through to a client-visible result.
 * @param {object} [options]
 * @param {function(string): (string|undefined)} [options.readEnv]
 * @returns {{ hasValue: boolean, source: 'admin'|'env'|'default' }}
 */
function hasConfigValue(envVarName, adminValue, options = {}) {
  const readEnv = options.readEnv || (name => process.env[name]);

  if (!isEmpty(adminValue)) {
    return { hasValue: true, source: 'admin' };
  }
  const envValue = readEnv(envVarName);
  if (!isEmpty(envValue)) {
    return { hasValue: true, source: 'env' };
  }
  return { hasValue: false, source: 'default' };
}

/**
 * Redact credentials embedded inline in a composite/connection-string-shaped
 * value (e.g. "ldap://user:secret@host:389", "smtp://user:secret@host:25")
 * before it is ever sent to a browser for display/debugging purposes. Applied
 * server-side, always - a value must be redacted BEFORE it reaches any
 * client-visible method result or publication, never after (masking client-side
 * still transmits the secret first).
 *
 * @param {string} value
 * @returns {string}
 */
function redactCredentialsInUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  return value.replace(
    /(\b[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s/:@]+):([^\s@]+)@/g,
    '$1:***@',
  );
}

module.exports = {
  resolveConfigValue,
  hasConfigValue,
  redactCredentialsInUrl,
};
