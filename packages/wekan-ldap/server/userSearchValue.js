'use strict';

// #6771: the value a user search puts after `uid=` (LDAP_USER_SEARCH_FIELD).
//
// A login name is escaped (RFC 4515), so a user typing `*` or `)(` cannot
// widen or break the filter. The background import, though, asks for EVERY
// user, and it did that with the string '*' - which the escaping added for
// logins turned into `\2a`, a literal asterisk no directory entry has. Every
// import from then on found "Search result count 0" and imported nobody.
//
// ALL_LDAP_USERS is the one way to get the wildcard. It is a Symbol, and a
// login request carries strings, so no username anybody types can reach it:
// the string '*' stays `\2a`.
//
// Pure: tests/ldapImportAllUsers.test.cjs.

const ALL_LDAP_USERS = Symbol('all LDAP users');

function userSearchValue(username, escapeFilterValue) {
  return username === ALL_LDAP_USERS ? '*' : escapeFilterValue(username);
}

// For log lines: a Symbol in a template literal throws.
function describeUserSearch(username) {
  return username === ALL_LDAP_USERS ? '*' : username;
}

module.exports = { ALL_LDAP_USERS, userSearchValue, describeUserSearch };
