'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

console.log('adminMailSettings:');

const model = read('server/models/settings.js');
const publication = read('server/publications/settings.js');
const client = read('client/components/settings/settingBody.js');
const template = read('client/components/settings/settingBody.jade');

assert.ok(/async saveAdminMailSettings\(input\)/.test(model));
assert.ok(/if \(!user\?\.isAdmin\)/.test(model), 'saving is admin-only');
assert.ok(/if \(password\)/.test(model), 'blank password preserves the stored secret');
assert.ok(!/['"]mailServer\.(?:password|passwords)['"]\s*:/.test(publication),
  'passwords are not published to the browser');
assert.ok(/mailServer\.passwordSet/.test(publication), 'only secret presence is published');
assert.ok(/Enable below email settings/.test(template));
assert.ok(/#mail-service/.test(template));
assert.ok(/autocomplete="new-password"/.test(template));
assert.ok(/'click button\.mail-settings-save'/.test(client));
assert.ok(/Meteor\.call\('saveAdminMailSettings'/.test(client));

const { ALL_MAIL_SERVICES, isSupportedMailService, mailServiceStorageKey } =
  require('../models/lib/mailServices');
for (const service of ['SMTP', 'Gmail', 'Outlook365', 'SES', 'SendGrid', 'Mailgun']) {
  assert.ok(ALL_MAIL_SERVICES.includes(service), `${service} is selectable`);
  assert.ok(isSupportedMailService(service));
}
assert.ok(!isSupportedMailService('made-up-service'));
assert.strictEqual(mailServiceStorageKey('Mail.ru'), 'Mail\uff0eru',
  'dots cannot become MongoDB path separators');

console.log('  ok - service form, validation and password boundary');
