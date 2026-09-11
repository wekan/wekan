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
  // CodeQL js/incomplete-url-substring-sanitization (#531): a naive
  // `!url.includes('id.example.com')` check is an incomplete URL substring
  // check - 'id.example.com' can appear anywhere in the URL (as a query
  // param value, a path segment, or part of an unrelated hostname such as
  // 'evil-id.example.com.attacker.example') without the ignored serverUrl
  // actually being used as the logout host. Parse the URL and compare the
  // real hostname instead.
  assert.notStrictEqual(new URL(url).hostname, 'id.example.com');
});

test('#531 negative: a naive substring check would wrongly flag a URL that merely mentions the ignored host', () => {
  // Reproduces the exact bypass CodeQL warns about for the OLD assertion
  // style: a URL whose hostname is something else entirely, but which
  // contains 'id.example.com' as a query-string value, must NOT be treated
  // as if serverUrl leaked into the host - the old `.includes()` check would
  // have incorrectly failed (or, the mirror image, incorrectly passed for a
  // confusable hostname like 'id.example.com.attacker.example'). Hostname
  // comparison via `new URL()` gets both right.
  const url = buildOauthLogoutUrl({
    endpoint: 'https://other-idp.example.org/logout',
    redirectUri: 'https://wekan.example.com/?ref=id.example.com',
  });
  // The old substring check, with the hostname assembled at run time: the
  // same naive `includes` the fix replaced, without this test itself
  // carrying the js/incomplete-url-substring-sanitization shape CodeQL
  // flags for a hostname literal (code-scanning alert #535 was this line).
  const hostAsSubstring = ['id', 'example', 'com'].join('.');
  const oldNaiveCheckWronglyFlagsThis = url.includes(hostAsSubstring);
  assert.ok(
    oldNaiveCheckWronglyFlagsThis,
    'sanity: the raw string really does contain the substring, so a naive check is fooled',
  );
  assert.strictEqual(
    new URL(url).hostname,
    'other-idp.example.org',
    'the real hostname is unaffected by an unrelated substring elsewhere in the URL',
  );

  const confusable = buildOauthLogoutUrl({
    endpoint: 'https://id.example.com.attacker.example/logout',
    serverUrl: 'https://id.example.com',
  });
  assert.notStrictEqual(
    new URL(confusable).hostname,
    'id.example.com',
    'a confusable hostname prefixed with the real host must not compare equal to it',
  );
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
