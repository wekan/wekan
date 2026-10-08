'use strict';

// SAML identity-provider profiles: which signature is required, and popup or
// full-page redirect login (Admin Panel -> People -> SAML).
// Run: node tests/samlIdpProfile.test.cjs
//
// SAML 2.0 lets an identity provider sign the Response, the Assertion or both.
// WeKan always required a signed Response - node-saml's default, which WeKan
// never overrode - so an identity provider that signs only the Assertion was
// rejected with "Invalid document signature" before the Assertion was checked.
// SAML_IDP_PROFILE=signed-assertion-redirect requires the Assertion signature
// instead and logs in by full-page redirect; each setting can also be chosen
// on its own. This test signs real responses with a throwaway key and runs
// them through the same node-saml version WeKan ships.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SignedXml } = require('xml-crypto');
const { SAML } = require('@node-saml/node-saml');
const { resolveSamlConfig, validateSamlConfig, cleanSamlOverrides, SAML_PROFILES } = require('../models/lib/samlConfig');

const root = path.join(__dirname, '..');
const fixture = name => fs.readFileSync(path.join(__dirname, 'fixtures/saml', name), 'utf8');
const IDP_KEY = fixture('idp-key.pem');
const IDP_CERT = fixture('idp-cert.pem');
const OTHER_CERT = fixture('other-cert.pem');
const ACS = 'https://wekan.test/_saml/validate/default';

function response({ signAssertion = true, signResponse = false, tamper = false } = {}) {
  const now = new Date();
  const later = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const earlier = new Date(now.getTime() - 60 * 1000).toISOString();
  const assertionId = '_a' + Math.random().toString(16).slice(2);
  const responseId = '_r' + Math.random().toString(16).slice(2);
  let assertion = `<saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${assertionId}" Version="2.0" IssueInstant="${now.toISOString()}">` +
    '<saml:Issuer>https://idp.test/metadata</saml:Issuer>' +
    '<saml:Subject><saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">person@example.test</saml:NameID>' +
    `<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="${later}" Recipient="${ACS}"/></saml:SubjectConfirmation></saml:Subject>` +
    `<saml:Conditions NotBefore="${earlier}" NotOnOrAfter="${later}"><saml:AudienceRestriction><saml:Audience>urn:wekan:test</saml:Audience></saml:AudienceRestriction></saml:Conditions>` +
    `<saml:AuthnStatement AuthnInstant="${now.toISOString()}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement>` +
    '</saml:Assertion>';
  const sign = (xml, id, afterIssuer) => {
    const sig = new SignedXml({ privateKey: IDP_KEY, publicCert: IDP_CERT });
    sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
    sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';
    sig.addReference({
      xpath: `//*[@ID='${id}']`,
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      transforms: ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
    });
    sig.computeSignature(xml, { location: { reference: afterIssuer, action: 'after' } });
    return sig.getSignedXml();
  };
  if (signAssertion) assertion = sign(assertion, assertionId, "//*[local-name(.)='Issuer']");
  if (tamper) assertion = assertion.replace('person@example.test', 'admin@example.test');
  let xml = `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${responseId}" Version="2.0" IssueInstant="${now.toISOString()}" Destination="${ACS}">` +
    '<saml:Issuer>https://idp.test/metadata</saml:Issuer>' +
    '<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>' +
    assertion + '</samlp:Response>';
  if (signResponse) xml = sign(xml, responseId, "/*/*[local-name(.)='Issuer']");
  return { SAMLResponse: Buffer.from(xml).toString('base64') };
}

// The options saml_server.js passes, for a resolved WeKan configuration.
function samlFor(config, cert = IDP_CERT) {
  return new SAML({
    entryPoint: 'https://idp.test/sso', issuer: 'urn:wekan:test', audience: 'urn:wekan:test',
    idpCert: cert, callbackUrl: ACS, validateInResponseTo: 'never',
    wantAuthnResponseSigned: config.wantResponseSigned !== false,
    wantAssertionsSigned: config.wantAssertionsSigned === true,
  });
}

