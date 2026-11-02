'use strict';

// A WeKan account found by USERNAME or E-MAIL at an LDAP login (or merged by
// the import) may already belong to another directory entry: its
// services.ldap.id is that entry's unique identifier (objectGUID, entryUUID,
// ...). That happens when a directory reuses a login name - someone leaves,
// their account is deleted, and a new colleague later gets the same
// sAMAccountName - or when two entries share an e-mail address. The login
// matched the account by name and logged the NEW person into the OLD person's
// account, with all of their boards.
//
// The account belongs to a different person when it records an identifier of
// the SAME attribute with a DIFFERENT value. These cannot be told apart this
// way, so they keep working as before:
// - an account without an identifier (made before LDAP, or a local account
//   being merged);
// - an identifier of another attribute: LDAP_UNIQUE_IDENTIFIER_FIELD was
//   changed, for example from the login name to objectGUID. The login then
//   records the new identifier, and the account is protected from then on;
// - an identifier WITHOUT its attribute (accounts from before #4654 stored only
//   the value). It may be the login name's value while the login now offers an
//   objectGUID; refusing it would lock every such user out after that change.
//   The login records the attribute, so the next login is compared.
//
// CommonJS so the plain-Node test can require it.
function boundToAnotherEntry(user, uniqueId) {
  const bound = user && user.services && user.services.ldap;
  if (!bound || !bound.id || !bound.idAttribute || !uniqueId || !uniqueId.value || !uniqueId.attribute) return false;
  if (String(bound.idAttribute).toLowerCase() !== String(uniqueId.attribute).toLowerCase()) return false;
  return String(bound.id) !== String(uniqueId.value);
}

module.exports = { boundToAnotherEntry };
