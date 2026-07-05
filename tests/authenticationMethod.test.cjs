'use strict';

// Plain-Node unit test (no Meteor) for the default authentication-method helpers.
// Run: node tests/authenticationMethod.test.cjs
//
// Regression guard for #5879:
//   1. DEFAULT_AUTHENTICATION_METHOD env var was ignored (settings only ever
//      seeded 'password'); it must now win when set.
//   2. Admin Panel > Layout > Save appeared to hang / not persist: the auth
//      method <select> can be empty ('' / null) before its async options load,
//      and saving that empty value over the required defaultAuthenticationMethod
//      string silently failed. An empty value must never overwrite a real one.

const assert = require('assert');
const {
  normalizeAuthenticationMethod,
  resolveDefaultAuthenticationMethod,
} = require('../models/lib/authenticationMethod');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- normalizeAuthenticationMethod ------------------------------------------
test('normalize trims and lowercases so DEFAULT_AUTHENTICATION_METHOD=LDAP works', () => {
  assert.strictEqual(normalizeAuthenticationMethod('LDAP'), 'ldap');
  assert.strictEqual(normalizeAuthenticationMethod('  Ldap  '), 'ldap');
  assert.strictEqual(normalizeAuthenticationMethod('oauth2'), 'oauth2');
});

test('normalize returns undefined for empty/non-string values', () => {
  assert.strictEqual(normalizeAuthenticationMethod(''), undefined);
  assert.strictEqual(normalizeAuthenticationMethod('   '), undefined);
  assert.strictEqual(normalizeAuthenticationMethod(null), undefined);
  assert.strictEqual(normalizeAuthenticationMethod(undefined), undefined);
  assert.strictEqual(normalizeAuthenticationMethod(5), undefined);
});

// --- POSITIVE: the env var takes effect -------------------------------------
test('POSITIVE: DEFAULT_AUTHENTICATION_METHOD env wins over the stored value', () => {
  // Startup override: env 'ldap' beats the seeded 'password'.
  assert.strictEqual(resolveDefaultAuthenticationMethod('ldap', 'password'), 'ldap');
  // Case-insensitive.
  assert.strictEqual(resolveDefaultAuthenticationMethod('LDAP', 'password'), 'ldap');
});

test('POSITIVE: seeding with no env falls back to password', () => {
  assert.strictEqual(resolveDefaultAuthenticationMethod(undefined, undefined), 'password');
  assert.strictEqual(resolveDefaultAuthenticationMethod('', undefined), 'password');
});

test('POSITIVE: with no env, the already-stored method is preserved', () => {
  // Admin previously chose ldap in the panel, no env set -> keep ldap.
  assert.strictEqual(resolveDefaultAuthenticationMethod(undefined, 'ldap'), 'ldap');
});

// --- NEGATIVE: an empty save must not wipe the stored method (the "hang") ----
test('NEGATIVE: an empty <select> value does NOT overwrite the stored method', () => {
  // The layout-save case: select not populated yet -> '' / null, stored is ldap.
  assert.strictEqual(resolveDefaultAuthenticationMethod('', 'ldap'), 'ldap');
  assert.strictEqual(resolveDefaultAuthenticationMethod(null, 'ldap'), 'ldap');
  assert.strictEqual(resolveDefaultAuthenticationMethod(undefined, 'ldap'), 'ldap');
});

test('NEGATIVE: never resolves to an empty/undefined string (required schema field)', () => {
  // Even with everything empty, the result is always a usable required string.
  const r = resolveDefaultAuthenticationMethod('', '');
  assert.strictEqual(r, 'password');
  assert.ok(typeof r === 'string' && r.length > 0);
});

test('NEGATIVE: a real selected value still overrides the stored one', () => {
  // Sanity: a genuine change (ldap -> oauth2) is not blocked by the guard.
  assert.strictEqual(resolveDefaultAuthenticationMethod('oauth2', 'ldap'), 'oauth2');
});

console.log(`\n${passed} passing`);
