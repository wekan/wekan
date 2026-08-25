'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { resolveOidcEndpoint } = require('../packages/wekan-oidc/endpoint');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('#5150 joins Spring Authorization Server default endpoints', () => {
  assert.strictEqual(
    resolveOidcEndpoint('http://localhost:9000', '/oauth2/authorize'),
    'http://localhost:9000/oauth2/authorize',
  );
  assert.strictEqual(
    resolveOidcEndpoint('http://localhost:9000/', 'oauth2/token'),
    'http://localhost:9000/oauth2/token',
  );
  assert.strictEqual(
    resolveOidcEndpoint('http://localhost:9000/', '/userinfo'),
    'http://localhost:9000/userinfo',
  );
});

test('absolute HTTPS endpoints remain unchanged', () => {
  assert.strictEqual(
    resolveOidcEndpoint(
      'https://issuer.example',
      'https://accounts.example/oauth2/token?tenant=one',
    ),
    'https://accounts.example/oauth2/token?tenant=one',
  );
});

test('#5150 absolute HTTP endpoints remain unchanged', () => {
  assert.strictEqual(
    resolveOidcEndpoint(
      'http://issuer.internal',
      'http://userinfo.internal/userinfo',
    ),
    'http://userinfo.internal/userinfo',
  );
});

test('negative: slash normalization never creates a double slash in the path', () => {
  for (const [base, endpoint] of [
    ['https://issuer.example/', '/oauth2/token'],
    ['https://issuer.example///', '///oauth2/token'],
    ['https://issuer.example', 'oauth2/token'],
  ]) {
    assert.strictEqual(
      resolveOidcEndpoint(base, endpoint),
      'https://issuer.example/oauth2/token',
    );
  }
});

test('authorization, token, Oracle token and userinfo paths share the resolver', () => {
  const client = fs.readFileSync(
    path.join(__dirname, '..', 'packages', 'wekan-oidc', 'oidc_client.js'),
    'utf8',
  );
  const server = fs.readFileSync(
    path.join(__dirname, '..', 'packages', 'wekan-oidc', 'oidc_server.js'),
    'utf8',
  );
  assert.match(
    client,
    /resolveOidcEndpoint\([\s\S]*config\.authorizationEndpoint/,
  );
  assert.strictEqual((server.match(/resolveOidcEndpoint\(/g) || []).length, 3);
  assert.doesNotMatch(server, /includes\(['"]https:\/\/['"]\)/);
});

test('maintained docs name Spring defaults and the exact callback', () => {
  const docs = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'Features', 'Login', 'OAuth2.md'),
    'utf8',
  );
  assert.match(docs, /Spring Authorization Server/);
  assert.match(docs, /OAUTH2_AUTH_ENDPOINT=\/oauth2\/authorize/);
  assert.match(docs, /OAUTH2_TOKEN_ENDPOINT=\/oauth2\/token/);
  assert.match(docs, /OAUTH2_USERINFO_ENDPOINT=\/userinfo/);
  assert.match(docs, /_oauth\/oidc/);
});

console.log(`\noidcEndpoint: all ${passed} tests passed`);
