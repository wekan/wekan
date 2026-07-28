// ============================================================================
// Does this user's LDAP group membership make them a WeKan admin?
//
// #6540: with LDAP_SYNC_ADMIN_GROUPS set to one group, EVERY user that logged in
// became an administrator. Two things did that, and both are answered here.
//
//  1. The names were compared exactly, and configured as a bare `split(',')`:
//     "ti, admins" produced " admins" with a leading space and matched nothing,
//     while an unset value produced [''] - one empty string - which matched any
//     group whose name was missing from the entry (an attribute the server does
//     not return reads as `undefined`, and a directory that returns none at all
//     gives ''). Names are trimmed, empties dropped, and an EMPTY configured
//     list can never grant admin.
//
//  2. Directory group names are case-insensitive (Active Directory certainly is),
//     so "TI" and "ti" are the same group; comparing them exactly denied admin to
//     the people who should have it, which is the other half of the same report.
//
// A group name from LDAP may also be multi-valued (an array) or absent, so the
// values are flattened and anything that is not a non-empty string is dropped
// rather than compared.
// ============================================================================

// Every configured admin group, trimmed, lower-cased, without empties.
function adminGroupNames(setting) {
  if (typeof setting !== 'string') return [];

  return setting
    .split(',')
    .map(name => String(name).trim().toLowerCase())
    .filter(name => name !== '');
}

// The user's group names, flattened (a multi-valued attribute arrives as an
// array) and reduced to comparable strings.
function userGroupNames(groups) {
  if (!Array.isArray(groups)) return [];

  return groups
    .flat()
    .filter(name => typeof name === 'string')
    .map(name => name.trim().toLowerCase())
    .filter(name => name !== '');
}

// True when the user is in at least one configured admin group.
//
// NEVER true for an empty configured list: "no admin groups are configured" must
// mean "nobody is made an admin by this", not "everybody is".
function isAdminByGroups(userGroups, setting) {
  const targets = adminGroupNames(setting);
  if (targets.length === 0) return false;

  const mine = userGroupNames(userGroups);
  return mine.some(name => targets.includes(name));
}

export { adminGroupNames, userGroupNames, isAdminByGroups };
