'use strict';

// Regression coverage for #708 (SAML login). Pins:
//  - the server config plumbing (SAML_* env vars -> ServiceConfiguration)
//  - that @node-saml/node-saml does the actual SAML protocol / XML-signature
//    work (this codebase must not hand-roll that - see CLAUDE.md's scope
//    discipline for this feature)
//  - the login button is gated on SAML_ENABLED via getAuthenticationsEnabled,
//    the same conditional-render pattern already used for OAuth2/LDAP/CAS
//  - the account-conflict guard (no silent takeover of a non-SAML username)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const authentication = read('server/authentication.js');
const settings = read('server/models/settings.js');
const samlServer = read('packages/wekan-accounts-saml/saml_server.js');
const samlClient = read('packages/wekan-accounts-saml/saml_client.js');
const samlPackageJs = read('packages/wekan-accounts-saml/package.js');
const layoutsJs = read('client/components/main/layouts.js');
const layoutsJade = read('client/components/main/layouts.jade');
const packagesFile = read('.meteor/packages');
const dockerCompose = read('docker-compose.yml');
const pkgJson = JSON.parse(read('package.json'));
const enI18n = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('SAML_ENABLED reads the same true-string/true-boolean pattern as other providers', () => {
  assert.match(
    authentication,
    /process\.env\.SAML_ENABLED === 'true' \|\|\s*\n\s*process\.env\.SAML_ENABLED === true/,
  );
});

test('the SAML service configuration is written to ServiceConfiguration.configurations', () => {
  assert.match(authentication, /\{ service: 'saml' \}/);
  for (const field of [
    'provider:', 'entryPoint:', 'issuer:', 'cert:', 'idpSLORedirectURL:',
    'privateKeyFile:', 'publicCertFile:', 'identifierFormat:',
    'localProfileMatchAttribute:', 'attributesSAML:',
  ]) {
    assert.ok(authentication.includes(field), `SAML config must set ${field}`);
  }
});

test('getAuthenticationsEnabled reports saml, gated by isSamlEnabled()', () => {
  assert.match(settings, /function isSamlEnabled\(\)\s*{\s*\n\s*return\s*\(\s*\n?\s*process\.env\.SAML_ENABLED === 'true' \|\| process\.env\.SAML_ENABLED === true/);
  // The map is built in a local before it is returned, because the Meteor
  // accounts-* providers and passwordless are added to it after the four fixed
  // methods (server/lib/oauthProviders.js); the saml entry is still gated on
  // isSamlEnabled() alone.
  assert.match(settings, /getAuthenticationsEnabled\(\)\s*{\s*\n\s*const enabled\s*=\s*{[^}]*saml: isSamlEnabled\(\)/);
});

test('the SAML package depends on the verified-MIT @node-saml/node-saml library, not a hand-rolled implementation', () => {
  assert.match(samlPackageJs, /'@node-saml\/node-saml':\s*'5\.1\.0'/);
  assert.strictEqual(pkgJson.dependencies['@node-saml/node-saml'], '^5.1.0');
});

test('the server never reimplements XML signature verification itself', () => {
  // The only place XML/signature-shaped work may appear is via the imported
  // SAML class from @node-saml/node-saml; this file must not contain its own
  // XML parsing or signature-verification logic.
  assert.match(samlServer, /import \{ SAML \} from '@node-saml\/node-saml';/);
  for (const forbidden of [/xml2js/, /xml-crypto/, /xmldom/, /createVerify\(/, /X509Certificate/]) {
    assert.doesNotMatch(samlServer, forbidden,
      `saml_server.js must not hand-roll XML/signature handling (${forbidden})`);
  }
});

test('the ACS (assertion consumer) endpoint validates the response through node-saml, keyed by a per-request credential token', () => {
  assert.match(samlServer, /validatePostResponseAsync\(body\)/);
  assert.match(samlServer, /body\.RelayState/);
  assert.match(samlServer, /_storeCredential\(credentialToken/);
});

test('a login attempt without a stored, validated credential is rejected', () => {
  assert.match(samlServer, /if \(!_hasCredential\(options\.saml\.credentialToken\)\)/);
  assert.match(samlServer, /no matching SAML login attempt found/);
});

test('SAML still refuses silent takeover of a non-SAML username', () => {
  assert.match(samlServer, /const isSamlAccount = user\.authenticationMethod === 'saml'/);
  assert.match(samlServer, /const mergeAllowed = process\.env\.SAML_MERGE_EXISTING_USERS === 'true'/);
  assert.match(samlServer, /throw new Meteor\.Error\(\s*\n?\s*'saml-account-conflict'/);
});

test('Meteor.loginWithSaml opens the authorize popup and exchanges a credential token', () => {
  assert.match(samlClient, /Meteor\.loginWithSaml = function/);
  assert.match(samlClient, /\/_saml\/authorize\?provider=/);
  assert.match(samlClient, /Accounts\.callLoginMethod\(\{\s*\n\s*methodArguments: \[\{ saml: \{ credentialToken: credentialToken \} \}\]/);
});

test('the login button only renders visibly when SAML is enabled (same conditional-render pattern as OAuth2)', () => {
  // Button starts hidden in markup...
  assert.match(layoutsJade, /button#at-saml\.hide\(type="button"\)/);
  // ...and only the getAuthenticationsEnabled('saml') branch removes .hide,
  // mirroring the existing oauth2 gate (`.indexOf('oauth2') !== -1`) already
  // used for `.at-oauth`.
  assert.match(layoutsJs, /enabledAuthenticationMethods\.indexOf\('saml'\) !== -1/);
  assert.match(layoutsJs, /\$\('#at-saml'\)\.removeClass\('hide'\)/);
});

test('clicking the SAML button calls Meteor.loginWithSaml with the configured provider', () => {
  assert.match(layoutsJs, /'click #at-saml'\(event\)/);
  assert.match(layoutsJs, /Meteor\.loginWithSaml\(\{ provider \}/);
});

test('the wekan-accounts-saml package is registered in .meteor/packages', () => {
  assert.match(packagesFile, /^wekan-accounts-saml$/m);
});

test('docker-compose.yml documents all SAML_* env vars the server code reads', () => {
  const envVars = [...authentication.matchAll(/process\.env\.(SAML_[A-Z_]+)/g)].map(m => m[1]);
  assert.ok(envVars.length > 0, 'expected to find SAML_* env vars in server/authentication.js');
  for (const envVar of new Set(envVars)) {
    assert.ok(
      dockerCompose.includes(`${envVar}=`),
      `docker-compose.yml must document ${envVar}`,
    );
  }
});

test('en.i18n.json has the samlSignIn login-button string used by the jade template', () => {
  assert.strictEqual(enI18n.samlSignIn, 'Sign In with SAML');
  assert.match(layoutsJade, /\{\{_ 'samlSignIn'\}\}/);
});

console.log(`\nsamlLogin: ${passed} tests passed`);
