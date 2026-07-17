'use strict';

// Plain-Node unit test (no Meteor) for LDAP_ENCRYPTION value normalization.
// Run: node tests/ldapEncryptionSetting.test.cjs
//
// Regression guard for #4158 ("Documentation/configuration of
// LDAP_ENCRYPTION"). Historically only the magic strings 'ssl' (= LDAPS) and
// 'tls' (= STARTTLS) did anything; the DOCUMENTED value 'true' was silently
// ignored (settings_get() JSON-parses it into boolean true, which matched
// neither string), and any typo/unknown value silently meant "no encryption".
//
// normalizeLdapEncryption(value) must:
//   - map 'true'/boolean true -> LDAPS ('tls' mode);
//   - keep the legacy values working with their HISTORICAL meaning
//     ('ssl' -> LDAPS, 'tls' -> STARTTLS) plus a one-line deprecation notice
//     naming the preferred value;
//   - map 'starttls' -> STARTTLS;
//   - map 'false'/''/unset/boolean false -> no encryption, no warning;
//   - map anything else -> no encryption WITH a clear warning listing the
//     accepted values (never silently treat an unknown value as enabled).

const assert = require('assert');
const {
  normalizeLdapEncryption,
} = require('../packages/wekan-ldap/server/encryptionSetting');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- POSITIVE: LDAPS (immediate TLS) -----------------------------------------

test("'true' means LDAPS, no warning", () => {
  const r = normalizeLdapEncryption('true');
  assert.strictEqual(r.mode, 'tls');
  assert.strictEqual(r.warning, undefined);
});

test('boolean true (settings_get JSON-parses the env string) means LDAPS', () => {
  // ldap.js settings_get() turns the env string 'true' into boolean true;
  // this is exactly the value that used to be silently ignored (#4158).
  const r = normalizeLdapEncryption(true);
  assert.strictEqual(r.mode, 'tls');
  assert.strictEqual(r.warning, undefined);
});

test("'TRUE' (any case) means LDAPS", () => {
  assert.strictEqual(normalizeLdapEncryption('TRUE').mode, 'tls');
  assert.strictEqual(normalizeLdapEncryption('True').mode, 'tls');
});

test("legacy 'ssl' still means LDAPS (backwards compatible)", () => {
  const r = normalizeLdapEncryption('ssl');
  assert.strictEqual(r.mode, 'tls');
});

test("legacy 'ssl' logs a deprecation notice naming 'true'", () => {
  const r = normalizeLdapEncryption('ssl');
  assert.ok(typeof r.warning === 'string' && r.warning.length > 0);
  assert.ok(r.warning.includes("'true'"), 'must name the preferred value');
  assert.ok(/deprecat/i.test(r.warning), 'must say it is deprecated');
});

test("legacy 'SSL' (any case) still means LDAPS", () => {
  const r = normalizeLdapEncryption('SSL');
  assert.strictEqual(r.mode, 'tls');
  assert.ok(r.warning, 'still deprecated regardless of case');
});

// --- POSITIVE: STARTTLS ------------------------------------------------------

test("'starttls' means STARTTLS, no warning", () => {
  const r = normalizeLdapEncryption('starttls');
  assert.strictEqual(r.mode, 'starttls');
  assert.strictEqual(r.warning, undefined);
});

test("'StartTLS' (any case) means STARTTLS", () => {
  assert.strictEqual(normalizeLdapEncryption('StartTLS').mode, 'starttls');
  assert.strictEqual(normalizeLdapEncryption('STARTTLS').mode, 'starttls');
});

test("legacy 'tls' still means STARTTLS (its historical behavior)", () => {
  // Backwards compatibility: 'tls' has ALWAYS meant STARTTLS in WeKan.
  // Remapping it to LDAPS would break every existing STARTTLS setup.
  const r = normalizeLdapEncryption('tls');
  assert.strictEqual(r.mode, 'starttls');
});

test("legacy 'tls' logs a deprecation notice naming 'starttls'", () => {
  const r = normalizeLdapEncryption('tls');
  assert.ok(typeof r.warning === 'string' && r.warning.length > 0);
  assert.ok(r.warning.includes("'starttls'"), 'must name the preferred value');
  assert.ok(/deprecat/i.test(r.warning), 'must say it is deprecated');
});

