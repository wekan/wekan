'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const helper = path.join(root, 'releases/ferretdb/sqlite-recovery.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-recovery-test-'));
const db = path.join(tmp, 'db');
fs.mkdirSync(db);
const checker = path.join(tmp, 'ferretdb');
fs.writeFileSync(checker, `#!/bin/sh
[ "$1" = check-sqlite ] || exit 2
case "$(head -c 6 "$2")" in SQLite) echo ok; exit 0;; *) exit 1;; esac
`);
fs.chmodSync(checker, 0o700);

const run = (extra = {}) => spawnSync(process.execPath,
  [helper, 'startup', db, checker], {
    encoding: 'utf8',
    env: { ...process.env, WEKAN_RECOVERY_RESERVE_BYTES: '0',
      WEKAN_RECOVERY_MAX_LOAD_PER_CORE: '999', ...extra },
  });
const snapshot = (extra = {}) => spawnSync(process.execPath, [helper, 'snapshot', db], {
  encoding: 'utf8', env: { ...process.env, WEKAN_RECOVERY_RESERVE_BYTES: '0', ...extra },
});

try {
  const original = Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(8192, 7)]);
  fs.writeFileSync(path.join(db, 'wekan.sqlite'), original);
  assert.equal(run().status, 0);
  const manifestFile = path.join(db, '.recovery/latest/manifest.json');
  const archiveFile = path.join(db, '.recovery/latest/wekan.sqlite.gz');
  const manifest = JSON.parse(fs.readFileSync(manifestFile));
  assert.equal(manifest.schema, 1);
  assert.match(manifest.uncompressedSha256, /^[a-f0-9]{64}$/);
  assert.match(manifest.compressedSha256, /^[a-f0-9]{64}$/);
  assert.ok(manifest.compressedBytes < manifest.uncompressedBytes);
  const firstManifest = fs.readFileSync(manifestFile, 'utf8');
  assert.equal(snapshot({ WEKAN_RECOVERY_RESERVE_BYTES: String(Number.MAX_SAFE_INTEGER) }).status, 1,
    'insufficient disk space defers snapshot creation');
  assert.equal(fs.readFileSync(manifestFile, 'utf8'), firstManifest,
    'a disk-space refusal cannot rotate the verified generation');

  fs.writeFileSync(path.join(db, 'wekan.sqlite'), 'corrupt live data');
  assert.equal(run().status, 0, 'latest verified snapshot recovers corrupt live data');
  assert.deepEqual(fs.readFileSync(path.join(db, 'wekan.sqlite')), original);

  // A damaged latest generation must not be trusted; previous remains a fallback.
  const newer = Buffer.concat([Buffer.from('SQLite format 3\0'), Buffer.alloc(4096, 9)]);
  fs.writeFileSync(path.join(db, 'wekan.sqlite'), newer);
  assert.equal(snapshot().status, 0);
  const wrong = JSON.parse(fs.readFileSync(manifestFile));
  wrong.compressedSha256 = '0'.repeat(64);
  fs.writeFileSync(manifestFile, JSON.stringify(wrong));
  fs.writeFileSync(path.join(db, 'wekan.sqlite'), 'corrupt again');
  assert.equal(run().status, 0, 'a damaged latest snapshot falls back to previous');
  assert.deepEqual(fs.readFileSync(path.join(db, 'wekan.sqlite')), original);

  const previousManifest = path.join(db, '.recovery/previous/manifest.json');
  const invalidPrevious = JSON.parse(fs.readFileSync(previousManifest));
  invalidPrevious.uncompressedSha256 = 'f'.repeat(64);
  fs.writeFileSync(previousManifest, JSON.stringify(invalidPrevious));
  fs.writeFileSync(path.join(db, 'wekan.sqlite'), 'all sources corrupt');
  assert.equal(run().status, 3, 'no verified generation returns the remigration status');
  assert.equal(fs.readFileSync(path.join(db, 'wekan.sqlite'), 'utf8'), 'all sources corrupt',
    'an unverified snapshot never replaces live data');

  const events = fs.readFileSync(path.join(db, 'recovery-events.jsonl'), 'utf8');
  assert.match(events, /"type":"snapshot-created"/);
  assert.match(events, /"type":"corruption-detected"/);
  assert.match(events, /"type":"restore-backup"/);
  assert.match(events, /"type":"restore-prev"/);
  assert.match(events, /"type":"manual-required"/);
  console.log('sqliteVerifiedRecovery: snapshot, checksum, restore, rejection, and reporting passed');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
