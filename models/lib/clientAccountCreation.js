'use strict';
// SignupBleed, DDP sibling (2026-10-02). Accounts.onCreateUser trusts two
// options as server-only signals: `from: 'admin'` (an admin or the REST API
// creating the account - it skips the registration checks) and `ldap: true`
// (the LDAP package creating an account for a directory user - allowed while
// registration is disabled). Meteor's `createUser` DDP method passes the
// CLIENT's options object to that hook unchanged, so with "Disable
// registration" on, anyone could still sign up by adding either option.
//
// The server's own callers (the admin method, POST /api/users, the LDAP
// package) call Accounts.createUserAsync directly and keep them. A client's
// createUser call never may. Pure: tests/signupBleedDdp.test.cjs.
const SERVER_ONLY_CREATION_OPTIONS = ['from', 'ldap'];

// The options a client may pass, and which server-only ones it tried to.
function clientCreationOptions(options) {
  if (!options || typeof options !== 'object') return { options, refused: [] };
  const refused = SERVER_ONLY_CREATION_OPTIONS.filter(key => Object.prototype.hasOwnProperty.call(options, key));
  if (!refused.length) return { options, refused };
  const clean = { ...options };
  for (const key of refused) delete clean[key];
  return { options: clean, refused };
}

module.exports = { SERVER_ONLY_CREATION_OPTIONS, clientCreationOptions };
