'use strict';

// Plain-Node unit test (no Meteor) for the OAuth2/OIDC login style handling.
// Run: node tests/oauth2LoginStyle.test.cjs
//
// Regression guard for #5695 ("OAUTH2_LOGIN_STYLE=redirect: make fixes so that
// redirect would work"): the useraccounts social-login button always calls
// Meteor.loginWithOidc({ loginStyle: 'popup' }) (its client-side
// socialLoginStyle default), and OAuth._loginStyle() lets that caller option
// override the loginStyle stored in the service configuration. As a result the
// admin's OAUTH2_LOGIN_STYLE=redirect was never honored and a popup opened
// (the reporter even saw "...&loginStyle=popup&..." serialized into the
// authorization URL). Oidc.requestCredential must now:
//   - use the full-page redirect flow when the service configuration says
//     loginStyle 'redirect' (i.e. OAUTH2_LOGIN_STYLE=redirect), even though
//     the login button passed { loginStyle: 'popup' };
//   - keep popup as the default otherwise;
//   - not leak the Meteor-internal loginStyle option into the provider URL.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  resolveOidcEndpoint,
} = require('../packages/wekan-oidc/endpoint');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- Load packages/wekan-oidc/oidc_client.js in a sandbox -------------------
// Strip the one relative module import because vm.Script evaluates scripts,
// then inject that real helper into the sandbox. Everything else is the actual
// Meteor client file.

const clientSrc = fs
  .readFileSync(
    path.join(__dirname, '..', 'packages', 'wekan-oidc', 'oidc_client.js'),
    'utf8',
  )
  .replace(/^import \{ resolveOidcEndpoint \} from '\.\/endpoint';\n/m, '');

// Faithful copy of Meteor's OAuth._loginStyle precedence (packages/oauth):
// options.loginStyle || config.loginStyle || 'popup', with a popup fallback
// when sessionStorage is unavailable (Safari private mode).
let sessionStorageAvailable = true;
let launched = null;
let serviceConfig = null;

const OAuth = {
  _loginStyle(service, config, options) {
    const loginStyle =
      (options && options.loginStyle) || config.loginStyle || 'popup';
    if (!['popup', 'redirect'].includes(loginStyle)) {
      throw new Error(`Invalid login style: ${loginStyle}`);
    }
    if (loginStyle === 'redirect' && !sessionStorageAvailable) {
      return 'popup';
    }
    return loginStyle;
  },
  _redirectUri: () => 'http://wekan.example/_oauth/oidc',
  _stateParam: (loginStyle, credentialToken) =>
    `st-${loginStyle}-${credentialToken}`,
  launchLogin(opts) {
    launched = opts;
  },
};

const sandbox = {
  Meteor: {
    call(method, service, cb) {
      assert.strictEqual(method, 'getServiceConfiguration');
      assert.strictEqual(service, 'oidc');
      cb(null, serviceConfig);
    },
  },
  OAuth,
  Random: { secret: () => 'tok123' },
  ServiceConfiguration: {
    ConfigError: class ConfigError extends Error {},
  },
  resolveOidcEndpoint,
  console,
};
vm.createContext(sandbox);
vm.runInContext(clientSrc, sandbox, { filename: 'oidc_client.js' });
assert.ok(sandbox.Oidc, 'oidc_client.js must define the Oidc global');

// Simulate one login attempt: `config` is what the server stored from
// OAUTH2_LOGIN_STYLE (server/authentication.js), `options` is what the caller
// (the useraccounts button or the auto-redirect) passed to loginWithOidc.
function requestWith(config, options) {
  launched = null;
  serviceConfig = Object.assign(
    {
      clientId: 'wekan',
      serverUrl: 'https://auth.example',
      authorizationEndpoint: '/authorize',
    },
    config,
  );
  sandbox.Oidc.requestCredential(options, () => {});
  assert.ok(launched, 'OAuth.launchLogin must have been called');
  return launched;
}

// --- POSITIVE: OAUTH2_LOGIN_STYLE=redirect is honored ------------------------
test('#5695: config redirect wins over the login button popup default', () => {
  // The useraccounts social button always passes { loginStyle: 'popup' }.
  const l = requestWith({ loginStyle: 'redirect' }, { loginStyle: 'popup' });
  assert.strictEqual(l.loginStyle, 'redirect');
});

test('#5695: config redirect used when the caller passes no options', () => {
  const l = requestWith({ loginStyle: 'redirect' }, undefined);
  assert.strictEqual(l.loginStyle, 'redirect');
});

test('explicit redirect option (OIDC_REDIRECTION_ENABLED auto-login) works even with popup config', () => {
  const l = requestWith({ loginStyle: 'popup' }, { loginStyle: 'redirect' });
  assert.strictEqual(l.loginStyle, 'redirect');
});

test('redirect state param is built for the redirect flow', () => {
  const l = requestWith({ loginStyle: 'redirect' }, { loginStyle: 'popup' });
  assert.strictEqual(l.credentialToken, 'tok123');
  assert.ok(l.loginUrl.includes(encodeURIComponent('st-redirect-tok123')));
});

// --- NEGATIVE: popup remains the default -------------------------------------
test('NEGATIVE: popup by default when the config has no loginStyle', () => {
  const l = requestWith({}, { loginStyle: 'popup' });
  assert.strictEqual(l.loginStyle, 'popup');
  const l2 = requestWith({}, undefined);
  assert.strictEqual(l2.loginStyle, 'popup');
});

