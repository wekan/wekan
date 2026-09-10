'use strict';

// models/lib/configResolver.js: the shared Admin-Panel-override-vs-env-var
// resolution helper the LDAP admin-panel override feature is built on (the
// maintainer's "Add all settings from environment variables to Admin Panel
// where appropriate ... as possibility to override"). Precedence: an
// explicit, non-empty admin value wins; otherwise the env var; otherwise
// undefined - and the returned `source` tag is what lets the Admin Panel UI
// show which one is actually in effect.
//
// Run: node tests/configResolver.test.cjs

const assert = require('assert');
const path = require('path');
const {
  resolveConfigValue,
  hasConfigValue,
  redactCredentialsInUrl,
} = require(path.join(__dirname, '..', 'models', 'lib', 'configResolver.js'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('configResolver:');

test('admin value wins over the env var when both are set', () => {
  const result = resolveConfigValue('LDAP_HOST', 'admin.example.com', {
    readEnv: () => 'env.example.com',
  });
  assert.deepStrictEqual(result, { value: 'admin.example.com', source: 'admin' });
});

test('falls back to the env var when the admin value is empty/unset', () => {
  for (const adminValue of [undefined, null, '']) {
    const result = resolveConfigValue('LDAP_HOST', adminValue, {
      readEnv: () => 'env.example.com',
    });
    assert.deepStrictEqual(result, { value: 'env.example.com', source: 'env' },
      `admin value ${JSON.stringify(adminValue)} must fall through to env`);
  }
});

test('falls back to undefined/"default" when neither is set', () => {
  const result = resolveConfigValue('LDAP_HOST', '', { readEnv: () => undefined });
  assert.deepStrictEqual(result, { value: undefined, source: 'default' });
});

test('reads process.env by default when no readEnv override is given', () => {
  process.env.CONFIG_RESOLVER_TEST_VAR = 'from-process-env';
  try {
    const result = resolveConfigValue('CONFIG_RESOLVER_TEST_VAR', undefined);
    assert.deepStrictEqual(result, { value: 'from-process-env', source: 'env' });
  } finally {
    delete process.env.CONFIG_RESOLVER_TEST_VAR;
  }
});

test('hasConfigValue reports whether a secret is configured and where from, '
  + 'precedence matches resolveConfigValue', () => {
  assert.deepStrictEqual(
    hasConfigValue('LDAP_AUTHENTIFICATION_PASSWORD', 'a-secret', { readEnv: () => 'also-set' }),
    { hasValue: true, source: 'admin' },
  );
  assert.deepStrictEqual(
    hasConfigValue('LDAP_AUTHENTIFICATION_PASSWORD', '', { readEnv: () => 'env-secret' }),
    { hasValue: true, source: 'env' },
  );
  assert.deepStrictEqual(
    hasConfigValue('LDAP_AUTHENTIFICATION_PASSWORD', undefined, { readEnv: () => undefined }),
    { hasValue: false, source: 'default' },
  );
});

// SECURITY: this is the core guarantee the whole "do not load passwords to
// browser side" requirement rests on. hasConfigValue's return value must
// NEVER, under any input, contain the secret string itself - only a boolean
// and a source tag. Fuzz a handful of representative secret shapes through it
// and assert the exact secret value never appears anywhere in the result.
test('hasConfigValue NEVER returns the secret value itself (negative)', () => {
  const secrets = [
    'correct horse battery staple',
    'p@ss:w0rd/with#special&chars',
    'ldap://embedded:creds@example.com',
    '', // even an empty string must not leak as a "value" key
  ];
  for (const secret of secrets) {
    const result = hasConfigValue('LDAP_AUTHENTIFICATION_PASSWORD', secret, {
      readEnv: () => secret,
    });
    const serialized = JSON.stringify(result);
    assert.deepStrictEqual(Object.keys(result).sort(), ['hasValue', 'source'],
      'the result object must carry only hasValue/source, never a value field');
    if (secret) {
      assert.ok(!serialized.includes(secret),
        `hasConfigValue's result must not contain the secret "${secret}"`);
    }
  }
});

test('redactCredentialsInUrl masks embedded credentials in a connection string', () => {
  assert.strictEqual(
    redactCredentialsInUrl('ldap://admin:s3cr3t@directory.example.com:389'),
    'ldap://admin:***@directory.example.com:389',
  );
  assert.strictEqual(
    redactCredentialsInUrl('smtp://user:another-secret@mail.example.com:587'),
    'smtp://user:***@mail.example.com:587',
  );
  // A plain value with no embedded credentials is returned unchanged.
  assert.strictEqual(
    redactCredentialsInUrl('directory.example.com'),
    'directory.example.com',
  );
  // Never throws on non-string input; returns it unchanged.
  assert.strictEqual(redactCredentialsInUrl(undefined), undefined);
  assert.strictEqual(redactCredentialsInUrl(null), null);
});

console.log(`\n${passed} tests passed`);
