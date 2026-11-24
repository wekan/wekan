'use strict';

// REGISTRATION_MINIMUM_AGE (docs/Compliance/README.md P3, row 1.9; [GDPR] Art.
// 8(1) 16, or 13 to 16 where a Member State lowers it; [COPPA] § 312.2 13):
// the sign-up form asks "I am at least N years old", and the server refuses a
// password sign-up that did not confirm it. Off unless set. Accounts an
// administrator creates, and those an identity provider (LDAP, OAuth2, OIDC,
// SAML, CAS, Sandstorm) brings, are not asked: the organisation behind them
// already knows its people. WeKan stores no birth date - only that the box
// was ticked, which it does not keep either.
//
// Pure: tests/registrationAge.test.cjs.

const MAX_AGE = 21;

function minimumAge(env = {}) {
  const n = Number(String((env && env.REGISTRATION_MINIMUM_AGE) || '').trim());
  return Number.isInteger(n) && n > 0 && n <= MAX_AGE ? n : 0;
}

// Is this a sign-up the rule asks? A password registration through the form.
function signupAsked(user, adminCreated) {
  return !adminCreated && !!(user && user.services && user.services.password);
}

// The refusal, or null.
function ageRefusal({ age, user, adminCreated, confirmed }) {
  if (!age || !signupAsked(user, adminCreated) || confirmed === true) return null;
  return 'error-minimum-age';
}

module.exports = { MAX_AGE, minimumAge, signupAsked, ageRefusal };
