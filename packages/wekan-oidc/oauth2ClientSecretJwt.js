'use strict';

// Vendored copy of models/lib/oauth2ClientSecretJwt.js. A Meteor local
// package is its own isolated build unit and cannot import app-tree modules
// (see packages/wekan-ldap/server/configResolver.js's header comment for the
// full story - the same "works under plain Node, fails under Meteor's
// package linker" trap). This file is pure (Node's crypto/fs only, no other
// app dependency), so it is vendored rather than injected. Keep both copies
// in sync; models/lib/oauth2ClientSecretJwt.js stays canonical, tested by
// tests/oauth2ClientSecretJwt.test.cjs.

const crypto = require('crypto');
const fs = require('fs');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

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

function maybeGenerateOauth2ClientSecretJwt(env, clientId) {
  const keyPath = env.OAUTH2_SECRET_JWT_KEY_PATH;
  if (!keyPath) return null;

  const privateKeyPem = fs.readFileSync(keyPath, 'utf8');
  const issuer = env.OAUTH2_SECRET_JWT_ISSUER;
  const keyId = env.OAUTH2_SECRET_JWT_KEY_ID;
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
