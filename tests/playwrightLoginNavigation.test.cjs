'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, 'playwright', 'helpers', 'auth.js'),
  'utf8',
);
const login = source.slice(
  source.indexOf('async function loginWithToken'),
  source.indexOf('/** Login using the actual username/password form'),
);
const afterLogin = login.slice(login.indexOf('if (result.error)'));

console.log('playwrightLoginNavigation:');

assert.ok(/await navigateInApp\(page, '\/'\)/.test(login),
  'token login finishes through the live client-side router');
assert.ok(!/await page\.goto\(BASE_URL/.test(afterLogin),
  'token login must not discard its authenticated DDP connection with a full reload');
const beforeLogin = login.slice(0, login.indexOf('const result ='));
assert.strictEqual((beforeLogin.match(/page\.reload/g) || []).length, 1,
  'only the wrong-user branch may reload before token login');
assert.ok(/if \(!onLoadedApp\)/.test(beforeLogin),
  'an already-loaded WeKan page is reused instead of downloaded again');
assert.ok(/Meteor\.userId\(\) === expectedId/.test(login),
  'the helper still verifies the expected identity after routing');

console.log('  ok - token login keeps the authenticated Meteor connection');
