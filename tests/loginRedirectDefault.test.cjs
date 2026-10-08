'use strict';

// Every login that can choose between a popup and a full-page redirect now
// redirects unless told otherwise (maintainer decision of 2026-10-08):
// OAUTH2_LOGIN_STYLE (OAuth2/OIDC), OAUTH_PROVIDERS_LOGIN_STYLE (Google,
// GitHub, ...), SAML_LOGIN_FLOW (through the SAML profiles) and CAS's
// "popup" setting. A popup is blocked in iframes and on some phones, and a
// provider's Cross-Origin-Opener-Policy can make Meteor's popup look closed at
// once, so the login was tried before the provider answered and the user was
// back on the sign-in page with no error.
//
// The per-setting suites pin each default (oauth2LoginStyle, oauthProviders,
// oauthProvidersPlatformEnv, samlIdpProfile). This one pins what a redirect
// login needs to WORK, and that no popup default is left anywhere:
//   - CAS completes a login that comes back in the same window (it never
//     did: nothing called Meteor.initCas), and its redirect page escapes the
//     address it echoes;
//   - a redirect login's error is shown on the reloaded sign-in page.
// Run: node --test tests/loginRedirectDefault.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const casClient = read('packages/wekan-accounts-cas/cas_client.js');
const casServer = read('packages/wekan-accounts-cas/cas_server.js');
const layouts = read('client/components/main/layouts.js');

// Run cas_client.js with a stand-in browser and Meteor, and report what one
// loginWithCas() call does.
function runCasLogin({ popupSetting, href = 'https://wekan.example/sign-in' } = {}) {
  const calls = { assigned: null, popup: null, startup: [], events: [], loginMethod: [] };
  const window = {
    location: { href, protocol: 'https:', set href(v) { calls.assigned = v; }, get href() { return href; } },
    open(url) { calls.popup = url; return { closed: false }; },
    history: { pushState() {} },
    dispatchEvent(event) { calls.events.push(event); },
    screenX: 0, screenY: 0, outerWidth: 1000, outerHeight: 800,
  };
  // `window.location = url` replaces the location object on the real window.
  const proxyWindow = new Proxy(window, {
    set(target, key, value) { if (key === 'location') { calls.assigned = value; return true; } target[key] = value; return true; },
  });
  const cas = { loginUrl: 'https://cas.example/login', serviceParam: 'service' };
  if (popupSetting !== undefined) cas.popup = popupSetting;
  const context = {
    window: proxyWindow,
    document: { title: '', cookie: '' },
    Meteor: { settings: { public: { cas } }, startup(fn) { calls.startup.push(fn); } },
    Accounts: { callLoginMethod(options) { calls.loginMethod.push(options); } },
    Random: { id: () => 'token123' },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    setInterval() { return 1; }, clearInterval() {},
  };
  vm.runInNewContext(casClient, context);
  return { context, calls };
}

test('CAS: a login leaves for the CAS server in this window by default', () => {
  const { context, calls } = runCasLogin();
  context.Meteor.loginWithCas({}, () => {});
  assert.ok(calls.assigned && calls.assigned.startsWith('https://cas.example/login?service='), String(calls.assigned));
  assert.match(decodeURIComponent(calls.assigned), /casToken=token123/);
  assert.equal(calls.popup, null, 'no popup');
});

test('CAS negative: "popup": true still opens the popup, and only true does', () => {
  const popup = runCasLogin({ popupSetting: true });
  popup.context.Meteor.loginWithCas({}, () => {});
  assert.ok(popup.calls.popup, 'popup opened');
  assert.equal(popup.calls.assigned, null);
  for (const setting of [false, 'true', 1, null]) {
    const run = runCasLogin({ popupSetting: setting });
    run.context.Meteor.loginWithCas({}, () => {});
    assert.equal(run.calls.popup, null, `popup: ${JSON.stringify(setting)} redirects`);
  }
});

test('CAS: the returning page completes the login and reports the result', () => {
  const { context, calls } = runCasLogin({ href: 'https://wekan.example/sign-in?casToken=abc' });
  assert.equal(calls.startup.length, 1, 'cas_client.js registers Meteor.initCas at startup');
  calls.startup[0]();
  assert.equal(calls.loginMethod.length, 1);
  // JSON: the objects come from another VM context.
  assert.equal(JSON.stringify(calls.loginMethod[0].methodArguments), JSON.stringify([{ cas: { credentialToken: 'abc' } }]));
  calls.loginMethod[0].userCallback({ reason: 'refused' });
  assert.equal(calls.events[0].type, 'wekan-cas-login');
  assert.equal(JSON.stringify(calls.events[0].detail), JSON.stringify({ error: { reason: 'refused' } }));
  // Negative: an ordinary page load has no casToken and logs nobody in.
  const plain = runCasLogin();
  plain.calls.startup[0]();
  assert.equal(plain.calls.loginMethod.length, 0);
});

