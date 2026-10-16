'use strict';

// Every `snap set wekan <key>=...` in the documentation must name a key the
// snap actually has: a KEY_* value in snap-src/bin/config, or a key a snap
// script reads itself with `snapctl get`. snapd accepts any key, so a
// misspelt one is stored without a word and changes nothing. The docs had
// `MONGO_OPLOG_URL` (the environment name, not the snap key
// `mongo-oplog-url`), `oauth-enabled` (it is `oauth2-enabled`) and
// `snap set wekan set disable-mongodb`.
//
// Run: node tests/docsSnapKeysExist.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const keys = new Set([...read('snap-src/bin/config').matchAll(/^KEY_\w+="([^"]+)"/gm)].map(m => m[1]));
for (const dir of ['snap-src/bin', 'snap/hooks']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    const full = path.join(abs, f);
    if (!fs.statSync(full).isFile()) continue;
    for (const m of fs.readFileSync(full, 'utf8').matchAll(/snapctl get ([a-z0-9-]+)/g)) keys.add(m[1]);
  }
}

// Released changelogs are records and are not rewritten.
const docs = execFileSync('git', ['ls-files', '*.md', ':!old-CHANGELOG', ':!CHANGELOG.md'],
  { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

const uses = [];
for (const file of docs) {
  read(file).split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/snap (?:un)?set (?:wekan|\$SNAP_NAME|\$SNAP_INSTANCE_NAME) ([A-Za-z0-9_-]+)/g)) {
      uses.push({ key: m[1], where: `${file}:${i + 1}` });
    }
  });
}

console.log('docsSnapKeysExist:');

test('the snap has its keys and the docs use them', () => {
  assert.ok(keys.size > 200, `found only ${keys.size} snap keys`);
  assert.ok(uses.length > 200, `found only ${uses.length} snap set lines`);
  assert.ok(keys.has('mongo-oplog-url') && keys.has('oauth2-enabled') && keys.has('disable-mongodb'));
});

test('every snap set in the docs names a real snap key (negative)', () => {
  const unknown = uses.filter(u => !keys.has(u.key)).map(u => `${u.where}: ${u.key}`);
  assert.deepStrictEqual(unknown, [], 'snapd stores these silently and WeKan never reads them');
});

console.log(`\ndocsSnapKeysExist: ${passed} tests passed`);
