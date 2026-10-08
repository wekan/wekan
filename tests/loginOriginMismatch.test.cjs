'use strict';

// "Sign in with Google" always returned to the sign-in page when WeKan was
// opened at another address than ROOT_URL: the provider returns to ROOT_URL's
// origin and the login secret lands in that origin's storage. The sign-in page
// now says so (models/lib/loginOriginMismatch.js) instead of looping silently.
// Run: node --test tests/loginOriginMismatch.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const { loginOriginMismatch, offersProviderLogin } = require('../models/lib/loginOriginMismatch');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('each way the page and ROOT_URL can differ is reported, with both origins', () => {
  const cases = [
    ['https://wekan.example.com', 'http://wekan.example.com/sign-in'],
    ['https://example.com', 'https://www.example.com/sign-in'],
    ['https://wekan.example.com', 'http://192.168.1.20:3000/sign-in'],
    ['http://wekan.example.com:8080', 'http://wekan.example.com/sign-in'],
    ['http://127.0.0.1', 'http://wekan.example.lan/sign-in'],
  ];
  for (const [root, page] of cases) {
    const result = loginOriginMismatch(root, page);
    assert.deepStrictEqual(result, { expected: new URL(root).origin, actual: new URL(page).origin }, `${root} vs ${page}`);
  }
});

test('negative: the same origin is no mismatch, whatever the path', () => {
  assert.strictEqual(loginOriginMismatch('https://example.com/wekan', 'https://example.com/wekan/sign-in'), null);
  assert.strictEqual(loginOriginMismatch('https://EXAMPLE.com:443/', 'https://example.com/sign-in'), null);
  assert.strictEqual(loginOriginMismatch('http://example.com:80', 'http://example.com/'), null);
});

test('negative: unreadable addresses say nothing rather than something wrong', () => {
  assert.strictEqual(loginOriginMismatch(undefined, 'https://example.com/'), null);
  assert.strictEqual(loginOriginMismatch('https://example.com', 'not a url'), null);
  assert.strictEqual(loginOriginMismatch('https://example.com', 'file:///sign-in'), null);
});

test('only a login through a provider is affected', () => {
  assert.ok(offersProviderLogin({ ldap: false, oauth2: true, cas: false, saml: false }), 'OIDC');
  assert.ok(offersProviderLogin({ google: true, passwordless: false }), 'Google');
  assert.ok(offersProviderLogin({ saml: true }) && offersProviderLogin({ cas: true }));
  assert.ok(!offersProviderLogin({ ldap: true, oauth2: false, cas: false, saml: false, passwordless: true }), 'same-page methods');
  assert.ok(!offersProviderLogin(undefined) && !offersProviderLogin(null) && !offersProviderLogin('x'));
  assert.ok(!offersProviderLogin({ google: 'true' }), 'only a real true counts');
});

test('the sign-in page shows it, from the configured ROOT_URL, only when a provider is offered', () => {
  const js = read('client/components/main/layouts.js');
  assert.match(js, /require\('\/models\/lib\/loginOriginMismatch'\)/);
  const call = js.slice(js.indexOf("Meteor.call('getAuthenticationsEnabled'"));
  assert.match(call, /if \(offersProviderLogin\(result\)\) \{\s*instance\.loginOriginMismatch\.set\(loginOriginMismatch\(\s*window\.__meteor_runtime_config__ && window\.__meteor_runtime_config__\.ROOT_URL,\s*window\.location\.href,/);
  // Not Meteor.absoluteUrl(): the browser may rebuild that from the page's own
  // origin (#6752), which would hide exactly this mismatch.
  assert.ok(!/loginOriginMismatch\(\s*Meteor\.absoluteUrl/.test(js));
  const jade = read('client/components/main/layouts.jade');
  assert.match(jade, /if loginOriginMismatch\n\s+p\.login-origin-mismatch\.js-login-origin-mismatch\(role="alert"\)\n\s+\| \{\{_ 'login-origin-mismatch' expected=loginOriginMismatch\.expected actual=loginOriginMismatch\.actual\}\}/);
});

test('the message names both addresses, and its placeholders are the ones the page passes', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const text = en['login-origin-mismatch'];
  assert.ok(text, 'English text exists');
  assert.deepStrictEqual([...new Set(text.match(/__[a-z]+__/g))].sort(), ['__actual__', '__expected__']);
  assert.match(text, /ROOT_URL/);
});
