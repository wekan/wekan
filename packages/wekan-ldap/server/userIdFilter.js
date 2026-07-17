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
function buildUserIdFilter(attribute, escapedValue, uniqueIdentifierFieldSetting, userSearchFieldSetting) {
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
