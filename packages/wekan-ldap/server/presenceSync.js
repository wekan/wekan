'use strict';

// Decide the only active-status mutation LDAP background sync may make.
// Lookup/configuration errors never reach this helper: getUserById throws for
// those, aborting the run. Therefore ldapUserFound=false means a successful
// directory search returned zero entries, not merely that lookup was unclear.
//
// loginDisabledReason (models/lib/inactiveUsers.js): an account disabled for
// inactivity (USERS_DISABLE_INACTIVE_AFTER_DAYS) is still in the directory, so
// without this it would be re-enabled by the very next sync. Only an admin
// brings it back. A disable made here is marked 'ldap'.
function ldapPresenceUpdate({
  ldapUserFound,
  disableNonexistentUsers,
  loginDisabled,
  loginDisabledReason,
} = {}) {
  if (!disableNonexistentUsers) return null;

  if (ldapUserFound && loginDisabled === true) {
    if (loginDisabledReason === 'inactive') return null;
    return { loginDisabled: false };
  }

  if (!ldapUserFound && loginDisabled !== true) {
    return { loginDisabled: true, loginDisabledReason: 'ldap' };
  }

  return null;
}

module.exports = { ldapPresenceUpdate };
