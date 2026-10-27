'use strict';

// FilePathBleed - CVE-2026-52890 / GHSA-g6vm-7757-pr88 (Jan Kahmen,
// turingpoint GmbH; CWE-22, CWE-400), https://wekan.fi/hall-of-fame/filebleed/
//
// An authenticated board member could insert an attachment over DDP whose
// `versions.original.path` named any file on the server, and attachment reads
// then served it: arbitrary file read and a repeatable DoS. The fix refuses
// client-supplied server-managed version metadata (models/lib/fileVersionFields.js,
// shared by attachments and avatars) and records the attempt as the
// 'attachment.version-path' canary, which Admin Panel / Problems shows as
// FilePathBleed ('authz.attachment-file-path' in models/lib/securityCategories.js).
//
// SIBLING found while writing this test (2026-10-27): the check looked only
// inside `versions`. ostrio:files falls back to the TOP-LEVEL `path` of a record
// whose `versions` is missing or not an object - unlinkAsync() then deletes
// `fileRef.path` when the record is removed (the validateAttachment method
// removes a record whose content fails validation) and isFileValid() reads it.
// So `{ path: '/any/file', meta: {...} }` with no `versions` passed the guard.
// It is the same server-managed field one level up, and is now refused too.
//
// Run: node tests/filePathBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const {
  hasUnsafeClientVersionFields,
  touchesVersionFields,
  onlyTouchesAllowedFields,
} = require('../models/lib/fileVersionFields');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('the reported insert is refused: versions.original.path (GHSA-g6vm-7757-pr88)', () => {
  assert.strictEqual(hasUnsafeClientVersionFields({
    name: 'x.png', meta: { boardId: 'b', cardId: 'c' },
    versions: { original: { path: '/etc/passwd', size: 1 } },
  }), true);
  assert.strictEqual(hasUnsafeClientVersionFields({
    versions: { thumbnail: { storage: 'fs' } },
  }), true);
});

test('the top-level path sibling is refused, with or without versions', () => {
  assert.strictEqual(hasUnsafeClientVersionFields({ path: '/etc/passwd', meta: {} }), true);
  assert.strictEqual(hasUnsafeClientVersionFields({ path: '/etc/passwd', versions: 'nonsense' }), true);
  assert.strictEqual(hasUnsafeClientVersionFields({
    path: '/srv/wekan/files/other.bin', versions: { original: { size: 1 } },
  }), true);
  // An explicit undefined is still the field being sent.
  assert.strictEqual(hasUnsafeClientVersionFields({ path: undefined }), true);
});

test('a document with no server-managed fields is not refused here (negative)', () => {
  assert.strictEqual(hasUnsafeClientVersionFields({
    name: 'me.png', type: 'image/png', meta: { boardId: 'b' },
    versions: { original: { size: 3, type: 'image/png' } },
  }), false);
  assert.strictEqual(hasUnsafeClientVersionFields({}), false);
  assert.strictEqual(hasUnsafeClientVersionFields(null), false);
  // A NAME mentioning a path is not the path field.
  assert.strictEqual(hasUnsafeClientVersionFields({ name: 'path' }), false);
});

test('updates can touch neither versions nor path', () => {
  assert.strictEqual(touchesVersionFields(['versions.original.path']), true);
  assert.strictEqual(touchesVersionFields(['versions']), true);
  assert.strictEqual(onlyTouchesAllowedFields(['path'], ['name']), false);
  assert.strictEqual(onlyTouchesAllowedFields(['name'], ['name']), true);
});

test('both permission files apply the shared guard and record the attempt', () => {
  for (const [rel, canary] of [
    ['server/permissions/attachments.js', 'attachment.version-path'],
    ['server/permissions/avatars.js', 'avatar.version-path'],
  ]) {
    const src = read(rel);
    const allowAt = src.indexOf('.allow({');
    const insert = src.slice(allowAt, src.indexOf('update(', allowAt));
    assert.match(insert, /if \(hasUnsafeClientVersionFields\((fileObj|doc)\)\) \{[\s\S]*?return tripCanary\('/, rel);
    assert.ok(src.includes(`tripCanary('${canary}'`), `${rel} trips ${canary}`);
    assert.match(src, /(ALLOWED_UPDATE_FIELDS|allowedFields) = \['name'\];/, `${rel}: only the name may change`);
  }
  assert.match(read('models/lib/securityCategories.js'),
    /'authz\.attachment-file-path':\s*\{[^}]*bleed: 'FilePathBleed'/);
});

// The shape, everywhere: a collection whose documents carry a filesystem path
// is a Meteor-Files collection. Every one must refuse client-supplied paths in
// its insert rule; a new FilesCollection without the guard would be the same
// hole again.
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['node_modules', '_build', '.build', '.tools', 'tests', '.meteor'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.js$/.test(entry.name)) out.push(rel);
  }
  return out;
}

test('negative: every FilesCollection has a guarded insert rule', () => {
  const sources = ['models', 'server', 'packages'].flatMap(d => walk(d));
  const collections = [];
  for (const rel of sources) {
    const src = read(rel);
    const re = /(?:export\s+)?(?:const|let|var)?\s*(\w+)\s*=\s*new FilesCollection\(/g;
    let m;
    while ((m = re.exec(src))) collections.push([m[1], rel]);
  }
  assert.ok(collections.length >= 2, 'found the attachment and avatar collections');
  for (const [name] of collections) {
    const guarded = sources.some(rel => {
      const src = read(rel);
      const at = src.indexOf(`${name}.allow({`);
      if (at === -1) return false;
      const rule = src.slice(at, src.indexOf('update(', at));
      return /hasUnsafeClientVersionFields\(/.test(rule);
    });
    assert.ok(guarded, `${name}: insert must refuse client-supplied path metadata`);
  }
});

test('negative: no private copy of the path rule exists outside fileVersionFields', () => {
  for (const rel of ['models', 'server'].flatMap(d => walk(d))) {
    if (rel === path.join('models', 'lib', 'fileVersionFields.js')) continue;
    assert.ok(!/function hasUnsafeClientVersionFields/.test(read(rel)), rel);
  }
});

console.log(`\nfilePathBleed: ${passed} tests passed`);
