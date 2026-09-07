'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/adminEmailSettings.js');
const model = read('server/models/settings.js');
const method = read('server/methods/adminEmailSettings.js');
const publication = read('server/publications/settings.js');
const settingsPermission = read('server/permissions/settings.js');
const accountPermission = read('server/permissions/accountSettings.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const renderer = read('imports/lib/legacyHtml4.js');
const modern = read('client/components/settings/settingBody.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeopleEmail:');

test('both renderers share one secret-safe Global Admin mail service', () => {
  assert.ok(/requireGlobalAdmin[\s\S]*?isAdmin[\s\S]*?MailSettingsBleed/.test(service));
  assert.ok(model.includes('check(input, Object)'));
  assert.ok(model.includes('return await saveMailTransportForAdmin(this.userId, input)'));
  assert.ok(model.includes('return await sendSmtpTestForAdmin(this.userId)'));
  assert.ok(method.includes('saveEmailAccessForAdmin(this.userId'));
  assert.ok(route.includes('saveMailTransportForAdmin(session.userId'));
  assert.ok(route.includes('saveEmailAccessForAdmin(session.userId'));
  assert.ok(route.includes('sendSmtpTestForAdmin(session.userId'));
  assert.ok(!/['"]mailServer\.(?:password|passwords)['"]\s*:/.test(publication));
  assert.ok(!/passwords/.test(service.slice(service.indexOf('function safeConfiguration'),
    service.indexOf('export async function emailSettingsForAdmin'))));
});

test('mail inputs are bounded, services fixed and blank password preserves secret', () => {
  assert.ok(service.includes('isSupportedMailService(service)'));
  assert.ok(/password\.length > 10000/.test(service));
  assert.ok(/if \(password\)[\s\S]*mailServer\.passwords/.test(service));
  assert.ok(/mailDomainName\.length > 500/.test(service));
  assert.ok(/type = \['email', 'password', 'text'\]/.test(renderer));
  assert.ok(/autocomplete/.test(renderer));
});

test('HTML4 retains transport, test-mail and account-access operations', () => {
  assert.ok(/path !== '\/admin\/people\/email'/.test(pages));
  for (const operation of ['save-mail-transport', 'save-email-access',
    'send-smtp-test-email']) assert.ok(pages.includes(operation) && route.includes(operation));
  for (const field of ['mailService', 'mailHost', 'mailPort', 'mailSecure',
    'mailUsername', 'mailPassword', 'mailFrom', 'mailDomainName', 'allowEmailChange']) {
    assert.ok(pages.includes(field), `missing ${field}`);
  }
  assert.ok(/type: 'password'/.test(pages));
  assert.ok(/HTML4 has no client-side rerender[\s\S]*inputs\.push\([\s\S]*mailHost/.test(pages));
});

test('direct DDP cannot bypass either email settings service', () => {
  assert.ok(settingsPermission.includes("'mailServer'"));
  assert.ok(settingsPermission.includes("'mailDomainName'"));
  assert.ok(accountPermission.includes("'accounts-allowEmailChange'"));
  assert.ok(accountPermission.includes("bleed: 'LoginSettingsBleed'"));
  assert.ok(modern.includes("Meteor.call('saveAdminEmailAccess'"));
  assert.ok(!/AccountSettings\.update\('accounts-allowEmailChange'/.test(modern));
});

console.log(`\nlegacyHtml4AdminPeopleEmail: ${passed} tests passed`);
