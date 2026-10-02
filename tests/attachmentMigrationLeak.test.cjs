'use strict';

// Guard: MigrationBleed (2026-10-02). attachmentMigration.getProgress and
// .getUnconvertedAttachments returned the full stored attachment documents -
// storage paths on the server's disk, version records, uploader ids, names of
// files on cards the caller cannot see - to anybody who could read the board,
// anonymous-readable public boards included. The client uses only `_id`.
// Run: node tests/attachmentMigrationLeak.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server/attachmentMigration.js'), 'utf8');

test('both reader-facing answers carry attachment ids only', () => {
  assert.match(src, /unconvertedAttachments: unconverted\.map\(attachment => \(\{ _id: attachment\._id \}\)\),/);
  const method = src.slice(src.indexOf("async 'attachmentMigration.getUnconvertedAttachments'"));
  assert.match(method.slice(0, method.indexOf('\n  },')), /\.map\(attachment => \(\{ _id: attachment\._id \}\)\);/);
});

test('negative: the client needs nothing but the id', () => {
  const client = fs.readFileSync(path.join(ROOT, 'client/lib/attachmentMigrationManager.js'), 'utf8');
  const uses = [...client.matchAll(/unconverted\.some\(attachment => attachment\.(\w+)/g)].map(m => m[1]);
  assert.deepEqual(uses, ['_id']);
  // (needsMigration reads attachment.meta from the PUBLISHED attachment, not
  // from these answers.)
  assert.doesNotMatch(client, /unconverted\w*\[\d+\]\./);
});
