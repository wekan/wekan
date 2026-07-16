'use strict';

// Plain-Node regression guard (no Meteor) for issue #6473: the Admin Panel >
// Attachments > Filesystem Storage page always showed "/data" as the storage
// path, because the Blaze helpers computed it from process.env.WRITABLE_PATH
// ON THE CLIENT — and a browser's process.env never has WRITABLE_PATH. On a
// Snap install the real path is $SNAP_COMMON/files/attachments, so admins were
// sent looking for a /data directory that does not exist.
// Run: node tests/attachmentStoragePath.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const { computeStoragePaths } = require('../models/lib/attachmentStoragePath');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- computeStoragePaths: the real, Snap-aware path computation ---------------

test('Snap: WRITABLE_PATH already ends in /files — /files is not appended twice', () => {
  const p = computeStoragePaths('/var/snap/wekan/common/files');
  assert.strictEqual(p.writablePath, '/var/snap/wekan/common/files');
  assert.strictEqual(p.attachments, '/var/snap/wekan/common/files/attachments');
  assert.strictEqual(p.avatars, '/var/snap/wekan/common/files/avatars');
});

test('Docker: WRITABLE_PATH=/data — files live under /data/files, NOT /data/attachments', () => {
  const p = computeStoragePaths('/data');
  assert.strictEqual(p.attachments, '/data/files/attachments');
  assert.strictEqual(p.avatars, '/data/files/avatars');
  // Negative: the old (wrong) Admin Panel default pointed here
  assert.notStrictEqual(p.attachments, '/data/attachments');
});

test('parallel snap instances resolve to their own common dir', () => {
  const p = computeStoragePaths('/var/snap/wekan_customer1/common/files');
  assert.strictEqual(p.attachments, '/var/snap/wekan_customer1/common/files/attachments');
});

test('dev: no WRITABLE_PATH falls back to the current working directory', () => {
  const p = computeStoragePaths(undefined);
  assert.strictEqual(p.writablePath, process.cwd());
  assert.strictEqual(p.attachments, path.join(process.cwd(), 'files', 'attachments'));
});

test('negative: empty string behaves like unset, never returns bare "/files"', () => {
  const p = computeStoragePaths('');
  assert.strictEqual(p.writablePath, process.cwd());
  assert.ok(p.attachments.startsWith(process.cwd()));
});

test('windows-style base ending in \\files is treated as the files root', () => {
  const p = computeStoragePaths('C:\\wekan\\files');
  assert.ok(p.attachments.endsWith(path.join('C:\\wekan\\files', 'attachments').slice(-11)) ||
            p.attachments.includes('attachments'));
  assert.ok(!p.attachments.includes(`files${path.sep}files`), 'no /files/files duplication');
});

// --- the computation matches the paths WeKan actually stores files at ---------
// models/attachments.js + server/initializeDirs.js implement the same rule; if
// either drifts, the Admin Panel would show a path files are not actually in.

test('models/attachments.js uses the same ends-with-/files rule', () => {
  const src = read('models/attachments.js');
  assert.ok(src.includes("endsWith('/files')"));
  assert.ok(src.includes("'/files/attachments'"));
});

test('server/initializeDirs.js uses the same ends-with-/files rule', () => {
  const src = read('server/initializeDirs.js');
  assert.ok(src.includes("endsWith('/files')"));
});

// --- the client no longer fabricates the path in the browser ------------------

test('client attachments.js path helpers no longer read process.env (undefined in a browser)', () => {
  const src = read('client/components/settings/attachments.js');
  assert.ok(!/process\.env\.WRITABLE_PATH/.test(src),
    'client-side process.env.WRITABLE_PATH is always undefined and rendered "/data"');
  assert.ok(src.includes("Meteor.call('getAttachmentStoragePaths'"),
    'the client must ask the server for the real paths');
});

test('client settingBody.js path helpers no longer read process.env', () => {
  const src = read('client/components/settings/settingBody.js');
  assert.ok(!/WRITABLE_PATH\s*\|\|\s*'\/data'/.test(src),
    'the "/data" fallback in the browser was the bug');
  assert.ok(src.includes("Meteor.call('getAttachmentStoragePaths'"));
});

// --- the server method exists, is admin-only, and uses the shared helper ------

test('server exposes an admin-only getAttachmentStoragePaths method', () => {
  const src = read('server/models/attachmentStorageSettings.js');
  const method = src.match(/async getAttachmentStoragePaths\(\) \{[\s\S]*?\n  \},/);
  assert.ok(method, 'method getAttachmentStoragePaths found');
  assert.ok(method[0].includes('isAdmin'), 'must require admin');
  assert.ok(method[0].includes('computeStoragePaths(process.env.WRITABLE_PATH)'),
    'must return the real, Snap-aware paths');
});

test('the default settings document no longer defaults to /data/attachments', () => {
  const src = read('server/models/attachmentStorageSettings.js');
  assert.ok(!src.includes("'/data/attachments'"),
    'the old default pointed at a directory that never exists');
  assert.ok(src.includes('computeStoragePaths(process.env.WRITABLE_PATH).attachments'));
});

console.log(`attachmentStoragePath.test.cjs: ${passed} tests passed`);
