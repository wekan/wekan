'use strict';
// Sign in with Apple through the generic OIDC login (docs/Features/Login-Page/Apple.md):
// Apple requires response_mode=form_post and has no userinfo endpoint - its
// claims are in the id_token and its access_token is opaque. The decisions are
// models/lib/oidcProviderMode.js; this also pins that the OIDC package uses them.
// Run: node --test tests/oidcProviderMode.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const m = require('../models/lib/oidcProviderMode');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('Apple: form_post and the ID token, found by its address alone', () => {
  assert.equal(m.responseMode({ serverUrl: 'https://appleid.apple.com' }), 'form_post');
  assert.equal(m.claimsSource({ serverUrl: 'https://appleid.apple.com' }), 'id_token');
  // A userinfo endpoint someone configured is used as configured.
  assert.equal(m.claimsSource({ serverUrl: 'https://appleid.apple.com', userinfoEndpoint: '/x' }), 'userinfo');
  // A setup made from the old docs page, with OAUTH2_ADFS_ENABLED=true, still reads the ID token.
  assert.equal(m.claimsSource({ serverUrl: 'https://appleid.apple.com', env: { OAUTH2_ADFS_ENABLED: 'true' } }), 'id_token');
});

test('other providers: unchanged unless asked', () => {
  for (const serverUrl of ['https://keycloak.example.com/realms/w', 'https://appleid.apple.com.evil.example', '']) {
    assert.equal(m.responseMode({ serverUrl }), '', serverUrl);
    assert.equal(m.claimsSource({ serverUrl }), 'userinfo', serverUrl);
  }
  assert.equal(m.claimsSource({ env: { OAUTH2_ADFS_ENABLED: 'true' } }), 'access_token');
  assert.equal(m.claimsSource({ env: { OAUTH2_B2C_ENABLED: 'true' } }), 'access_token');
  assert.equal(m.claimsSource({ env: { OAUTH2_CLAIMS_IN_ID_TOKEN: 'true' } }), 'id_token');
  assert.equal(m.responseMode({ env: { OAUTH2_RESPONSE_MODE: 'FORM_POST' } }), 'form_post');
  assert.equal(m.responseMode({ env: { OAUTH2_RESPONSE_MODE: 'javascript:' } }), '', 'only the three OAuth2 modes');
});

test('the claims token: the ID token when that is where they are, never an opaque access token', () => {
  const token = { access_token: 'opaque', id_token: 'a.b.c' };
  assert.equal(m.claimsToken(token, 'id_token'), 'a.b.c');
  assert.equal(m.claimsToken({ access_token: 'opaque' }, 'id_token'), null);
  assert.equal(m.claimsToken(token, 'userinfo'), 'opaque');
});

test('the OIDC package reads them from its service configuration', () => {
  const client = read('packages/wekan-oidc/oidc_client.js');
  assert.match(client, /if \(config\.responseMode\) \{\s*options\.response_mode = config\.responseMode;/);
  const server = read('packages/wekan-oidc/oidc_server.js');
  assert.match(server, /if \(claimsSource === 'id_token'\)\s*\{[\s\S]{0,300}userinfo = getTokenContent\(idToken\);/);
  assert.match(server, /getTokenContent\(claimsSource === 'id_token' && idToken \? idToken : accessToken\)/);
  const auth = read('server/authentication.js');
  assert.match(auth, /responseMode: mode\.responseMode\(\{ serverUrl, env \}\)/);
  assert.match(auth, /claimsSource: mode\.claimsSource\(/);
});
