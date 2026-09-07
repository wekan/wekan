'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const service = read('server/lib/problemFeatureSettings.js');
const method = read('server/methods/problemFeatureSettings.js');
const client = read('client/components/settings/adminProblems.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const legacy = read('server/legacyHtml4.js');

console.log('legacyHtml4AdminNotifications:');
for (const field of ['disableActivities', 'disableNotifications', 'disableWatch']) {
  assert.ok(service.includes(`'${field}'`), `${field} must be allowlisted`);
  assert.ok(pages.includes(`'${field}'`), `${field} must render in HTML4`);
}
assert.match(service, /notifications: NOTIFICATION_FEATURE_FIELDS/);
assert.match(service, /notificationFeatureSettingsForAdmin/);
assert.match(service, /!allowed \|\| !allowed\.includes\(field\)/);
assert.match(method,
  /setProblemFeatureSettingForAdmin\(this\.userId, pane, field, enabled\)/);
assert.match(client, /notificationFields\.includes\(field\) \? 'notifications' : 'security'/);
assert.match(legacy, /path === '\/admin\/problems\/notifications'/);
assert.match(legacy, /'notifications',\s*String\(requestFields\.settingField/);
assert.match(pages, /legacyOperation: 'set-notification-feature'/);
assert.match(pages, /error-notAuthorized/);
console.log('  ok - pane-specific allowlist backs Jade and labelled HTML4 controls');
