'use strict';

// Plain-Node unit test (no Meteor) for the OIDC RP-Initiated Logout URL
// builder (issue #2905 - Single Logout / SLO for OIDC/OAuth2 SSO, e.g.
// Keycloak). The feature was already implemented for #6158
// (server/models/settings.js' getOauthLogoutUrl(), wired into
// config/accounts.js' onLogoutHook()); this test pins the pure URL-building
// logic that was extracted to server/lib/oauthLogoutUrl.js so it is
// independently, quickly verifiable.
// Run: node tests/oauthLogoutUrl.test.cjs

const assert = require('assert');
const { buildOauthLogoutUrl } = require('../server/lib/oauthLogoutUrl');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- OAUTH2_LOGOUT_ENDPOINT unset: unchanged behavior -----------------------

test('unset endpoint: returns empty string (feature is a no-op by default)', () => {
  assert.strictEqual(
    buildOauthLogoutUrl({
      endpoint: undefined,
      serverUrl: 'https://id.example.com',
      clientId: 'wekan',
      redirectUri: 'https://wekan.example.com/',
    }),
    '',
  );
});

test('empty-string endpoint: also a no-op', () => {
  assert.strictEqual(
    buildOauthLogoutUrl({ endpoint: '', serverUrl: 'https://id.example.com' }),
    '',
  );
});

// --- Keycloak-shaped path endpoint, resolved against OAUTH2_SERVER_URL -----

test('path endpoint is resolved against serverUrl, with post_logout_redirect_uri and client_id', () => {
  const url = buildOauthLogoutUrl({
    endpoint: '/realms/myrealm/protocol/openid-connect/logout',
    serverUrl: 'https://id.example.com',
    clientId: 'wekan',
    redirectUri: 'https://wekan.example.com/',
  });
  assert.strictEqual(
    url,
    'https://id.example.com/realms/myrealm/protocol/openid-connect/logout' +
      '?post_logout_redirect_uri=' + encodeURIComponent('https://wekan.example.com/') +
      '&client_id=wekan',
  );
});

test('trailing slash on serverUrl does not double up before the path', () => {
  const url = buildOauthLogoutUrl({
    endpoint: '/realms/myrealm/protocol/openid-connect/logout',
    serverUrl: 'https://id.example.com/',
    redirectUri: 'https://wekan.example.com/',
  });
  assert.ok(url.startsWith('https://id.example.com/realms/myrealm/'));
  assert.ok(!url.includes('.com//realms'));
});

// --- Absolute endpoint: serverUrl is ignored --------------------------------

test('absolute endpoint is used as-is, ignoring serverUrl', () => {
  const url = buildOauthLogoutUrl({
    endpoint: 'https://other-idp.example.org/logout',
    serverUrl: 'https://id.example.com',
    redirectUri: 'https://wekan.example.com/',
  });
  assert.ok(url.startsWith('https://other-idp.example.org/logout'));
  assert.ok(!url.includes('id.example.com'));
});

// --- Optional params ---------------------------------------------------------

test('no redirectUri and no clientId: endpoint alone, no query string', () => {
  const url = buildOauthLogoutUrl({
    endpoint: 'https://id.example.com/logout',
    serverUrl: 'https://id.example.com',
  });
  assert.strictEqual(url, 'https://id.example.com/logout');
});

test('redirectUri without clientId: only post_logout_redirect_uri is appended', () => {
  const url = buildOauthLogoutUrl({
    endpoint: 'https://id.example.com/logout',
    redirectUri: 'https://wekan.example.com/',
  });
  assert.strictEqual(
    url,
    'https://id.example.com/logout?post_logout_redirect_uri=' +
      encodeURIComponent('https://wekan.example.com/'),
  );
});

test('endpoint that already carries a query string appends with &, not ?', () => {
  const url = buildOauthLogoutUrl({
    endpoint: 'https://id.example.com/logout?foo=bar',
    redirectUri: 'https://wekan.example.com/',
  });
  assert.strictEqual(
    url,
    'https://id.example.com/logout?foo=bar&post_logout_redirect_uri=' +
      encodeURIComponent('https://wekan.example.com/'),
  );
});

test('redirectUri is percent-encoded (RFC-compliant query parameter)', () => {
  const url = buildOauthLogoutUrl({
    endpoint: 'https://id.example.com/logout',
    redirectUri: 'https://wekan.example.com/?board=1&x=y',
  });
  assert.ok(url.includes(encodeURIComponent('https://wekan.example.com/?board=1&x=y')));
  // The raw, un-encoded redirect target must not appear verbatim in the query.
  assert.ok(!url.includes('?board=1&x=y'));
});

console.log(`oauthLogoutUrl.test.cjs: ${passed} passed`);
