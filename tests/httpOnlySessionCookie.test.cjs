'use strict';

// Regression coverage for CookieTokenBleed.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const client = read('client/00-startup.js');
const server = read('server/accounts-common.js');
const headerLogin = read('server/header-login.js');

for (const [where, source] of [['client', client], ['server', server]]) {
  assert.match(source, /clientStorage: 'none'/,
    `${where} must not persist the resume token in Web Storage`);
  assert.match(source, /useHttpOnlyCookies: true/,
    `${where} must enable Meteor's native HttpOnly resume flow`);
}

assert.doesNotMatch(client, /document\.cookie\s*=/,
  'client JavaScript must never create a readable authentication cookie');
assert.doesNotMatch(client, /_storedLoginToken|_storeLoginToken/,
  'custom token copying must not bypass the native in-memory flow');
assert.match(client,
  /Accounts\.config\(\{ clientStorage: 'none', useHttpOnlyCookies: true \}\);[\s\S]*Accounts\.loginWithCookie\(\);/,
  'the cookie resume must start after the late client configuration (#6654)');
assert.doesNotMatch(client, /localStorage\.getItem\(['"]Meteor\.loginToken/,
  'reload recovery must not restore the old JavaScript-readable token flow');
assert.match(headerLogin, /\['Path=\/', 'SameSite=Lax', 'HttpOnly'\]/,
  'header login must issue its authentication cookies as HttpOnly');
assert.match(headerLogin, /cookieBase\.push\('Secure'\)/,
  'HTTPS header login must retain Secure in addition to HttpOnly');

console.log('httpOnlySessionCookie: 10 assertions passed');
