'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const service = read('server/lib/adminLoginSettings.js');
const methods = read('server/methods/adminLoginSettings.js');
const settingsModel = read('server/models/settings.js');
const settingsPermission = read('server/permissions/settings.js');
const accountPermission = read('server/permissions/accountSettings.js');
const modern = read('client/components/settings/settingBody.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeopleLogin:');

test('one bounded Global Admin service owns both Login setting renderers', () => {
  assert.ok(/requireGlobalAdmin[\s\S]*?isAdmin[\s\S]*?LoginSettingsBleed/.test(service));
  assert.ok(/LOGIN_ALLOW_KEYS\.includes\(key\)/.test(service));
  assert.ok(/methods\.includes\(method\)/.test(service));
  assert.ok(/oidcBtnText\.length > 500/.test(service));
  assert.ok(methods.includes('setLoginAllowForAdmin(this.userId'));
  assert.ok(methods.includes('setLoginIdentityForAdmin(this.userId'));
  assert.ok(modern.includes("Meteor.call('setAdminLoginAllow'"));
  assert.ok(modern.includes("Meteor.call('setAdminLoginIdentity'"));
  assert.ok(route.includes('setLoginAllowForAdmin(session.userId'));
  assert.ok(route.includes('setLoginIdentityForAdmin(session.userId'));
});

test('direct writes cannot bypass the shared login policy service', () => {
  for (const field of ['disableForgotPassword', 'disableRegistration',
    'displayAuthenticationMethod', 'defaultAuthenticationMethod', 'oidcBtnText']) {
    assert.ok(settingsPermission.includes(`'${field}'`));
  }
  assert.ok(accountPermission.includes("'accounts-allowUserNameChange'"));
  assert.ok(accountPermission.includes("'accounts-allowUserDelete'"));
  assert.ok(accountPermission.includes("bleed: 'LoginSettingsBleed'"));
});

test('HTML4 retains all allow, identity and invitation operations', () => {
  assert.ok(/path !== '\/admin\/people\/login'/.test(pages));
  for (const key of ['forgotPassword', 'registration', 'usernameChange', 'userDelete',
    'displayAuthenticationMethod']) assert.ok(pages.includes(key));
  for (const operation of ['set-login-allow', 'save-login-identity',
    'send-login-invitations']) assert.ok(pages.includes(operation) && route.includes(operation));
  assert.ok(/type: 'select', name: 'defaultAuthenticationMethod'/.test(pages));
  assert.ok(/type: 'textarea', name: 'invitationEmails'/.test(pages));
  assert.ok(/members: \{ \$elemMatch:/.test(pages));
  assert.ok(/members: \{ \$elemMatch:/.test(modern));
});

test('Meteor and HTML4 invitations share one explicit-actor operation', () => {
  assert.ok(settingsModel.includes('export async function sendInvitationsForUser'));
  assert.ok(settingsModel.includes('return sendInvitationsForUser(this.userId, emails, boards,'));
  assert.ok(route.includes('sendInvitationsForUser(session.userId'));
  assert.ok(/emails\.length > 100 \|\| boards\.length > 500/.test(settingsModel));
});

console.log(`\nlegacyHtml4AdminPeopleLogin: ${passed} tests passed`);
