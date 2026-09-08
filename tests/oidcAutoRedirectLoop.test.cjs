'use strict';

// #6681: "SSO with OIDC goes into loop" - with `oauth2-login-style: redirect`
// and `oidc-redirection-enabled: true`, the browser looped between WeKan and
// the identity provider until the provider started rate-limiting the
// repeated /authorize requests.
//
// Root cause: Template.userFormsLayout.onCreated (client/components/main/
// layouts.js) fired the OIDC auto-redirect unconditionally on every render.
// Meteor's redirect-style OAuth has no dedicated callback route - the
// identity provider's callback bounces the browser back to this SAME
// sign-in page - and the login method that follows a successful callback
// completes asynchronously, racing this template's own re-render. When the
// auto-redirect check ran before that login had finished, it saw "not
// logged in yet" and fired a brand new navigation straight back to the
// provider, forever.
//
// Fix: a one-shot sessionStorage flag (client/lib/oidcAutoRedirect.js) that
// survives the full-page round trip to the provider and back, so the
// bounce-back render does not re-fire the redirect; cleared on login
// success/failure (config/accounts.js) so a later logout/retry still works.
//
// Run: node tests/oidcAutoRedirectLoop.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('oidcAutoRedirectLoop:');

const helper = read('client/lib/oidcAutoRedirect.js');
const layouts = read('client/components/main/layouts.js');
const accounts = read('config/accounts.js');

test('the auto-redirect helper checks a one-shot flag before ever writing it', () => {
  assert.match(helper, /function readFlag\(\)/);
  assert.match(helper, /sessionStorage\.getItem\(OIDC_AUTO_REDIRECT_FLAG\) === '1'/);
  assert.match(helper, /function setFlag\(\)/);
  assert.match(helper, /sessionStorage\.setItem\(OIDC_AUTO_REDIRECT_FLAG, '1'\)/);
});

test('a sessionStorage exception fails OPEN, not closed (negative)', () => {
  // A storage restriction (private browsing, policy) must not turn into a
  // SECOND, different way to break the same login by refusing to ever
  // redirect at all.
  const readFn = helper.slice(helper.indexOf('function readFlag'), helper.indexOf('function setFlag'));
  assert.match(readFn, /catch \(error\) \{\s*return false;/);
});

test('layouts.js imports the helper and gates the auto-redirect on it', () => {
  assert.match(layouts, /import \{ OidcAutoRedirect \} from '\/client\/lib\/oidcAutoRedirect'/);
  assert.match(layouts, /if \(result && !OidcAutoRedirect\.hasAlreadyFired\(\)\) \{/,
    'the redirect only fires when the flag has not already been set this tab session');
  assert.match(layouts, /OidcAutoRedirect\.markFired\(\);/,
    'and the flag is set before navigating away, so the bounce-back sees it');
});

test('markFired happens BEFORE the navigating call, not after (negative)', () => {
  // Meteor.loginWithOidc(...) triggers a full-page navigation for redirect
  // style; code placed after it in the same callback would never run.
  const at = layouts.indexOf('OidcAutoRedirect.markFired();');
  const loginCallAt = layouts.indexOf('Meteor.loginWithOidc(options);');
  assert.ok(at !== -1 && loginCallAt !== -1 && at < loginCallAt,
    'markFired() must be called before Meteor.loginWithOidc(), not after');
});

test('a successful AND a failed login both clear the flag', () => {
  assert.match(accounts, /require\('\/client\/lib\/oidcAutoRedirect'\)/);
  assert.match(accounts, /Accounts\.onLogin\(\(\) => OidcAutoRedirect\.clear\(\)\)/);
  assert.match(accounts, /Accounts\.onLoginFailure\(\(\) => OidcAutoRedirect\.clear\(\)\)/);
});

test('the clearing import stays inside the client-only guard (negative)', () => {
  // config/accounts.js is loaded by BOTH client/imports.js and
  // server/imports.js - a top-level `import` of a client/-pathed module
  // would pull client-only code into the server bundle. It must only be
  // required inside `if (Meteor.isClient)`.
  assert.ok(!/^import \{ OidcAutoRedirect \}/m.test(accounts),
    'no top-level (unconditional) import of the client-only helper');
  const clientBlockAt = accounts.indexOf('if (Meteor.isClient)');
  const requireAt = accounts.indexOf("require('/client/lib/oidcAutoRedirect')");
  assert.ok(clientBlockAt !== -1 && requireAt > clientBlockAt,
    'the require() call sits after the isClient guard opens');
});

console.log(`\noidcAutoRedirectLoop: ${passed} tests passed`);
