'use strict';

// What Admin Panel / People / LDAP / Test connection has to do before it may
// answer "success" (maintainer decision of 2026-10-08).
//
// ldapts opens the socket lazily, on the first operation. With a service
// account (LDAP_AUTHENTIFICATION) that operation is the bind, so the bind
// proves the directory answered. Without one there was no operation at all,
// and the test reported success for a host that does not even resolve. Now a
// test without credentials does an anonymous base-scope search of LDAP_BASEDN:
// the directory has to answer it, or its actual error is shown.

// 'bind' with a service account, 'anonymous-search' without one, or an
// { error } when neither can prove anything.
function connectionProbe(options) {
  if (options && options.Authentication === true) return { kind: 'bind' };
  const baseDN = typeof (options && options.BaseDN) === 'string' ? options.BaseDN.trim() : '';
  if (baseDN === '') return { error: 'LDAP_BASEDN is not set, so there is nothing to search without a service account' };
  return { kind: 'anonymous-search', baseDN };
}

// The search that proves an anonymous connection: the base entry only, one
// result at most, no attributes - it reads nothing about anybody.
function anonymousSearchOptions() {
  return { scope: 'base', filter: '(objectClass=*)', attributes: ['1.1'], sizeLimit: 1 };
}

module.exports = { connectionProbe, anonymousSearchOptions };
