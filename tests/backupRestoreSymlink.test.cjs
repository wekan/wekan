'use strict';

// Guard (2026-10-02): the attachment/avatar half of a backup restore wrote
// each file with fs.createWriteStream(destPath). safeEntryPath keeps the NAME
// inside the files directory, but a symlink already on that path - a
// directory or the file itself - carried the write wherever it pointed.
// server/lib/fullBackup.js already refused that; the restore does now too.
// Run: node tests/backupRestoreSymlink.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { symlinkOnRestorePath } = require('../models/lib/backupPaths');
const tmpBase = path.join(ROOT, '.tools', 'tmp');
fs.mkdirSync(tmpBase, { recursive: true });

test('a symlinked directory or file on the way is detected, plain paths are not', () => {
  const dir = fs.mkdtempSync(path.join(tmpBase, 'restore-symlink-'));
  try {
    const root = path.join(dir, 'attachments');
    const outside = path.join(dir, 'outside');
    fs.mkdirSync(root); fs.mkdirSync(outside);
    fs.symlinkSync(outside, path.join(root, 'linked-dir'));
    fs.writeFileSync(path.join(outside, 'target'), 'x');
    fs.symlinkSync(path.join(outside, 'target'), path.join(root, 'linked-file'));
    fs.mkdirSync(path.join(root, 'real'));
    assert.equal(symlinkOnRestorePath(root, path.join(root, 'linked-dir', 'a.png')), true);
    assert.equal(symlinkOnRestorePath(root, path.join(root, 'linked-file')), true);
    // Negative: ordinary destinations, existing or not.
    assert.equal(symlinkOnRestorePath(root, path.join(root, 'real', 'a.png')), false);
    assert.equal(symlinkOnRestorePath(root, path.join(root, 'new', 'deeper', 'a.png')), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('negative: every restore write into the files directory refuses links', () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/methods/backup.js'), 'utf8');
  const writes = [...src.matchAll(/fs\.createWriteStream\(([^)]*)\)/g)].map(m => m[1]);
  // The archive itself is created exclusively; restored files the same way.
  for (const args of writes) assert.match(args, /flags: 'wx'/, args);
  assert.match(src, /if \(symlinkOnRestorePath\(destRoot, destPath\)\) \{ skipped\.push\(entry\.path\); continue; \}/);
});
