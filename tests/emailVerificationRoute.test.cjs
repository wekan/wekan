'use strict';

// Route wiring regression for #1426. The accounts package does not install its
// token consumer merely because sendVerificationEmail is enabled; WeKan must
// explicitly configure the verifyEmail route.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'config/accounts.js'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('verification email sending remains enabled', () => {
  assert.match(source, /sendVerificationEmail:\s*true/);
});

test('the token consumer and resend routes are configured', () => {
  const routeStart = source.lastIndexOf("[\n  'signIn'");
  const routeList = source.slice(
    routeStart,
    source.indexOf(
      "].forEach(routeName => AccountsTemplates.configureRoute(routeName));",
      routeStart,
    ) + 80,
  );
  assert.match(routeList, /'verifyEmail'/);
  assert.match(routeList, /'resendVerificationEmail'/);
  assert.match(routeList, /AccountsTemplates\.configureRoute\(routeName\)/);
});

test('verification is not protected by WeKan signed-in route guards', () => {
  const router = fs.readFileSync(
    path.join(__dirname, '..', 'config/router.js'),
    'utf8',
  );
  assert.doesNotMatch(router, /verify-email/,
    'the accounts package owns the anonymous token route; do not shadow it');
});

console.log(`\nemailVerificationRoute: ${passed} tests passed`);
