'use strict';

// Free-disk-space probe used before writing an uploaded file to filesystem storage
// (models/lib/diskSpace.js). Key behaviour: when free space is UNKNOWN the probe
// must return true (proceed with safe chunked streaming), and when it is known it
// must compare against need + margin.
//
// Run: node tests/diskSpace.test.cjs

const assert = require('assert');
const os = require('os');
const { getFreeDiskBytes, hasEnoughDiskSpace } = require('../models/lib/diskSpace.js');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('diskSpace:');

check('getFreeDiskBytes returns a non-negative number or null for a real dir', () => {
  const v = getFreeDiskBytes(os.tmpdir());
  assert.ok(v === null || (typeof v === 'number' && v >= 0), 'number>=0 or null');
});

check('getFreeDiskBytes returns null for a missing path (unknown, not a throw)', () => {
  assert.strictEqual(getFreeDiskBytes('/no/such/path/xyz-' + process.pid), null);
});

check('hasEnoughDiskSpace: unknown free space -> true (proceed with safe streaming)', () => {
  // A missing path is "unknown", so the caller proceeds and relies on error cleanup.
  assert.strictEqual(hasEnoughDiskSpace('/no/such/path/xyz-' + process.pid, 10 * 1024 * 1024), true);
});

check('hasEnoughDiskSpace: tiny need on a real dir is enough', () => {
  assert.strictEqual(hasEnoughDiskSpace(os.tmpdir(), 1), true);
});

check('hasEnoughDiskSpace: absurd need on a real dir is NOT enough (when knowable)', () => {
  const free = getFreeDiskBytes(os.tmpdir());
  if (free === null) {
    // Platform cannot report free space; the function must then be permissive.
    assert.strictEqual(hasEnoughDiskSpace(os.tmpdir(), Number.MAX_SAFE_INTEGER), true);
  } else {
    assert.strictEqual(hasEnoughDiskSpace(os.tmpdir(), Number.MAX_SAFE_INTEGER), false);
  }
});

console.log(`\ndiskSpace: ${passed} checks passed`);
