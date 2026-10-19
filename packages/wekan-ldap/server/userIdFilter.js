'use strict';

// #4654: build the LDAP search filter used to re-find an existing user by the
// stored services.ldap.id during background sync
// (LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED).
//
// The stored id is produced by getLdapUserUniqueID() in sync.js, which takes
// the first non-empty attribute from LDAP_UNIQUE_IDENTIFIER_FIELD and falls
// back to LDAP_USER_SEARCH_FIELD. The lookup therefore has to consider both
// settings too. Previously getUserById() used only LDAP_UNIQUE_IDENTIFIER_FIELD:
// when that variable was unset it crashed (undefined.split), aborting the whole
// sync run, and when it was set but empty it produced the invalid filter
// "(|(=value))" seen in the issue logs — either way existing users were never
// updated after the first import ("Can't sync user").

// Split a comma-separated attribute list setting into non-empty names.
// Mirrors the whitespace handling of getLdapUserUniqueID()/getBufferAttributes().
function splitFieldSetting(value) {
  if (typeof value !== 'string' || value === '') {
    return [];
  }
  return value.replace(/\s/g, '').split(',').filter(Boolean);
}

// attribute: the stored services.ldap.idAttribute when known (searched as-is);
// escapedValue: the id value already escaped for use inside an LDAP filter;
// uniqueIdentifierFieldSetting / userSearchFieldSetting: the raw settings values.
// Returns the filter string, or null when no usable attribute is configured.
//
// userSearchFilter (optional): LDAP_USER_SEARCH_FILTER, already normalised to a
// parenthesised clause (or empty). Login searches with it, so an account it
// excludes - a disabled Active Directory account, with
// (!(userAccountControl:1.2.840.113556.1.4.803:=2)) - cannot log in. Background
// sync searched without it, so such an account was still "found": it was never
// disabled by LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS, and a disable made
// by hand was even undone on the next run. With the filter ANDed in, an account
// the directory no longer lets log in counts as gone, as it does at login.
function buildUserIdFilter(attribute, escapedValue, uniqueIdentifierFieldSetting, userSearchFieldSetting, userSearchFilter) {
  const idFilter = buildIdOnlyFilter(attribute, escapedValue, uniqueIdentifierFieldSetting, userSearchFieldSetting);
  if (!idFilter) return null;
  const clause = typeof userSearchFilter === 'string' ? userSearchFilter.trim() : '';
  return clause ? `(&${clause}${idFilter})` : idFilter;
}

function buildIdOnlyFilter(attribute, escapedValue, uniqueIdentifierFieldSetting, userSearchFieldSetting) {
  if (attribute) {
    return `(${attribute}=${escapedValue})`;
  }

  const fields = splitFieldSetting(uniqueIdentifierFieldSetting)
    .concat(splitFieldSetting(userSearchFieldSetting));
  const uniqueFields = [...new Set(fields)];

  if (uniqueFields.length === 0) {
    return null;
  }

  const filters = uniqueFields.map((field) => `(${field}=${escapedValue})`);
  return filters.length === 1 ? filters[0] : `(|${filters.join('')})`;
}

module.exports = {
  splitFieldSetting,
  buildUserIdFilter,
};
