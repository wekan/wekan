'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relative => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');
const service = read('server/lib/adminAccessibility.js');
const methods = read('server/methods/adminAccessibility.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const client = read('client/components/settings/settingBody.js');
const jade = read('client/components/settings/settingBody.jade');
const components = read('imports/lib/uiComponentLibrary.js');
const renderer = read('imports/lib/legacyHtml4.js');
const announcementPermission = read('server/permissions/announcements.js');
const accessibilityPermission = read('server/permissions/accessibilitySettings.js');

console.log('legacyHtml4AdminAccessibility:');
assert.match(service, /fields: \{ isAdmin: 1, username: 1 \}/);
assert.match(service, /check\(enabled, Boolean\)/);
assert.match(service, /title\.length > 500 \|\| body\.length > 10000/);
assert.match(service, /bleed: 'SettingsBleed'/,
  'unauthorized writes are Security-reported');
assert.match(methods, /setAccessibilityEnabledForAdmin\(this\.userId, enabled\)/);
assert.match(methods, /setAccessibilityContentForAdmin\(this\.userId, title, body\)/);

const clientBody = client.slice(client.indexOf('Template.accessibilitySettings'),
  client.indexOf('Template.selectAuthenticationMethod'));
assert.match(clientBody, /Meteor\.callAsync\('setAdminAccessibilityEnabled'/);
assert.match(clientBody, /Meteor\.callAsync\('setAdminAccessibilityContent'/);
assert.doesNotMatch(clientBody, /AccessibilitySettings\.update/,
  'Jade cannot bypass the common service');
for (const permission of [announcementPermission, accessibilityPermission]) {
  assert.match(permission, /update\(\) \{\s*return false;/,
    'direct DDP collection updates are denied');
}

const at = pages.indexOf('async function adminSettingsAccessibilityPage');
assert.ok(at >= 0, 'the dedicated HTML4 controller exists');
const body = pages.slice(at, at + 4500);
for (const key of ['accessibility', 'accessibility-page-enabled',
  'accessibility-title', 'accessibility-content']) {
  assert.ok(body.includes(`'${key}'`), `${key} renders in HTML4`);
  assert.ok(jade.includes(`'${key}'`), `${key} renders in HTML5`);
}
assert.match(body, /accessibilityForAdmin\(userId\)/);
assert.match(body, /uiTextareaGroupForm\(/,
  'title and body submit atomically like Jade');
assert.match(route, /setAccessibilityEnabledForAdmin\(/);
assert.match(route, /setAccessibilityContentForAdmin\(/);
assert.match(components, /function uiTextareaGroupForm/);
assert.match(renderer, /cell\.component === 'textarea-group'/);
assert.match(renderer, /<fieldset><legend>/,
  'the grouped editor is semantically labelled');
console.log('  ok - shared Accessibility reads, writes and grouped component');
