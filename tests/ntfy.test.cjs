'use strict';

// #5148: ntfy as a notification channel, per user, through the SSRF guard.
// Run: node tests/ntfy.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseTopicUrl, cleanNtfySettings, ntfyRequest } = require('../models/lib/ntfy.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Positive.
assert.deepEqual(parseTopicUrl('https://ntfy.sh/my-secret_topic1'), { base: 'https://ntfy.sh/', topic: 'my-secret_topic1' });
assert.deepEqual(parseTopicUrl('https://push.example.com/ntfy/team'), { base: 'https://push.example.com/ntfy/', topic: 'team' });
const s = cleanNtfySettings({ enabled: true, url: 'https://ntfy.sh/abc', token: 'tk_123' }).value;
assert.deepEqual(s, { enabled: true, url: 'https://ntfy.sh/abc', token: 'tk_123' });
const r = ntfyRequest(s, { title: 'Board "Ä" — card\nnew', message: 'alice moved card', click: 'https://wekan.example/b/x' });
assert.equal(r.url, 'https://ntfy.sh/');
assert.deepEqual(r.headers, { 'Content-Type': 'application/json', Authorization: 'Bearer tk_123' });
assert.deepEqual(JSON.parse(r.body), { topic: 'abc', message: 'alice moved card', title: 'Board "Ä" — card new', click: 'https://wekan.example/b/x' },
  'JSON publishing: any language in the title, no header encoding');
assert.equal(ntfyRequest({ ...s, token: '' }, { message: 'x' }).headers.Authorization, undefined);
console.log('  ok - a topic address becomes ntfy\'s JSON publish request');

// Negative.
for (const bad of ['javascript:alert(1)', 'ftp://ntfy.sh/a', 'https://ntfy.sh/', 'https://u:p@ntfy.sh/a',
  'https://ntfy.sh/a?x=1', 'https://ntfy.sh/a#b', 'https://ntfy.sh/bad topic', 'https://ntfy.sh/' + 'a'.repeat(65)]) {
  assert.equal(parseTopicUrl(bad), null, bad);
  assert.equal(cleanNtfySettings({ enabled: true, url: bad }).error, 'ntfy-invalid-topic-url', bad);
}
assert.equal(cleanNtfySettings({ url: 'https://ntfy.sh/a', token: 'a b' }).error, 'ntfy-invalid-token');
assert.equal(cleanNtfySettings({ url: 'https://ntfy.sh/a', token: 'x\r\nX-Evil: 1' }).error, 'ntfy-invalid-token', 'no header injection');
assert.equal(cleanNtfySettings({ enabled: true, url: '' }).value.enabled, false, 'no address, not on');
assert.equal(cleanNtfySettings({ enabled: 'true', url: 'https://ntfy.sh/a' }).value.enabled, false);
assert.equal(ntfyRequest({ enabled: false, url: 'https://ntfy.sh/a' }, { message: 'x' }), null, 'off sends nothing');
assert.equal(ntfyRequest(undefined, { message: 'x' }), null);
assert.equal(JSON.parse(ntfyRequest(s, { message: 'x', click: 'javascript:alert(1)' }).body).click, undefined);
console.log('  ok - bad addresses, tokens and links refused; off sends nothing');

// Server: the member's own, never published, through the SSRF guard, best effort.
const server = read('server/notifications/ntfy.js');
assert.match(server, /async getNtfySettings\(\) \{\s*if \(!this\.userId\) throw/);
assert.match(server, /async saveNtfySettings\(input\) \{\s*check\(input, Object\);\s*if \(!this\.userId\) throw[\s\S]{0,200}Meteor\.users\.updateAsync\(this\.userId, \{ \$set: \{ ntfy: value \} \}\);/,
  'a member changes only their own');
assert.match(server, /const \{ webhookFetch \} = require\('\/server\/sandstormEgress'\);/);
assert.doesNotMatch(server, /(^|[^A-Za-z])fetch\(/, 'never a bare fetch');
assert.match(server, /redactForRecipient\(params, \{ isBoardAdmin:/, 'admin-only custom field values stay with admins');
assert.match(server, /'ntfy\.enabled': true,\s*\n\s*loginDisabled: \{ \$ne: true \} \}/);
const activities = read('server/models/activities.js');
assert.match(activities, /deliverStoredActivityNotifications\(doc, userId, async \(\) => prepared\)[\s\S]{0,300}require\('\/server\/notifications\/ntfy'\)\.sendActivityToNtfy\(prepared\);/,
  'the same prepared recipients the tray and e-mail get');
const users = read('models/users.js');
assert.match(users, /\n    ntfy: \{[\s\S]{0,400}type: Object,\s*optional: true,\s*blackbox: true,/);
assert.doesNotMatch(users, /USER_UPDATE_ALLOWED_EXACT = \[[^\]]*'ntfy'/, 'not writable from the client');
for (const f of ['server/publications/users.js', 'server/publications/boards.js']) {
  assert.doesNotMatch(read(f), /\bntfy\b/, `${f} never publishes it`);
}
const jade = read('client/components/settings/notificationSettingsPopup.jade');
assert.match(jade, /if isMemberScope\s*\n\s*li\.notification-ntfy-settings/);
assert.match(jade, /input\.js-ntfy-token\(type="password"/);
console.log('  ok - the member\'s own setting, unpublished, sent through the SSRF guard');

console.log('\nntfy: all tests passed');
