'use strict';

// Guard: avatars show on a sub-path install, and lazily loaded code is fetched
// from the page's own origin.
// Run: node tests/avatarDisplayUrl.test.cjs
//
// On Univention (UCS) WeKan is served at /wekan. After an upgrade every avatar
// was an empty circle: profile.avatarUrl held /cdn/storage/avatars/<id>, the
// browser asked the UCS web server for that path outside WeKan, and got 404 -
// while Change Avatar, which builds its own link, showed the picture. In the
// same session the browser, at https://127.0.0.1:8443/wekan, fetched lazily
// loaded code from ROOT_URL's host ucs-2275.wekan.intranet, which it could not
// resolve. models/lib/avatarDisplayUrl.js and models/lib/dynamicImportOrigin.js.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { avatarDisplayUrl } = require('../models/lib/avatarDisplayUrl');
const { applyDynamicImportOrigin } = require('../models/lib/dynamicImportOrigin');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('avatarDisplayUrl:');

test('every stored shape of a WeKan avatar is drawn under the current path', () => {
  const want = '/wekan/cdn/storage/avatars/5NJ2pbKi8y6fbYKSW';
  for (const stored of [
    '/cdn/storage/avatars/5NJ2pbKi8y6fbYKSW',                      // what Change Avatar stores
    '/wekan/cdn/storage/avatars/5NJ2pbKi8y6fbYKSW',                // already prefixed
    'https://ucs-2275.wekan.intranet/wekan/cdn/storage/avatars/5NJ2pbKi8y6fbYKSW', // old ROOT_URL
    'http://old:3000/cdn/storage/avatars/5NJ2pbKi8y6fbYKSW?auth=false', // old host, old query
    '/kanban/cdn/storage/avatars/5NJ2pbKi8y6fbYKSW',               // a prefix WeKan had before
  ]) {
    assert.strictEqual(avatarDisplayUrl(stored, '/wekan'), want, stored);
    assert.strictEqual(avatarDisplayUrl(stored, '/wekan/'), want, `${stored} with a trailing slash prefix`);
  }
  assert.strictEqual(avatarDisplayUrl('/cfs/files/avatars/old1', '/wekan'), '/wekan/cfs/files/avatars/old1',
    'a CollectionFS avatar keeps its own route, which still serves it');
  assert.strictEqual(avatarDisplayUrl('/cdn/storage/avatars/id-original-me.png', '/wekan'),
    '/wekan/cdn/storage/avatars/id-original-me.png');
});

test('at the root of a host, the stored prefix is dropped and none is added', () => {
  assert.strictEqual(avatarDisplayUrl('/wekan/cdn/storage/avatars/a1', ''), '/cdn/storage/avatars/a1');
  assert.strictEqual(avatarDisplayUrl('https://x.example/cdn/storage/avatars/a1', undefined), '/cdn/storage/avatars/a1');
});

// Negative: what is not WeKan's avatar is not rewritten.
test('an external picture, a data: URL and an empty value are left alone', () => {
  for (const stored of [
    'https://www.gravatar.com/avatar/abc',
    'data:image/png;base64,iVBORw0KGgo=',
    'https://proxy.example/fetch?u=/cdn/storage/avatars/x',  // only in a query string
    '/avatar-default/u1',
  ]) {
    assert.strictEqual(avatarDisplayUrl(stored, '/wekan'), stored, stored);
  }
  assert.strictEqual(avatarDisplayUrl('', '/wekan'), '');
  assert.strictEqual(avatarDisplayUrl(null, '/wekan'), '');
});

test('the avatar, the people page and the report tables all draw through avatarSrc', () => {
  const avatar = read('client/components/users/userAvatar.js');
  assert.match(avatar, /avatarDisplayUrl\(stored, \(cfg && cfg\.ROOT_URL_PATH_PREFIX\) \|\| ''\)/);
  assert.match(avatar, /Template\.registerHelper\('avatarSrc'/);
  assert.match(avatar, /const base = avatarSrc\(\(user && user\.profile && user\.profile\.avatarUrl\) \|\| ''\);/,
    'the userAvatar helper resolves the stored URL');
  assert.match(avatar, /return `\$\{prefix\}\/avatar-default\//, 'the default avatar is under the prefix too');
});

// Negative, tree-wide: no template draws a stored avatar URL as it is stored.
test('no template puts a stored avatar URL in src without avatarSrc', () => {
  const files = execFileSync('git', ['ls-files', 'client', '*.jade', '*.html'], { cwd: ROOT })
    .toString().split('\n').filter((f) => /^client\/.*\.(jade|html)$/.test(f));
  const bad = [];
  for (const file of files) {
    read(file).split('\n').forEach((line, i) => {
      // profile.avatarUrl, or a table's avatarUrl / userAvatarUrl, straight into src.
      if (/src="\{\{\s*(?:[\w.]*profile\.avatarUrl|avatarUrl|userAvatarUrl)\s*\}\}"/.test(line)
        && !/client\/components\/users\/userAvatar\.jade$/.test(file)) {
        bad.push(`${file}:${i + 1}`);
      }
    });
  }
  // userAvatar.jade's {{avatarUrl}} is the helper that already resolves it.
  assert.match(read('client/components/users/userAvatar.jade'), /src="\{\{avatarUrl\}\}"/);
  assert.deepStrictEqual(bad, [], 'render these through {{avatarSrc ...}}');
});

test('lazily loaded code is fetched from the page origin, unless an admin said otherwise', () => {
  assert.deepStrictEqual(applyDynamicImportOrigin({}), { packages: { 'dynamic-import': { useLocationOrigin: true } } });
  const kept = applyDynamicImportOrigin({ packages: { 'dynamic-import': { useLocationOrigin: false, x: 1 } }, other: 2 });
  assert.deepStrictEqual(kept, { packages: { 'dynamic-import': { useLocationOrigin: false, x: 1 } }, other: 2 },
    'an explicit METEOR_SETTINGS value, false included, wins');
  const same = { cardsLoading: 'auto' };
  assert.strictEqual(applyDynamicImportOrigin(same), same, 'the object Meteor sends to the browser is changed in place');
  const server = read('server/dynamicImportOrigin.js');
  assert.match(server, /applyDynamicImportOrigin\(Meteor\.settings\.public\)/);
  assert.match(read('server/imports.js'), /^import '\/server\/dynamicImportOrigin';$/m, 'and it is loaded');
});

console.log(`\navatarDisplayUrl: ${passed} passed`);
