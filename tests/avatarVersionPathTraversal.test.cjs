'use strict';

// PathBleed — GHSA-4mxf-m8pq-xc9p, "Avatar versions.path client update enables
// arbitrary file read via board export" (High, CWE-22 / CWE-73), reported by
// Alpastx. https://wekan.fi/hall-of-fame/pathbleed/
//
// Attachments blocked client-supplied `versions.*.path`; avatars did not — their
// allow rule was the single line `update: isOwner`, with no field restriction at
// all. So any authenticated user could point their own avatar's
// `versions.original.path` at, say, /etc/passwd, then export a board they are a
// member of: the exporter read that path off disk and embedded the bytes as
// base64 in `profile.avatarFile`. Arbitrary file read as the WeKan OS user.
//
// Two halves, both tested here: the WRITE is refused (the shared guards, now
// used by avatars as well as attachments) and the READ is refused (the exporter
// only reads paths that resolve inside WeKan's own storage).
//
// Run: node tests/avatarVersionPathTraversal.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const {
  hasUnsafeClientVersionFields,
  touchesVersionFields,
  onlyTouchesAllowedFields,
} = require('../models/lib/fileVersionFields');
const {
  isPathInside,
  isPathInsideAny,
  isPathInsideBase,
} = require('../models/lib/storagePathContainment');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ---------------------------------------------------------------- the write

test('the attack payload is recognised on insert', () => {
  assert.strictEqual(
    hasUnsafeClientVersionFields({
      versions: { original: { path: '/etc/passwd' } },
    }),
    true,
  );
});

test('a storage override is recognised too', () => {
  assert.strictEqual(
    hasUnsafeClientVersionFields({ versions: { original: { storage: 'gridfs' } } }),
    true,
  );
});

test('negative: an ordinary upload is not blocked', () => {
  assert.strictEqual(
    hasUnsafeClientVersionFields({
      name: 'me.png',
      type: 'image/png',
      versions: { original: { size: 1234, type: 'image/png' } },
    }),
    false,
  );
  assert.strictEqual(hasUnsafeClientVersionFields({}), false);
  assert.strictEqual(hasUnsafeClientVersionFields(null), false);
  assert.strictEqual(hasUnsafeClientVersionFields({ versions: 'nonsense' }), false);
});

test('the update form: any field under versions is refused', () => {
  assert.strictEqual(touchesVersionFields(['versions.original.path']), true);
  // The whole sub-object carries the path with it, so naming it is the same attack.
  assert.strictEqual(touchesVersionFields(['versions.original']), true);
  assert.strictEqual(touchesVersionFields(['versions']), true);
  assert.strictEqual(touchesVersionFields(['name', 'versions.original.path']), true);
});

test('negative: renaming an avatar is still allowed', () => {
  assert.strictEqual(touchesVersionFields(['name']), false);
  assert.strictEqual(touchesVersionFields(['meta.boardId', 'type']), false);
  assert.strictEqual(touchesVersionFields([]), false);
  // A field that merely STARTS with the same letters is not the versions subtree.
  assert.strictEqual(touchesVersionFields(['versionsomething']), false);
});

test('the field whitelist compares the part before the first dot', () => {
  const allowed = ['name', 'size', 'type', 'extension', 'extensionWithDot', 'meta'];
  assert.strictEqual(onlyTouchesAllowedFields(['meta.boardId'], allowed), true);
  assert.strictEqual(onlyTouchesAllowedFields(['name', 'size'], allowed), true);
  assert.strictEqual(onlyTouchesAllowedFields(['userId'], allowed), false);
  assert.strictEqual(onlyTouchesAllowedFields(['versions.original.path'], allowed), false);
});

// ----------------------------------------------------------------- the read

const AVATARS = '/data/files/avatars';
const ATTACHMENTS = '/data/files/attachments';

test('a real avatar file is readable', () => {
  assert.strictEqual(isPathInside(`${AVATARS}/abc123.png`, AVATARS), true);
  assert.strictEqual(isPathInsideAny(`${AVATARS}/abc123.png`, [AVATARS, ATTACHMENTS]), true);
});

test('the payload path is NOT readable', () => {
  assert.strictEqual(isPathInside('/etc/passwd', AVATARS), false);
  assert.strictEqual(isPathInsideAny('/etc/passwd', [AVATARS, ATTACHMENTS]), false);
});

