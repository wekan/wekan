'use strict';

// Guard: CasTokenBleed (2026-10-02), a CasBleed sibling. The CAS callback stored the validated
// CAS identity under whatever casToken the callback URL carried, and the
// token is chosen by the browser. So an attacker could pick a token, send a
// victim who is signed in to CAS the link
//   https://cas.example/login?service=https://wekan.example/?casToken=KNOWN
// and, once CAS bounced the victim back with a ticket, log in to WeKan with
// cas: { credentialToken: KNOWN } as the victim. The callback is now accepted
// only from the browser that started that login (a SameSite cookie it set),
// and a mismatch is recorded under CasTokenBleed in Admin Panel -> Problems.
// Run: node tests/casStateBinding.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { casStateCookie } = require('../packages/wekan-accounts-cas/cas_url');

test('the state is read only from its own cookie', () => {
  assert.equal(casStateCookie('a=1; wekan_cas_state=Tok123; b=2'), 'Tok123');
  assert.equal(casStateCookie('wekan_cas_state=Tok123'), 'Tok123');
  for (const header of [undefined, '', 'a=1', 'wekan_cas_state=', 'xwekan_cas_state=Tok123', 'wekan_cas_statex=Tok123']) {
    assert.equal(casStateCookie(header), null, String(header));
  }
});

test('the reported attack: a callback whose token this browser did not set is refused and recorded', () => {
  const server = read('packages/wekan-accounts-cas/cas_server.js');
  const mw = server.slice(server.indexOf('const middleware = '), server.indexOf('const casValidate = '));
  const check = mw.indexOf('if (casStateCookie(req.headers.cookie) !== credentialToken) {');
  const validate = mw.indexOf('casValidate(req, ticket, credentialToken');
  assert.ok(check > 0 && validate > check, 'the binding is checked before the ticket is validated');
  assert.match(mw.slice(check, validate), /__wekanTripCanary\('cas\.state-mismatch', \{ req \}\);[\s\S]*end\(res, redirectUrl\);\n\s*return;/);
  // An instance without CAS leaves ?ticket= to the route it was sent to.
  assert.match(mw, /if \(!Meteor\.settings\.cas\) \{\n\s*next\(\);\n\s*return;/);
  assert.match(read('models/lib/canaryTokens.js'), /'cas\.state-mismatch': \{\n\s*key: 'authn\.cas-state',/);
});

test('negative: the browser that starts a login sets the state it will be checked against', () => {
  const client = read('packages/wekan-accounts-cas/cas_client.js');
  const start = client.indexOf('Meteor.loginWithCas = function');
  const setCookie = client.indexOf("document.cookie = 'wekan_cas_state=' + credentialToken", start);
  const leave = client.indexOf('window.location = loginUrl', start);
  assert.ok(setCookie > start && leave > setCookie, 'cookie set before leaving for CAS');
  assert.match(client.slice(setCookie, leave), /SameSite=Lax/);
  // Nothing else in the package stores a validated identity.
  const server = read('packages/wekan-accounts-cas/cas_server.js');
  assert.equal((server.match(/_casCredentialTokens\[token\] = /g) || []).length, 1);
});
