'use strict';

// #6467 / #6469: guarantee that an LDAP connection is ALWAYS released.
//
// Every LDAP login attempt (loginHandler.js) and every background sync run
// (sync.js) creates a fresh `new LDAP()` and calls `connect()`. The old code
// never called `disconnect()` on any path, so each attempt leaked a socket to
// the directory server. Under normal traffic this grew without bound until the
// LDAP/AD server hit its per-client connection limit and started refusing
// connections ("too many open connections"), which took the directory server
// down and, with it, every WeKan login — matching the reported symptom of
// WeKan "dying really quickly" and killing the OpenLDAP server, and slow /
// failing logins ("Must be logged in").
//
// runWithLdapDisconnect runs `fn` and unbinds the connection in a `finally`, so
// the socket is closed on EVERY exit path: normal return, thrown error, or an
// LDAP-login `Meteor.Error`. The disconnect is best-effort and never masks the
// original result or error: `ldap.disconnect()` already swallows and logs its
// own errors, and this wrapper additionally tolerates a missing/!function
// `disconnect` (e.g. a partially constructed object in a test) so cleanup can
// never turn a successful login into a failure.
async function runWithLdapDisconnect(ldap, fn) {
  try {
    return await fn();
  } finally {
    if (ldap && typeof ldap.disconnect === 'function') {
      try {
        await ldap.disconnect();
      } catch (error) {
        // ldap.disconnect() logs internally; swallow here so releasing the
        // connection can never change the login/sync outcome.
      }
    }
  }
}

module.exports = { runWithLdapDisconnect };
