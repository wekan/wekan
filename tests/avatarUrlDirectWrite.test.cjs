'use strict';
// setAvatarUrl refuses javascript:, file:, data:text/html and the rest, but the
// Users allow rule permits every profile.* field, so a direct client
// Users.update({$set: {'profile.avatarUrl': ...}}) stored what the method
// refuses. models/lib/avatarUrlScheme.js is now the one rule for both, and the
// Users deny rule applies it to the client write.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { isStorableAvatarUrl, writesUnsafeAvatarUrl } = require('../models/lib/avatarUrlScheme');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('accepted avatar URLs: empty, local path, http(s), data:image', () => {
  for (const url of ['', '/cdn/storage/avatars/abc', 'https://example.com/a.png',
    'HTTP://example.com/a.png', 'data:image/png;base64,AAAA']) {
    assert.equal(isStorableAvatarUrl(url), true, url);
  }
});

test('negative: refused avatar URLs: active and foreign schemes', () => {
  for (const url of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<script>',
    'file:///etc/passwd', '//evil.example/a.png', 'ftp://host/a.png', 'gopher://x',
    'vbscript:x', 'no-scheme.png', null, undefined, 42, {}]) {
    assert.equal(isStorableAvatarUrl(url), false, String(url));
  }
});

test('a client write of a safe avatar URL, or clearing it, is allowed', () => {
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.avatarUrl': 'https://example.com/a.png' } }), false);
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.avatarUrl': '' } }), false);
  assert.equal(writesUnsafeAvatarUrl({ $unset: { 'profile.avatarUrl': '' } }), false);
  assert.equal(writesUnsafeAvatarUrl({ $set: { profile: { fullname: 'A', avatarUrl: '/cdn/x' } } }), false);
  assert.equal(writesUnsafeAvatarUrl({ $set: { profile: { fullname: 'A' } } }), false);
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.fullname': 'javascript:' } }), false,
    'another profile field is not the avatar');
  assert.equal(writesUnsafeAvatarUrl(null), false);
});

test('negative: every way to store a refused avatar URL directly is denied', () => {
  const bad = 'javascript:alert(document.cookie)';
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.avatarUrl': bad } }), true);
  assert.equal(writesUnsafeAvatarUrl({ $setOnInsert: { 'profile.avatarUrl': bad } }), true);
  assert.equal(writesUnsafeAvatarUrl({ $set: { profile: { avatarUrl: bad } } }), true);
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.avatarUrl': { $gt: '' } } }), true, 'not a string');
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.avatarUrl.x': 'https://a' } }), true);
  assert.equal(writesUnsafeAvatarUrl({ $rename: { 'profile.fullname': 'profile.avatarUrl' } }), true);
  assert.equal(writesUnsafeAvatarUrl({ $push: { 'profile.avatarUrl': 'https://a' } }), true);
  assert.equal(writesUnsafeAvatarUrl({ $set: { 'profile.avatarUrl': 'file:///etc/passwd' } }), true);
});

test('the Users deny rule applies it and logs the attempt to Admin Panel / Problems', () => {
  const rule = read('server/permissions/users.js');
  const deny = rule.slice(rule.indexOf('Users.deny({'));
  assert.match(deny, /if \(writesUnsafeAvatarUrl\(modifier\)\) \{[\s\S]*?key: 'file\.avatar-url', action: 'blocked'[\s\S]*?catch \(e\) \{ \/\* logging must never break the guard \*\/ \}[\s\S]*?return true;/);
  assert.match(read('models/lib/securityCategories.js'), /'file\.avatar-url':/);
});

test('both avatar methods use the same rule as the deny rule', () => {
  const methods = read('server/models/users.js');
  assert.match(methods, /function assertSafeAvatarUrl\(avatarUrl\) \{\s*const \{ isStorableAvatarUrl, avatarUrlScheme \} = require\('\/models\/lib\/avatarUrlScheme'\);/);
  for (const name of ['setAvatarUrl', 'adminSetAvatarUrl']) {
    const start = methods.indexOf(`async ${name}(`);
    assert.ok(start > 0, `${name} exists`);
    const body = methods.slice(start, methods.indexOf('\n  },', start));
    assert.match(body, /assertSafeAvatarUrl\(avatarUrl\);/, `${name} validates the URL`);
  }
});

test('negative: no client code writes profile.avatarUrl directly, so the deny breaks nothing', () => {
  const offenders = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.js$/.test(entry.name)) {
        const src = read(rel);
        if (/(update|updateAsync)\([^)]*['"]profile\.avatarUrl['"]/.test(src) ||
            /\$set:\s*\{\s*['"]profile\.avatarUrl['"]/.test(src)) offenders.push(rel);
      }
    }
  };
  walk('client');
  assert.deepEqual(offenders, [], 'the client sets an avatar only through Meteor.call(setAvatarUrl)');
});