async function main() {
  const base = { SAML_ENABLED: 'true', SAML_ENTRYPOINT: 'https://idp.test/sso', SAML_ISSUER: 'urn:wekan:test', SAML_CERT: 'x' };

  // Profiles and per-setting overrides.
  const standard = resolveSamlConfig({}, base);
  // The signatures are what WeKan always required. The login flow changed on
  // 2026-10-08, at the maintainer's request, from popup to full-page redirect
  // for every profile: a popup is blocked in iframes and on some phones, and
  // an identity provider's Cross-Origin-Opener-Policy can cut it off.
  assert.deepEqual([standard.config.wantResponseSigned, standard.config.wantAssertionsSigned, standard.config.loginFlow],
    [true, false, 'redirect'], 'the standard profile: signed Response, redirect login');
  // Negative: popup is still chosen when asked for.
  assert.equal(resolveSamlConfig({}, { ...base, SAML_LOGIN_FLOW: 'popup' }).config.loginFlow, 'popup');
  assert.equal(standard.sources.loginFlow.source, 'profile');
  const redirect = resolveSamlConfig({ idpProfile: 'signed-assertion-redirect' }, base).config;
  assert.deepEqual([redirect.wantResponseSigned, redirect.wantAssertionsSigned, redirect.loginFlow], [false, true, 'redirect']);
  const mixed = resolveSamlConfig({ idpProfile: 'signed-assertion-redirect', loginFlow: 'popup' },
    { ...base, SAML_WANT_RESPONSE_SIGNED: 'true' });
  assert.deepEqual([mixed.config.wantResponseSigned, mixed.config.wantAssertionsSigned, mixed.config.loginFlow], [true, true, 'popup']);
  assert.equal(mixed.sources.wantResponseSigned.source, 'env');
  assert.equal(mixed.sources.loginFlow.source, 'admin');
  assert.deepEqual(Object.keys(SAML_PROFILES), ['standard', 'signed-assertion-redirect']);
  for (const config of [standard.config, redirect, mixed.config]) assert.doesNotThrow(() => validateSamlConfig(config));

  // Negative: no signature at all, unknown choices.
  assert.throws(() => validateSamlConfig(resolveSamlConfig({ wantResponseSigned: false }, base).config), /SAML_WANT_RESPONSE_SIGNED or SAML_WANT_ASSERTIONS_SIGNED/);
  assert.throws(() => validateSamlConfig(resolveSamlConfig({ idpProfile: 'signed-assertion-redirect', wantAssertionsSigned: false }, base).config), /needs/);
  assert.throws(() => validateSamlConfig(resolveSamlConfig({}, { ...base, SAML_IDP_PROFILE: 'vendor' }).config), /SAML_IDP_PROFILE/);
  assert.throws(() => validateSamlConfig(resolveSamlConfig({}, { ...base, SAML_LOGIN_FLOW: 'iframe' }).config), /SAML_LOGIN_FLOW/);
  assert.throws(() => cleanSamlOverrides({ loginFlow: 'iframe' }), /SAML_LOGIN_FLOW/);
  assert.throws(() => cleanSamlOverrides({ wantAssertionsSigned: 'true' }), /SAML_WANT_ASSERTIONS_SIGNED/);
  assert.deepEqual(cleanSamlOverrides({ loginFlow: 'redirect', idpProfile: '' }), { loginFlow: 'redirect' });

  // Real signatures through node-saml 5.1.0.
  await assert.rejects(samlFor(standard.config).validatePostResponseAsync(response()), /Invalid document signature/,
    'an Assertion-only signature is refused by the standard profile, as reported');
  const accepted = await samlFor(redirect).validatePostResponseAsync(response());
  assert.equal(accepted.profile.nameID, 'person@example.test');
  const both = await samlFor(standard.config).validatePostResponseAsync(response({ signResponse: true }));
  assert.equal(both.profile.nameID, 'person@example.test', 'a signed Response still works with the standard profile');
  await assert.rejects(samlFor(redirect).validatePostResponseAsync(response({ tamper: true })), /signature/i,
    'a changed Assertion is refused');
  await assert.rejects(samlFor(redirect, OTHER_CERT).validatePostResponseAsync(response()), /signature/i,
    'a certificate that did not sign the Assertion is refused');
  await assert.rejects(samlFor(redirect).validatePostResponseAsync(response({ signAssertion: false })), /signature/i,
    'an unsigned Assertion is refused when its signature is required');

  // The package uses the resolved settings and both flows.
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const server = read('packages/wekan-accounts-saml/saml_server.js');
  assert.match(server, /wantAuthnResponseSigned: config\.wantResponseSigned !== false/);
  assert.match(server, /wantAssertionsSigned: config\.wantAssertionsSigned === true/);
  assert.match(server, /if \(isRedirectFlow\(config\)\) finishLogin\(res, credentialToken\);\s*else closePopup\(res\);/);
  assert.match(server, /sign-in\?samlToken=\$\{encodeURIComponent\(credentialToken\)\}/);
  assert.match(server, /slice\(0, 200\)/, 'error text in the redirect is bounded');
  const client = read('packages/wekan-accounts-saml/saml_client.js');
  // Redirect unless the configuration says popup (popup was the fallback
  // before 2026-10-08), so a configuration not loaded yet still redirects.
  assert.match(client, /config && config\.loginFlow === 'popup' \? 'popup' : 'redirect'/);
  assert.match(client, /setItem\(SAML_PENDING_TOKEN, credentialToken\)/);
  assert.match(client, /if \(!expected \|\| expected !== credentialToken\)/, 'a token this tab did not start is not exchanged');
  assert.match(client, /window\.history\.replaceState/);
  assert.match(read('packages/wekan-accounts-saml/package.js'), /api\.use\('service-configuration', \['client', 'server'\]\)/);
  assert.match(read('client/components/settings/authProviderSettings.jade'), /else if choiceField/);

  // Nothing site-specific: the settings describe what an identity provider
  // does, never whose it is. The SAML code and its settings name no host at
  // all, apart from GitHub references and reserved example/test domains.
  const allowed = /(^|\.)(github\.com|example\.(test|invalid|com|org)|[a-z0-9-]+\.(test|invalid))$/i;
  for (const file of ['models/lib/samlConfig.js', 'packages/wekan-accounts-saml/saml_server.js',
    'packages/wekan-accounts-saml/saml_client.js', 'server/saml.js']) {
    const hosts = (read(file).match(/https?:\/\/[^\s'"`)]+/g) || [])
      .map(url => new URL(url).hostname).filter(name => !allowed.test(name));
    assert.deepEqual(hosts, [], `${file} names a host`);
  }
  assert.deepEqual(Object.keys(SAML_PROFILES).filter(name => !/^[a-z-]+$/.test(name)), []);

  console.log('  ok - SAML identity-provider profiles verify real Assertion and Response signatures');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
