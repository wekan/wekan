'use strict';
// #1904: "there is no way to restrict Google OAuth to a specific domain ...
// right now OAuth just logs in anyone and everyone." OAuth2/OIDC had
// OAUTH2_ALLOWED_EMAIL_DOMAINS; the Meteor login providers (Google, GitHub,
// Facebook, ...) had nothing. OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS, or its
// Admin Panel field, now restricts them with the same rule.
//
// Run: node tests/oauthProviderEmailDomains.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { isEmailDomainAllowed } = require('../models/lib/emailDomainPolicy');
const { allowedProviderEmailDomains } = require('../models/lib/oauthProviders');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('oauthProviderEmailDomains:');

test('the Admin Panel value wins over the variable; neither means every domain', () => {
  assert.equal(allowedProviderEmailDomains('acme.example', { OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS: 'other.example' }), 'acme.example');
  assert.equal(allowedProviderEmailDomains('', { OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS: 'other.example' }), 'other.example');
  assert.equal(allowedProviderEmailDomains(undefined, {}), '');
  assert.equal(isEmailDomainAllowed('anyone@anywhere.example', ''), true);
});

test('an allowed domain signs in; another domain, a missing email or a look-alike does not', () => {
  const domains = 'acme.example,acme.org';
  assert.equal(isEmailDomainAllowed('alice@acme.example', domains), true);
  assert.equal(isEmailDomainAllowed('bob@ACME.ORG'.toLowerCase(), domains), true);
  for (const email of ['eve@evil.example', '', 'eve@acme.example.evil.example', 'eve@sub.acme.example', 'a@b@acme.example']) {
    assert.equal(isEmailDomainAllowed(email, domains), false, email);
  }
  assert.equal(isEmailDomainAllowed('alice@acme.example', 'not a domain'), false, 'a malformed list refuses rather than allows');
});

test('the app and the OIDC package apply the very same policy', () => {
  const body = src => src.slice(src.indexOf('// Match the email supplied'));
  assert.equal(body(read('models/lib/emailDomainPolicy.js')), body(read('packages/wekan-oidc/emailDomainPolicy.js')));
});

test('enforced before an account is created, and on every later login', () => {
  const src = read('server/lib/oauthProviders.js');
  const create = src.slice(src.indexOf('export async function onCreateProviderUser'));
  const check = create.indexOf('if (!isEmailDomainAllowed(email, await providerEmailDomains())) throw domainRefused();');
  assert.ok(check !== -1 && check < create.indexOf('decideAccountConflict('), 'before create or merge');
  const validate = src.slice(src.indexOf('Accounts.validateLoginAttempt'));
  assert.match(validate, /if \(provider && options\.user\) \{[\s\S]*?isEmailDomainAllowed\(serviceEmail\(provider\.service, data\)\.toLowerCase\(\), await providerEmailDomains\(\)\)[\s\S]*?throw domainRefused\(\);/);
});

test('the setting is saved validated, reported with its source, and listed on every platform', () => {
  const settings = read('server/models/settings.js');
  assert.match(settings, /if \(input\.allowedEmailDomains !== undefined\) \{/);
  assert.match(settings, /throw new Meteor\.Error\('invalid-email-domains'/);
  assert.match(settings, /'OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS',\s*setting\?\.oauthProvidersAllowedEmailDomains/);
  assert.match(read('client/components/settings/settingBody.jade'), /input\.wekan-form-control#oauth-providers-allowed-email-domains/);
  for (const rel of ['Dockerfile', 'snap-src/bin/config', 'start-wekan.sh', 'start-wekan.bat', 'docker-compose.yml']) {
    assert.ok(read(rel).includes('OAUTH_PROVIDERS_ALLOWED_EMAIL_DOMAINS'), rel);
  }
});

console.log(`\noauthProviderEmailDomains: ${passed} tests passed`);
