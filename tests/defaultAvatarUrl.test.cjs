'use strict';
// #824: DEFAULT_AVATAR_URL, a general avatar for users who have not set one,
// configured only in the environment as the maintainer asked: an intranet
// server (http://192.168.1.200/avatars/{username}.png) or a Gravatar-style
// service. models/lib/defaultAvatarUrl.js builds the URL; server/defaultAvatar.js
// redirects the browser to it; the avatar shows it only for a user with no
// avatar of their own, and the initials when the image does not load.
//
// Run: node tests/defaultAvatarUrl.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { defaultAvatarUrl } = require('../models/lib/defaultAvatarUrl');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('defaultAvatarUrl:');

const user = { _id: 'u1', username: 'anna.k', emails: [{ address: ' Anna@Example.COM ' }] };

test('the template is filled with the username, id and email hashes, URL-encoded', () => {
  assert.equal(defaultAvatarUrl('http://192.168.1.200/avatars/{username}.png', user), 'http://192.168.1.200/avatars/anna.k.png');
  assert.equal(defaultAvatarUrl('https://intranet.example/a?id={userId}', user), 'https://intranet.example/a?id=u1');
  const md5 = createHash('md5').update('anna@example.com').digest('hex');
  assert.equal(defaultAvatarUrl('https://gravatar.example/avatar/{emailMd5}?d=404', user), `https://gravatar.example/avatar/${md5}?d=404`);
  assert.match(defaultAvatarUrl('https://g.example/{emailSha256}', user), /^https:\/\/g\.example\/[0-9a-f]{64}$/);
  assert.equal(defaultAvatarUrl('https://x.example/{username}.png', { _id: 'u', username: 'a/b c?' }), 'https://x.example/a%2Fb%20c%3F.png',
    'a username cannot change the path or add a query');
});

test('negative: no template, a non-http template, or a missing value gives no avatar', () => {
  for (const template of [undefined, '', '   ', 'javascript:alert(1)//{username}', 'data:image/png;base64,{username}', '/avatars/{username}.png', 'ftp://x/{username}']) {
    assert.equal(defaultAvatarUrl(template, user), null, String(template));
  }
  assert.equal(defaultAvatarUrl('https://x.example/{emailMd5}', { _id: 'u', username: 'x' }), null, 'no email, no hash');
  assert.equal(defaultAvatarUrl('https://x.example/{username}', { _id: 'u' }), null);
  assert.equal(defaultAvatarUrl('https://x.example/{username}', null), null);
  assert.equal(defaultAvatarUrl('https://x.example/{unknown}/{username}', user), 'https://x.example/{unknown}/anna.k', 'unknown names stay as written');
});

test('environment only: no Admin Panel field, and listed on every platform', () => {
  for (const rel of ['client/components/settings/settingBody.jade', 'models/settings.js']) {
    assert.ok(!read(rel).includes('DEFAULT_AVATAR_URL') && !/defaultAvatarUrl/.test(read(rel)), rel);
  }
  for (const rel of ['Dockerfile', 'snap-src/bin/config', 'start-wekan.sh', 'start-wekan.bat', 'docker-compose.yml']) {
    assert.ok(read(rel).includes('DEFAULT_AVATAR_URL'), rel);
  }
});

test('the server redirects without fetching, and the avatar falls back to initials', () => {
  const server = read('server/defaultAvatar.js');
  assert.match(server, /res\.writeHead\(302, \{ Location: target/);
  assert.doesNotMatch(server, /fetch\(|https?\.get\(|request\(/, 'nothing is fetched by the server');
  assert.match(read('server/imports.js'), /^import '\/server\/defaultAvatar';$/m);
  const jade = read('client/components/users/userAvatar.jade');
  const own = jade.indexOf('if userData.profile.avatarUrl'), fallback = jade.indexOf('else if defaultAvatarUrl');
  assert.ok(own !== -1 && fallback > own, 'only when the user has no avatar of their own');
  assert.match(read('client/components/users/userAvatar.js'), /'error img\.js-default-avatar'/);
});

console.log(`\ndefaultAvatarUrl: ${passed} tests passed`);
