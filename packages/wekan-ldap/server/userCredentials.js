'use strict';

// A successful LDAP bind with an empty password can mean anonymous access,
// not proof of identity (RFC 4513 section 5.1.2). Do not apply this check to
// service-account or intentional anonymous directory searches.
function requireUserCredentials(identifier, password) {
  if (typeof identifier === 'string' && identifier.length > 0 &&
      typeof password === 'string' && password.length > 0) return;
  try {
    if (typeof global.__wekanTripCanary === 'function') {
      global.__wekanTripCanary('ldap.invalid-credentials');
    }
  } catch (e) { /* logging must never break the guard */ }
  throw new Error('LDAP user credentials must be non-empty strings');
}

function escapeUserDnValue(value) {
  return value.replace(/[, +"\\<>;=\0#]/g, (character, offset) => {
    if (character === ' ' && offset !== 0 && offset !== value.length - 1) return character;
    if (character === '#' && offset !== 0) return character;
    return character === '\0' ? '\\00' : `\\${character}`;
  });
}

module.exports = { requireUserCredentials, escapeUserDnValue };
