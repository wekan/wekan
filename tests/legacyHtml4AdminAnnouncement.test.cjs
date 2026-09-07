'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relative => fs.readFileSync(path.resolve(__dirname, '..', relative), 'utf8');
const service = read('server/lib/adminAnnouncement.js');
const method = read('server/methods/adminAnnouncement.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');
const client = read('client/components/settings/settingBody.js');
const jade = read('client/components/settings/settingBody.jade');

console.log('legacyHtml4AdminAnnouncement:');
assert.match(service, /Meteor\.users\.findOneAsync\(userId/,
  'the service reloads the actor');
assert.match(service, /fields: \{ isAdmin: 1, username: 1 \}/);
assert.match(service, /field !== 'enabled' && field !== 'body'/,
  'only the two pane fields are writable');
assert.match(service, /check\(value, Boolean\)/);
assert.match(service, /value\.length > 10000/,
  'announcement text is bounded on the server');
assert.match(service, /bleed: 'SettingsBleed'/,
  'forged writes are reported to Problems / Security');
assert.match(method, /setAnnouncementFieldForAdmin\(this\.userId, field, value\)/);
assert.match(client, /Meteor\.callAsync\('setAdminAnnouncement', 'enabled'/,
  'Jade uses the shared service for the switch');
assert.match(client, /Meteor\.callAsync\('setAdminAnnouncement', 'body'/,
  'Jade uses the shared service for text');
assert.doesNotMatch(client.slice(client.indexOf('Template.announcementSettings'),
  client.indexOf('Template.accessibilitySettings')), /Announcements\.updateAsync/,
  'the pane has no direct client write left');

const at = pages.indexOf('async function adminSettingsAnnouncementPage');
assert.ok(at >= 0, 'the dedicated HTML4 controller exists');
const body = pages.slice(at, at + 3600);
for (const key of ['admin-announcement-active', 'admin-announcement-title']) {
  assert.ok(body.includes(`'${key}'`), `${key} renders in HTML4`);
  assert.ok(jade.includes(`'${key}'`), `${key} renders in HTML5`);
}
assert.ok(body.includes("'admin-announcement'"),
  'the HTML4 pane uses the shared Announcement title key');
assert.match(body, /announcementForAdmin\(userId\)/);
assert.match(body, /uiSelectForm\(/);
assert.match(body, /uiTextareaForm\(/);
assert.match(route, /setAnnouncementFieldForAdmin\(/);
assert.match(route, /requestFields\.enabled !== 'true'/,
  'HTML4 rejects non-Boolean select values before the service call');
console.log('  ok - shared, bounded and reported Announcement operations');
