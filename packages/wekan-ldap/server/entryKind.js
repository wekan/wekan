'use strict';

const GROUP_OBJECT_CLASSES = new Set([
  'group',
  'groupofnames',
  'groupofuniquenames',
  'posixgroup',
]);

function objectClasses(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const key = Object.keys(entry).find(
    candidate => candidate.toLowerCase() === 'objectclass',
  );
  if (!key) return [];
  const values = Array.isArray(entry[key]) ? entry[key] : [entry[key]];
  return values
    .map(value =>
      Buffer.isBuffer(value) ? value.toString('utf8') : String(value),
    )
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

// LDAP directories use many user schemas, so absence of a familiar person
// class is not grounds to reject an entry. Known group-only classes are: they
// are the concrete false positives reported in #4875 and cannot authenticate
// as people. This remains case-insensitive and works with string, Buffer or
// array values returned by ldapts.
function isKnownLdapGroup(entry) {
  return objectClasses(entry).some(value => GROUP_OBJECT_CLASSES.has(value));
}

module.exports = { objectClasses, isKnownLdapGroup };
