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

console.log('legacyHtml4AdminSecurity:');

assert.match(service, /export const SECURITY_FEATURE_FIELDS = Object\.freeze\(\[/);
for (const field of ['renderLinksAsPlainText', 'alwaysShowCodeAsText',
  'disableAllImport', 'disableAllExport', 'disableImportAvatars',
  'disableExportAvatars', 'anonymizeImportUsers', 'anonymizeExportUsers']) {
  assert.ok(service.includes(`'${field}'`), `${field} must be allowlisted`);
  assert.ok(pages.includes(`'${field}'`), `${field} must render in HTML4`);
}
assert.match(service, /fields: \{ isAdmin: 1, username: 1 \}/);
assert.match(service, /SECURITY_FEATURE_FIELD_SET\.has\(field\)/);
assert.match(service, /check\(enabled, Boolean\)/);
assert.match(service, /Settings\.updateAsync\(setting\._id, \{ \$set: \{ \[field\]: enabled \} \}\)/);
assert.match(service, /bleed: 'SettingsBleed'/);
assert.match(service, /non-allowlisted feature setting/);
assert.match(method, /setSecurityFeatureSettingForAdmin\(this\.userId, field, enabled\)/);
assert.match(client, /Meteor\.call\('setSecurityFeatureSetting', field, !setting\[field\]/);
assert.doesNotMatch(client, /Settings\.update\(setting\._id, \{ \$set: \{ \[field\]/);
assert.match(legacy, /setSecurityFeatureSettingForAdmin\(/);
assert.match(legacy, /requestFields\.enabled !== 'true'/);
assert.match(pages, /legacyOperation: 'set-security-feature'/);
assert.match(pages, /error-notAuthorized/);

console.log('  ok - shared allowlisted mutation, reporting and semantic HTML4 controls');