test('NEGATIVE: OAUTH2_LOGIN_STYLE=popup keeps the popup flow', () => {
  const l = requestWith({ loginStyle: 'popup' }, { loginStyle: 'popup' });
  assert.strictEqual(l.loginStyle, 'popup');
});

test('NEGATIVE: redirect falls back to popup when sessionStorage is unavailable', () => {
  // Meteor's redirect flow needs sessionStorage (Safari private mode has
  // none); the config override must still go through that fallback.
  sessionStorageAvailable = false;
  const l = requestWith({ loginStyle: 'redirect' }, { loginStyle: 'popup' });
  assert.strictEqual(l.loginStyle, 'popup');
  sessionStorageAvailable = true;
});

test('NEGATIVE: loginStyle is not leaked into the authorization URL', () => {
  // The reporter saw "...%26loginStyle%3Dpopup%26..." in the provider URL.
  const l = requestWith({ loginStyle: 'redirect' }, { loginStyle: 'popup' });
  assert.ok(!l.loginUrl.includes('loginStyle'), l.loginUrl);
  const l2 = requestWith({ loginStyle: 'popup' }, { loginStyle: 'popup' });
  assert.ok(!l2.loginUrl.includes('loginStyle'), l2.loginUrl);
});

// --- Server side: redirect by default, popup only when asked -----------------
// Until 2026-10-08 the default was popup and this section pinned that. The
// maintainer made redirect the default: Google's sign-in pages can send
// Cross-Origin-Opener-Policy, which makes Meteor's popup look closed at once,
// so the login was tried before the provider answered and the user was back
// on the sign-in page with no error. The full-page redirect has no popup.
const authSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'authentication.js'),
  'utf8',
);

test('server config maps OAUTH2_LOGIN_STYLE to popup only when set to popup', () => {
  // Read through authEnv (Admin Panel / People / OAuth2 override, else the
  // environment variable); the explicit comparison is what this pins.
  assert.ok(/loginStyle:\s*\n?\s*authEnv\('OAUTH2_LOGIN_STYLE'\) === 'popup'\s*\n?\s*\?\s*'popup'\s*\n?\s*:\s*'redirect'/.test(authSrc),
    authSrc.match(/OAUTH2_LOGIN_STYLE[^\n]*/g).join('\n'));
  // The decision itself, for every value an administrator can give.
  const decide = value => (value === 'popup' ? 'popup' : 'redirect');
  for (const value of [undefined, '', 'redirect', 'REDIRECT', 'nonsense']) assert.strictEqual(decide(value), 'redirect', String(value));
  assert.strictEqual(decide('popup'), 'popup');
});

test("NEGATIVE: nothing else on the OAuth2/OIDC path falls back to popup", () => {
  // `|| 'popup'` or a `: 'popup'` fallback would bring the old default back.
  assert.ok(!/OAUTH2_LOGIN_STYLE'\)\s*\|\|\s*'popup'/.test(authSrc));
  assert.ok(!/=== 'redirect'\s*\?\s*'redirect'\s*:\s*'popup'/.test(authSrc), 'the old popup fallback is gone');
  // The Admin Panel shows the same default the server applies.
  const catalog = fs.readFileSync(path.join(__dirname, '..', 'models', 'lib', 'authConfigCatalog.js'), 'utf8');
  assert.match(catalog, /\['loginStyle', 'OAUTH2_LOGIN_STYLE', 'choice', \{ choices: \['popup', 'redirect'\], defaultValue: 'redirect' \}\]/);
  // And the packaged defaults agree.
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8'), /^\s+OAUTH2_LOGIN_STYLE=redirect \\$/m);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'snap-src', 'bin', 'config'), 'utf8'), /^DEFAULT_OAUTH2_LOGIN_STYLE="redirect"$/m);
});

// --- Secondary ask: OIDC_REDIRECTION_ENABLED auto-login actually runs --------
const settingsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'settings.js'),
  'utf8',
);

test('isOidcRedirectionEnabled awaits the async service configuration', () => {
  // Object.keys(<Promise>) is always [] since the findOneAsync migration, so
  // the unawaited version returned false even when properly configured.
  const m = settingsSrc.match(/async isOidcRedirectionEnabled\(\)[\s\S]*?\n  \},/);
  assert.ok(m, 'isOidcRedirectionEnabled must be async');
  assert.ok(m[0].includes("await loadOidcConfig('oidc')"));
  assert.ok(!m[0].includes('Object.keys(loadOidcConfig'));
});

const layoutsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'main', 'layouts.js'),
  'utf8',
);

test('auto-redirect login declares its options (no strict-mode ReferenceError)', () => {
  // layouts.js is an ES module (strict mode); the undeclared `options = {...}`
  // assignment threw a ReferenceError and killed the auto-redirect.
  const m = layoutsSrc.match(/isOidcRedirectionEnabled[\s\S]*?\}\);/);
  assert.ok(m, 'layouts.js must keep the isOidcRedirectionEnabled auto-login');
  assert.ok(m[0].includes('const options = {'));
  // No bare (undeclared) `options = {` statement may remain in the block.
  assert.ok(!/^\s*options = \{/m.test(m[0]));
  assert.ok(m[0].includes("loginStyle: AccountsTemplates.options.socialLoginStyle"));
  assert.ok(m[0].includes('Meteor.loginWithOidc(options)'));
});

console.log(`\n${passed} passing`);
