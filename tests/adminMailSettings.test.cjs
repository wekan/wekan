'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

console.log('adminMailSettings:');

const model = read('server/models/settings.js');
const serviceSource = read('server/lib/adminEmailSettings.js');
const schema = read('models/settings.js');
const publication = read('server/publications/settings.js');
const client = read('client/components/settings/settingBody.js');
const template = read('client/components/settings/settingBody.jade');

assert.ok(/async saveAdminMailSettings\(input\)/.test(model));
assert.ok(/requireGlobalAdmin[\s\S]*if \(user\?\.isAdmin\)/.test(serviceSource),
  'saving is admin-only');
assert.ok(/if \(password\)/.test(serviceSource),
  'blank password preserves the stored secret');
for (const field of ['enabled', 'service', 'configurations', 'passwords', 'passwordSet']) {
  assert.ok(schema.includes(`'mailServer.${field}'`),
    `Settings schema retains mailServer.${field}`);
}
assert.ok(!/['"]mailServer\.(?:password|passwords)['"]\s*:/.test(publication),
  'passwords are not published to the browser');
assert.ok(/mailServer\.passwordSet/.test(publication), 'only secret presence is published');
assert.ok(/Enable below email settings/.test(template));
assert.ok(/#mail-service/.test(template));
assert.ok(/autocomplete="new-password"/.test(template));
assert.ok(/'click button\.mail-settings-save'/.test(client));
assert.ok(/Meteor\.call\('saveAdminMailSettings'/.test(client));
const emailOwner = client.slice(client.indexOf('Template.email.onCreated'),
  client.indexOf('Template.email.events'));
assert.ok(/this\.subscribe\('mailServer'\)/.test(emailOwner),
  'the Email pane owns its secret-safe subscription wherever it is rendered');

const deploymentExamples = [
  'docker-compose.yml',
  'docker-compose-mongodb-v7.yml',
  'docker-compose-ferretdb-v2-postgresql.yml',
  'docker-compose-ferretdb-v1-postgresql.yml',
  'docker-compose-ferretdb-v1-mysql.yml',
  'docker-compose-ferretdb-v1-mariadb.yml',
  'docker-compose-ferretdb-v1-sap-hana.yml',
  'docs/Databases/ToroDB/PostgreSQL/docker-compose.yml',
  'start-wekan.sh',
  'start-wekan.bat',
  'releases/virtualbox/start-wekan.sh',
  'snap-src/bin/wekan-help',
];
for (const file of deploymentExamples) {
  const example = read(file);
  const advice = example.indexOf('Admin Panel / People / Email');
  const mailUrl = example.indexOf('MAIL_URL') === -1
    ? example.indexOf('mail-url:')
    : example.indexOf('MAIL_URL');
  assert.ok(advice !== -1 && mailUrl !== -1 && advice < mailUrl,
    `${file} explains the Admin Panel Email checkbox before MAIL_URL`);
  assert.ok(example.includes('additional email sending options'),
    `${file} says that the checkbox reveals additional sending options`);
}

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