// --- POSITIVE: no encryption -------------------------------------------------

test("'false' means no encryption, no warning", () => {
  const r = normalizeLdapEncryption('false');
  assert.strictEqual(r.mode, 'off');
  assert.strictEqual(r.warning, undefined);
});

test('boolean false (settings_get JSON-parses the env string) means no encryption', () => {
  const r = normalizeLdapEncryption(false);
  assert.strictEqual(r.mode, 'off');
  assert.strictEqual(r.warning, undefined);
});

test('empty string means no encryption, no warning', () => {
  const r = normalizeLdapEncryption('');
  assert.strictEqual(r.mode, 'off');
  assert.strictEqual(r.warning, undefined);
});

test('unset (undefined) means no encryption, no warning', () => {
  const r = normalizeLdapEncryption(undefined);
  assert.strictEqual(r.mode, 'off');
  assert.strictEqual(r.warning, undefined);
});

test('null means no encryption, no warning', () => {
  const r = normalizeLdapEncryption(null);
  assert.strictEqual(r.mode, 'off');
  assert.strictEqual(r.warning, undefined);
});

test('surrounding whitespace is tolerated', () => {
  assert.strictEqual(normalizeLdapEncryption(' true ').mode, 'tls');
  assert.strictEqual(normalizeLdapEncryption(' starttls ').mode, 'starttls');
  assert.strictEqual(normalizeLdapEncryption(' false ').mode, 'off');
});

// --- NEGATIVE: unknown values must warn, never silently enable/disable -------

test('NEGATIVE: unknown value means no encryption plus a clear warning', () => {
  const r = normalizeLdapEncryption('bogus');
  assert.strictEqual(r.mode, 'off');
  assert.ok(typeof r.warning === 'string' && r.warning.length > 0,
    'unknown values must warn, never fail silently');
  assert.ok(r.warning.includes("'bogus'"), 'warning must echo the bad value');
});

test('NEGATIVE: the warning for unknown values lists all accepted values', () => {
  const w = normalizeLdapEncryption('yes').warning;
  assert.ok(w.includes("'true'"), "must list 'true'");
  assert.ok(w.includes("'starttls'"), "must list 'starttls'");
  assert.ok(w.includes("'false'"), "must list 'false'");
  assert.ok(w.includes("'ssl'"), "must mention legacy 'ssl'");
  assert.ok(w.includes("'tls'"), "must mention legacy 'tls'");
});

test('NEGATIVE: unknown value is never treated as encryption enabled', () => {
  for (const bad of ['yes', 'on', '1', 'ldaps', 'sttarttls', 'enable', 'TLSv1.2']) {
    const r = normalizeLdapEncryption(bad);
    assert.strictEqual(r.mode, 'off', `'${bad}' must not silently enable encryption`);
    assert.ok(r.warning, `'${bad}' must produce a warning`);
  }
});

test('NEGATIVE: numeric values (settings_get converts digits) warn and stay off', () => {
  // settings_get() turns '1'/'0' into Numbers; neither is a valid setting.
  for (const bad of [1, 0]) {
    const r = normalizeLdapEncryption(bad);
    assert.strictEqual(r.mode, 'off');
    assert.ok(r.warning, `${bad} must produce a warning`);
  }
});

test("NEGATIVE: 'starttls' must NOT map to LDAPS and 'true' must NOT map to STARTTLS", () => {
  assert.notStrictEqual(normalizeLdapEncryption('starttls').mode, 'tls');
  assert.notStrictEqual(normalizeLdapEncryption('true').mode, 'starttls');
});

test('NEGATIVE: valid values never carry the invalid-value warning', () => {
  for (const good of ['true', 'starttls', 'false', '', undefined, true, false]) {
    const r = normalizeLdapEncryption(good);
    assert.strictEqual(r.warning, undefined,
      `'${good}' is valid and must not warn`);
  }
});

console.log(`\n${passed} tests passed`);
