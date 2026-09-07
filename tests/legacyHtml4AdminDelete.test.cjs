'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const pages = read('server/lib/legacyHtml4Pages.js');
const legacy = read('server/legacyHtml4.js');
const service = read('server/lib/permanentDeleteSetting.js');
const server = read('server/models/settings.js');
const client = read('client/components/settings/adminProblems.js');

console.log('legacyHtml4AdminDelete:');
assert.match(service, /permanentDeleteSettingForAdmin\(userId\)/);
assert.match(service, /setPermanentDeleteEnabledForAdmin/);
assert.match(service, /fields: \{ isAdmin: 1/);
assert.match(service, /recordRecoveryAudit\(\{/);
assert.match(service, /done: true/);
assert.match(service, /done: false/);
assert.match(server,
  /setPermanentDeleteEnabledForAdmin\(this\.userId, enabled, this\.connection\)/);
assert.match(client, /Meteor\.call\('setPermanentDeleteEnabled'/);
assert.match(legacy, /setPermanentDeleteEnabledForAdmin\(/);
assert.match(legacy, /httpHeaders: req\.headers/);
assert.match(pages, /path !== '\/admin\/problems\/delete'/);
assert.match(pages, /legacyOperation: 'set-permanent-delete'/);
assert.match(pages, /PERMANENT_DELETE_RECOVERY_DESCRIPTION/);
assert.match(pages, /error-notAuthorized/);
console.log('  ok - one audited service backs labelled HTML4 and Jade controls');
