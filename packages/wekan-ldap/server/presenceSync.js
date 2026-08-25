'use strict';

// Decide the only active-status mutation LDAP background sync may make.
// Lookup/configuration errors never reach this helper: getUserById throws for
// those, aborting the run. Therefore ldapUserFound=false means a successful
// directory search returned zero entries, not merely that lookup was unclear.
function ldapPresenceUpdate({
  ldapUserFound,
  disableNonexistentUsers,
  loginDisabled,
} = {}) {
  if (!disableNonexistentUsers) return null;

  if (ldapUserFound && loginDisabled === true) {
    return { loginDisabled: false };
  }

  if (!ldapUserFound && loginDisabled !== true) {
    return { loginDisabled: true };
  }

  return null;
}

module.exports = { ldapPresenceUpdate };
