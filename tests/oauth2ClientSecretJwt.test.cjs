'use strict';

// Plain-Node unit test (no Meteor) for #2458 (Sign in with Apple)'s
// client-secret-as-a-JWT support.
// Run: node tests/oauth2ClientSecretJwt.test.cjs
//
// Apple, unlike every other generic-OAuth2/OIDC provider Wekan already talks
// to (Keycloak, Authelia, Nextcloud, ...), does not issue a static
// OAUTH2_SECRET string. Its "client secret" is a short-lived JWT the server
// signs itself (ES256) with a private key downloaded from Apple's developer
// portal. This pins:
//   - generateClientSecretJwt() produces a validly-shaped ES256 JWT whose
//     header/claims match what was asked for, and whose signature actually
//     verifies against the public key (i.e. it is not just three base64url
//     segments that happen to look right);
//   - maybeGenerateOauth2ClientSecretJwt() is opt-in: with the new env vars
//     UNSET (every existing provider's default), it returns null, so
//     packages/wekan-oidc/oidc_server.js's `resolveClientSecret()` falls back
//     to the static OAUTH2_SECRET exactly as it did before this feature
//     existed - Keycloak/Authelia/etc. are completely unaffected.

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  generateClientSecretJwt,
  maybeGenerateOauth2ClientSecretJwt,
} = require('../models/lib/oauth2ClientSecretJwt');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function base64urlDecode(segment) {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
});
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

// --- generateClientSecretJwt: shape, claims, signature ----------------------

test('produces a three-segment compact JWT', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    keyId: 'KEY123',
    issuer: 'TEAM123',
    subject: 'fi.wekan.services',
    audience: 'https://appleid.apple.com',
    now: 1000,
    expiresInSeconds: 300,
  });
  assert.strictEqual(jwt.split('.').length, 3);
});

test('header carries alg ES256, typ JWT and the given kid', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    keyId: 'KEY123',
    issuer: 'TEAM123',
    subject: 'fi.wekan.services',
    audience: 'https://appleid.apple.com',
    now: 1000,
  });
  const header = JSON.parse(base64urlDecode(jwt.split('.')[0]));
  assert.deepStrictEqual(header, { alg: 'ES256', typ: 'JWT', kid: 'KEY123' });
});

test('claims carry iss/sub/aud and iat/exp per expiresInSeconds', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    keyId: 'KEY123',
    issuer: 'TEAM123',
    subject: 'fi.wekan.services',
    audience: 'https://appleid.apple.com',
    now: 1000,
    expiresInSeconds: 300,
  });
  const claims = JSON.parse(base64urlDecode(jwt.split('.')[1]));
  assert.deepStrictEqual(claims, {
    iss: 'TEAM123',
    iat: 1000,
    exp: 1300,
    aud: 'https://appleid.apple.com',
    sub: 'fi.wekan.services',
  });
});

test('defaults expiresInSeconds to 300 when not given', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    issuer: 'TEAM123',
    subject: 'sub',
    audience: 'aud',
    now: 1000,
  });
  const claims = JSON.parse(base64urlDecode(jwt.split('.')[1]));
  assert.strictEqual(claims.exp - claims.iat, 300);
});

test('omits kid from the header when none is given', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    issuer: 'TEAM123',
    subject: 'sub',
    audience: 'aud',
    now: 1000,
  });
  const header = JSON.parse(base64urlDecode(jwt.split('.')[0]));
  assert.strictEqual('kid' in header, false);
});

test('the signature verifies against the matching public key (IEEE P1363)', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    keyId: 'KEY123',
    issuer: 'TEAM123',
    subject: 'fi.wekan.services',
    audience: 'https://appleid.apple.com',
    now: 1000,
  });
  const [headerSeg, claimsSeg, sigSeg] = jwt.split('.');
  const signingInput = headerSeg + '.' + claimsSeg;
  const signature = base64urlDecode(sigSeg);
  const ok = crypto.verify(
    'sha256',
    Buffer.from(signingInput),
    { key: publicKey, dsaEncoding: 'ieee-p1363' },
    signature,
  );
  assert.strictEqual(ok, true);
});

