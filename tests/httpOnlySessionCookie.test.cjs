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
assert.match(client,
  /const legacyResumeToken = Accounts\._storedLoginToken\(\);[\s\S]*Accounts\.config\(\{ clientStorage: 'none', useHttpOnlyCookies: true \}\);/,
  'an upgrade must read its old token before config replaces local storage');
assert.doesNotMatch(client, /Accounts\._storeLoginToken/,
  'application code must never write directly to Accounts token storage');
assert.match(client,
  /if \(legacyResumeToken\) \{\s*Accounts\.loginWithToken\(legacyResumeToken\);\s*\} else \{\s*Accounts\.loginWithCookie\(\);\s*\}/,
  'an upgrade resumes once from its old token and a cookie-native client uses its cookie');
assert.doesNotMatch(client, /localStorage\.getItem\(['"]Meteor\.loginToken/,
  'reload recovery must not restore the old JavaScript-readable token flow');
assert.match(headerLogin, /\['Path=\/', 'SameSite=Lax', 'HttpOnly'\]/,
  'header login must issue its authentication cookies as HttpOnly');
assert.match(headerLogin, /cookieBase\.push\('Secure'\)/,
  'HTTPS header login must retain Secure in addition to HttpOnly');

console.log('httpOnlySessionCookie: 11 assertions passed');