test('..-escapes are resolved before comparing, not string-matched', () => {
  assert.strictEqual(isPathInside(`${AVATARS}/../../../etc/passwd`, AVATARS), false);
  assert.strictEqual(isPathInside(`${AVATARS}/../attachments/x.png`, AVATARS), false);
});

test('a sibling directory with the root as a prefix is not inside it', () => {
  assert.strictEqual(isPathInside('/data/files/avatars-evil/x.png', AVATARS), false);
});

test('the storage root itself is not a file to read', () => {
  assert.strictEqual(isPathInside(AVATARS, AVATARS), false);
  // ...though as a BASE it contains itself, which is what the download path
  // has always meant by isPathInside(base, target).
  assert.strictEqual(isPathInsideBase(AVATARS, AVATARS), true);
});

test('negative: empty and non-string paths are refused, never accepted', () => {
  assert.strictEqual(isPathInside('', AVATARS), false);
  assert.strictEqual(isPathInside(null, AVATARS), false);
  assert.strictEqual(isPathInside(undefined, AVATARS), false);
  assert.strictEqual(isPathInside(`${AVATARS}/x.png`, ''), false);
  assert.strictEqual(isPathInsideAny(`${AVATARS}/x.png`, null), false);
  assert.strictEqual(isPathInsideAny(`${AVATARS}/x.png`, []), false);
});

// -------------------------------------------------------------- the sources

test('the avatar allow rule no longer says just `update: isOwner`', () => {
  const avatars = read('server/permissions/avatars.js');
  assert.ok(
    !/^\s*update:\s*isOwner\s*,/m.test(avatars),
    'the unrestricted `update: isOwner` is what the advisory exploited',
  );
  assert.ok(/touchesVersionFields\(fields\)/.test(avatars), 'update checks the versions subtree');
  assert.ok(/hasUnsafeClientVersionFields\(doc\)/.test(avatars), 'insert checks the payload');
  assert.ok(/onlyTouchesAllowedFields\(/.test(avatars), 'update has a field whitelist');
  assert.ok(/isOwner\(userId, doc\)/.test(avatars), 'and being the owner is still required');
});

test('both permission files import the guards from ONE module', () => {
  const avatars = read('server/permissions/avatars.js');
  const attachments = read('server/permissions/attachments.js');
  const importRe = /from '\/models\/lib\/fileVersionFields'/;
  assert.ok(importRe.test(avatars), 'avatars import the shared guards');
  assert.ok(importRe.test(attachments), 'attachments import the shared guards');
  // The duplicate that let the two drift apart is gone.
  assert.ok(
    !/function hasUnsafeClientVersionFields/.test(attachments),
    'attachments must not keep a private copy of the rule',
  );
});

test('the exporter checks containment before reading a stored path', () => {
  const exporter = read('models/exporter.js');
  assert.ok(/function isReadableStoredFilePath/.test(exporter));
  // The one place bytes are read, and both avatar call sites.
  const guards = exporter.match(/isReadableStoredFilePath\(/g) || [];
  assert.ok(guards.length >= 4, `expected the guard at every read site, found ${guards.length}`);
  assert.ok(
    /const storedPath = doc\?\.versions\?\.original\?\.path;[\s\S]{0,400}?if \(!isReadableStoredFilePath\(storedPath\)\)/.test(exporter),
    'getBase64Data refuses an uncontained path before opening a read stream',
  );
});

test('negative: no unguarded read of a stored version path remains in the exporter', () => {
  const exporter = read('models/exporter.js');
  assert.ok(
    !/createReadStream\(doc\.versions\.original\.path\)/.test(exporter),
    'the stream must be opened on the CHECKED path variable, not on the raw field',
  );
  const reads = exporter.match(/fs\.readFileSync\(p\)/g) || [];
  assert.strictEqual(reads.length, 1, 'one readFileSync, and it is inside the checked branch');
  assert.ok(/if \(p && isReadableStoredFilePath\(p\)\) \{/.test(exporter));
});

test('the download path uses the same containment module, not its own copy', () => {
  const strategy = read('models/lib/fileStoreStrategy.js');
  assert.ok(/require\('\.\/storagePathContainment'\)/.test(strategy));
  assert.ok(
    !/^function isPathInside\(/m.test(strategy),
    'the private duplicate is gone — one rule, one place',
  );
});

console.log(`\n${passed} tests passed`);