test('the signature does NOT verify against a different key pair', () => {
  const jwt = generateClientSecretJwt({
    privateKeyPem,
    issuer: 'TEAM123',
    subject: 'sub',
    audience: 'aud',
    now: 1000,
  });
  const otherPublicKey = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  }).publicKey;
  const [headerSeg, claimsSeg, sigSeg] = jwt.split('.');
  const ok = crypto.verify(
    'sha256',
    Buffer.from(headerSeg + '.' + claimsSeg),
    { key: otherPublicKey, dsaEncoding: 'ieee-p1363' },
    base64urlDecode(sigSeg),
  );
  assert.strictEqual(ok, false);
});

test('throws when a required claim input is missing', () => {
  assert.throws(() => generateClientSecretJwt({ privateKeyPem, subject: 's', audience: 'a' }), /issuer/);
  assert.throws(() => generateClientSecretJwt({ privateKeyPem, issuer: 'i', audience: 'a' }), /subject/);
  assert.throws(() => generateClientSecretJwt({ privateKeyPem, issuer: 'i', subject: 's' }), /audience/);
  assert.throws(() => generateClientSecretJwt({ issuer: 'i', subject: 's', audience: 'a' }), /privateKeyPem/);
});

// --- maybeGenerateOauth2ClientSecretJwt: opt-in from the environment -------

test('returns null (negative test: static-secret path unaffected) when OAUTH2_SECRET_JWT_KEY_PATH is unset', () => {
  const env = {
    OAUTH2_SECRET: 'plain-static-secret',
    OAUTH2_CLIENT_ID: 'some-client-id',
  };
  assert.strictEqual(maybeGenerateOauth2ClientSecretJwt(env, env.OAUTH2_CLIENT_ID), null);
});

test('returns null when the env object has none of the new vars at all (every existing provider default)', () => {
  assert.strictEqual(maybeGenerateOauth2ClientSecretJwt({}, 'client-id'), null);
});

test('mints a JWT from env vars when OAUTH2_SECRET_JWT_KEY_PATH is set, defaulting subject to clientId and audience to Apple', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-oauth2-jwt-'));
  const keyPath = path.join(dir, 'AuthKey.p8');
  fs.writeFileSync(keyPath, privateKeyPem);
  try {
    const env = {
      OAUTH2_SECRET_JWT_KEY_PATH: keyPath,
      OAUTH2_SECRET_JWT_ISSUER: 'TEAM123',
      OAUTH2_SECRET_JWT_KEY_ID: 'KEY123',
    };
    const jwt = maybeGenerateOauth2ClientSecretJwt(env, 'fi.wekan.services');
    assert.strictEqual(typeof jwt, 'string');
    assert.strictEqual(jwt.split('.').length, 3);
    const header = JSON.parse(base64urlDecode(jwt.split('.')[0]));
    const claims = JSON.parse(base64urlDecode(jwt.split('.')[1]));
    assert.strictEqual(header.kid, 'KEY123');
    assert.strictEqual(claims.iss, 'TEAM123');
    assert.strictEqual(claims.sub, 'fi.wekan.services'); // defaulted from clientId
    assert.strictEqual(claims.aud, 'https://appleid.apple.com'); // Apple default
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('honors OAUTH2_SECRET_JWT_SUBJECT/AUDIENCE/EXPIRES_IN overrides', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-oauth2-jwt-'));
  const keyPath = path.join(dir, 'AuthKey.p8');
  fs.writeFileSync(keyPath, privateKeyPem);
  try {
    const env = {
      OAUTH2_SECRET_JWT_KEY_PATH: keyPath,
      OAUTH2_SECRET_JWT_ISSUER: 'TEAM123',
      OAUTH2_SECRET_JWT_KEY_ID: 'KEY123',
      OAUTH2_SECRET_JWT_SUBJECT: 'override-subject',
      OAUTH2_SECRET_JWT_AUDIENCE: 'https://example.com',
      OAUTH2_SECRET_JWT_EXPIRES_IN: '60',
    };
    const jwt = maybeGenerateOauth2ClientSecretJwt(env, 'fi.wekan.services');
    const claims = JSON.parse(base64urlDecode(jwt.split('.')[1]));
    assert.strictEqual(claims.sub, 'override-subject');
    assert.strictEqual(claims.aud, 'https://example.com');
    assert.strictEqual(claims.exp - claims.iat, 60);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

console.log(`\n${passed} passed`);