test('CAS server: redirect unless "popup": true, and the redirect page escapes the address', () => {
  assert.match(casServer, /const casUsesPopup = \(\) => Boolean\(Meteor\.settings\.cas && Meteor\.settings\.cas\.popup === true\);/);
  assert.match(casServer, /const end = \(res, whereTo\) => \{\s*if \(casUsesPopup\(\)\) \{\s*closePopup\(res\);\s*\} else \{\s*redirect\(res, whereTo\);/);
  // Run the real escapeHtml and redirect against a hostile address.
  const start = casServer.indexOf('const escapeHtml');
  const escapeSrc = casServer.slice(start, casServer.indexOf(';\n', start) + 2);
  const redirectStart = casServer.indexOf('const redirect = ');
  const redirectSrc = casServer.slice(redirectStart, casServer.indexOf('\n}\n', redirectStart) + 3);
  const out = {};
  const res = { writeHead(status, headers) { out.status = status; out.headers = headers; }, end(body) { out.body = body; } };
  vm.runInNewContext(`${escapeSrc}\n${redirectSrc}\nredirect(res, whereTo);`,
    { res, whereTo: 'https://wekan.example/sign-in?x="><script>alert(1)</script>' });
  assert.equal(out.status, 302);
  assert.ok(!out.body.includes('<script>'), out.body);
  // The quote that would close the attribute arrives as &quot;.
  assert.ok(out.body.includes('url=https://wekan.example/sign-in?x=&quot;&gt;&lt;script&gt;'), out.body);
  assert.ok(out.body.includes('<a href="https://wekan.example/sign-in?x=&quot;&gt;'), out.body);
  // The Location header carries the address itself, not HTML.
  assert.equal(out.headers.Location, 'https://wekan.example/sign-in?x="><script>alert(1)</script>');
});

test('CAS negative: no code path treats an unset "popup" as popup any more', () => {
  for (const [file, src] of [['cas_client.js', casClient], ['cas_server.js', casServer]]) {
    assert.ok(!/popup\s*==\s*false/.test(src), `${file}: the old "== false means redirect" test is gone`);
  }
  assert.match(read('server/authentication.js'), /popupHeight: 610,\s*\/\/[^\n]*\n\s*popup: false,/);
});

test('the sign-in page starts CAS with the right arguments', () => {
  assert.match(layouts, /else if \(method === 'cas'\) Meteor\.loginWithCas\(\{\}, callback\);/);
  assert.ok(!/loginWithCas\(username, password/.test(layouts), 'username and password were passed as options and callback');
});

test('a redirect login\'s error is shown on the reloaded sign-in page', () => {
  assert.match(layouts, /Accounts\.onPageLoadLogin\(attempt => \{\s*if \(attempt && attempt\.type !== 'resume' && attempt\.error\) reportRedirectLoginError\(attempt\.error\);/);
  assert.match(layouts, /for \(const name of \['wekan-saml-login', 'wekan-cas-login'\]\) \{\s*window\.addEventListener\(name, event => reportRedirectLoginError\(event\.detail && event\.detail\.error\)\);/);
  // Kept until the form exists, and cleared by a successful login.
  assert.match(layouts, /if \(pendingRedirectLoginError\) Meteor\.defer\(\(\) => showLoginError\(redirectLoginErrorForDisplay\(pendingRedirectLoginError\)\)\);/);
  assert.match(layouts, /Accounts\.onLogin\(\(\) => \{ pendingRedirectLoginError = null; \}\);/);
  assert.ok(!/pendingSamlError/.test(layouts), 'one mechanism for every redirect login');
});

test('negative: no login style or flow anywhere defaults to popup', () => {
  const { normalizeLoginStyle } = require('../models/lib/oauthProviders');
  assert.equal(normalizeLoginStyle(undefined), 'redirect');
  const { SAML_PROFILES } = require('../models/lib/samlConfig');
  for (const [name, profile] of Object.entries(SAML_PROFILES)) assert.equal(profile.loginFlow, 'redirect', name);
  // The shape of the old defaults, searched for across the login code.
  const files = ['server/authentication.js', 'models/lib/oauthProviders.js', 'models/lib/samlConfig.js',
    'models/lib/authConfigCatalog.js', 'packages/wekan-oidc/oidc_client.js',
    'packages/wekan-accounts-cas/cas_client.js', 'packages/wekan-accounts-cas/cas_server.js',
    'packages/wekan-accounts-saml/saml_client.js', 'packages/wekan-accounts-saml/saml_server.js'];
  for (const file of files) {
    const src = read(file).replace(/\/\/[^\n]*/g, '');
    assert.ok(!/===\s*'redirect'\s*\?\s*'redirect'\s*:\s*'popup'/.test(src), `${file}: popup unless redirect`);
    assert.ok(!/LOGIN_STYLE'\)\s*\|\|\s*'popup'/.test(src), `${file}: || 'popup'`);
    assert.ok(!/defaultValue:\s*'popup'/.test(src), `${file}: defaultValue popup`);
    assert.ok(!/loginFlow:\s*'popup'/.test(src), `${file}: profile flow popup`);
  }
  for (const file of ['Dockerfile', '.devcontainer/Dockerfile']) {
    const src = read(file);
    assert.match(src, /^\s+OAUTH2_LOGIN_STYLE=redirect \\$/m, file);
    assert.match(src, /^\s+OAUTH_PROVIDERS_LOGIN_STYLE="redirect" \\$/m, file);
  }
  const snap = read('snap-src/bin/config');
  assert.match(snap, /^DEFAULT_OAUTH2_LOGIN_STYLE="redirect"$/m);
  assert.match(snap, /^DEFAULT_OAUTH_PROVIDERS_LOGIN_STYLE="redirect"$/m);
  // The sample configurations show redirect, never popup, as the value to set.
  for (const file of ['docker-compose.yml', 'start-wekan.sh', 'start-wekan.bat', 'releases/virtualbox/start-wekan.sh']) {
    const src = read(file);
    assert.ok(!/OAUTH2?_(PROVIDERS_)?LOGIN_STYLE=popup/.test(src), `${file}: a sample sets popup`);
  }
});
