'use strict';

// Pure, isomorphic helpers for resolving the default login authentication method
// (one of: password, ldap, oauth2, cas, saml). Extracted from the settings model
// so #5879 is unit-testable without Meteor.
//
// #5879 had two halves:
//   1. `DEFAULT_AUTHENTICATION_METHOD` env var was ignored — the stored setting
//      was only ever seeded as 'password' and the env value was never applied,
//      so operators setting it (Kubernetes/Helm) saw no effect.
//   2. Admin Panel > Layout > Save appeared to hang / not persist: when the
//      authentication-method <select> had not populated yet (its options come
//      from an async Meteor.call), its value was '' / null, and saving that over
//      the required `defaultAuthenticationMethod` string silently failed
//      validation — the save looked stuck and nothing changed.
// Both are addressed by never letting an empty value win over a real one.

// Normalize a raw value (env var, <select> value, DB field) to a clean method
// string, or undefined when it carries no usable value. Method keys are
// lowercase (getAuthenticationsEnabled: ldap/oauth2/cas, plus password), so we
// lowercase here too, making DEFAULT_AUTHENTICATION_METHOD=LDAP work.
function normalizeAuthenticationMethod(value) {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase();
  return v.length > 0 ? v : undefined;
}

// First usable method among the candidates, else 'password'. Used to (a) apply
// the DEFAULT_AUTHENTICATION_METHOD env authoritatively at startup and (b) stop
// the Admin Panel Layout save from overwriting the stored method with an empty
// value when the <select> is not populated yet.
function resolveDefaultAuthenticationMethod(preferred, current, fallback = 'password') {
  return (
    normalizeAuthenticationMethod(preferred) ||
    normalizeAuthenticationMethod(current) ||
    normalizeAuthenticationMethod(fallback) ||
    'password'
  );
}

// Once, on upgrade to the Admin Panel override of DEFAULT_AUTHENTICATION_METHOD:
// the method the old Login dropdown stored becomes the override when it was
// the administrator's choice - not 'password' (the seeded default), and not
// with the environment variable set (the start then overwrote the dropdown, so
// the stored value was the variable's). Returns the method to keep as the
// override, or undefined.
function migratedDefaultAuthenticationMethod({ stored, override, environment }) {
  const method = normalizeAuthenticationMethod(stored);
  if (!method || method === 'password') return undefined;
  if (normalizeAuthenticationMethod(override)) return undefined;
  if (normalizeAuthenticationMethod(environment)) return undefined;
  return method;
}

export {
  normalizeAuthenticationMethod,
  resolveDefaultAuthenticationMethod,
  migratedDefaultAuthenticationMethod,
};
