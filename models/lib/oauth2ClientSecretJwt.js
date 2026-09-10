'use strict';

// A generic-OAuth2 client secret, for providers whose "secret" is not a
// static string at all but a short-lived JWT the CLIENT must mint itself.
//
// Every generic-OAuth2 provider WeKan already talks to (Keycloak, Authelia,
// Nextcloud, Openshift, ADFS, Azure B2C, ...) hands out a static
// OAUTH2_SECRET string that is sent to the token endpoint as-is
// (packages/wekan-oidc/oidc_server.js: `OAuth.openSecret(config.secret)`).
// Sign in with Apple (#2458) is OIDC-shaped in every other respect, but its
// "client secret" is instead a JWT that:
//   - is signed with ES256, using the PRIVATE KEY downloaded once from
//     Apple's developer portal (never sent to Apple itself);
//   - carries iss (the Apple Team ID), sub (the Services ID / client_id),
//     aud (https://appleid.apple.com) and the key id (kid) of that private
//     key, plus iat/exp;
//   - is short-lived (Apple allows up to ~6 months, but there is no reason
//     not to mint a fresh one per token-exchange request, which is what
//     this module is for) - unlike a static secret, so it cannot be reused
//     once it has expired even if leaked.
// See docs/Features/Login/Apple.md for the operator-facing setup.
//
// This is plain Node `crypto` - no new dependency. Node has supported ES256
// (ECDSA P-256 + SHA-256) signing since 8.x, and the IEEE-P1363 (raw r||s)
// signature encoding JWT requires (rather than crypto's DER default) since
// 12.x via the `dsaEncoding` option.

const crypto = require('crypto');
const fs = require('fs');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Pure: given the private key PEM and the claims, returns a signed ES256 JWT
// client secret. No filesystem or environment access, so this is the
// function the unit test drives directly.
function generateClientSecretJwt({
  privateKeyPem,
  keyId,
  issuer,
  subject,
  audience,
  now = Math.floor(Date.now() / 1000),
  expiresInSeconds = 300,
} = {}) {
  if (!privateKeyPem) throw new Error('generateClientSecretJwt: privateKeyPem is required');
  if (!issuer) throw new Error('generateClientSecretJwt: issuer is required');
  if (!subject) throw new Error('generateClientSecretJwt: subject is required');
  if (!audience) throw new Error('generateClientSecretJwt: audience is required');

  const header = { alg: 'ES256', typ: 'JWT' };
  if (keyId) header.kid = keyId;

  const claims = {
    iss: issuer,
    iat: now,
    exp: now + Math.max(1, parseInt(expiresInSeconds, 10) || 300),
    aud: audience,
    sub: subject,
  };

  const signingInput = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(claims));

  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key: privateKeyPem,
    dsaEncoding: 'ieee-p1363',
  });

  return signingInput + '.' + base64url(signature);
}

// Reads the operator's configuration from the environment and, only when
// OAUTH2_SECRET_JWT_KEY_PATH is set, mints a fresh client-secret JWT. Returns
// null when unset, so every existing OAuth2 provider (Keycloak, Authelia,
// ...) is completely unaffected - the caller then falls back to the static
// OAUTH2_SECRET exactly as before.
function maybeGenerateOauth2ClientSecretJwt(env, clientId) {
  const keyPath = env.OAUTH2_SECRET_JWT_KEY_PATH;
  if (!keyPath) return null;

  const privateKeyPem = fs.readFileSync(keyPath, 'utf8');
  const issuer = env.OAUTH2_SECRET_JWT_ISSUER;
  const keyId = env.OAUTH2_SECRET_JWT_KEY_ID;
  // Apple's token endpoint is the default audience since this feature exists
  // for #2458; a generic-OIDC provider that also needs this quirk can point
  // it elsewhere.
  const audience = env.OAUTH2_SECRET_JWT_AUDIENCE || 'https://appleid.apple.com';
  const subject = env.OAUTH2_SECRET_JWT_SUBJECT || clientId;
  const expiresInSeconds = env.OAUTH2_SECRET_JWT_EXPIRES_IN
    ? parseInt(env.OAUTH2_SECRET_JWT_EXPIRES_IN, 10)
    : 300;

  return generateClientSecretJwt({
    privateKeyPem,
    keyId,
    issuer,
    subject,
    audience,
    expiresInSeconds,
  });
}

module.exports = { generateClientSecretJwt, maybeGenerateOauth2ClientSecretJwt };
