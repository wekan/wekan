'use strict';

// models/lib/diskHighTracker.js - the pure half of the disk-usage monitor
// (docs/Features/Admin-Panel/Problems/Disk-usage.md): statfs numbers to a used
// percentage, the watched paths, and one episode per filesystem.
//
// Run: node tests/diskHighTracker.test.cjs

const assert = require('assert');
const { statfsUsage, watchedPaths, DiskEpisodes } = require('../models/lib/diskHighTracker.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('diskHighTracker:');

test('statfs gives the size, what may still be written and the used percentage', () => {
  assert.deepStrictEqual(statfsUsage({ bsize: 4096, blocks: 1000, bavail: 100 }),
    { total: 4096000, available: 409600, usedPct: 90 });
});

test('missing or zero numbers give no figure, never NaN (negative)', () => {
  assert.strictEqual(statfsUsage(null), null);
  assert.strictEqual(statfsUsage({ bsize: 4096, blocks: 0, bavail: 0 }), null, 'zero-size filesystem');
  assert.strictEqual(statfsUsage({ bsize: 4096, blocks: 1000 }), null, 'no free-space field');
  assert.strictEqual(statfsUsage({ bsize: 0, blocks: 10, bavail: 1 }), null);
  assert.strictEqual(statfsUsage({ bsize: 4096, blocks: 10, bavail: 20 }).usedPct, 0, 'more free than size is capped');
});

test('the default paths are the database, the attachments and the uploads, each once', () => {
  assert.deepStrictEqual(watchedPaths({ dataPath: '/var/snap/wekan/common', filesRoot: '/var/snap/wekan/common/files/' }), [
    { path: '/var/snap/wekan/common', role: 'database' },
    { path: '/var/snap/wekan/common/files/', role: 'attachments' },
    { path: '/var/snap/wekan/common/files/temp', role: 'uploads' },
  ]);
  assert.deepStrictEqual(watchedPaths({ filesRoot: '/data/files', dataPath: '' }).map(e => e.role), ['attachments', 'uploads']);
});

test('WEKAN_DISK_WATCH_PATHS replaces the defaults, without repeats', () => {
  assert.deepStrictEqual(watchedPaths({ override: '/a: /b ::/a', dataPath: '/x', filesRoot: '/y' }),
    [{ path: '/a', role: 'watched' }, { path: '/b', role: 'watched' }]);
  assert.strictEqual(watchedPaths({ override: '  ', filesRoot: '/y' })[0].role, 'attachments',
    'a blank override keeps the defaults');
});

test('each filesystem has its own episode', () => {
  const e = new DiskEpisodes({ highPct: 90, lowPct: 85, enterSamples: 2, exitSamples: 2 });
  e.update('sda', 95, 1);
  assert.strictEqual(e.update('sda', 96, 2).event, 'start');
  assert.strictEqual(e.update('sdb', 50, 2).event, null);
  assert.ok(e.isHigh('sda') && !e.isHigh('sdb'), 'a full data disk does not mark the attachments disk');
  e.update('sda', 80, 3);
  const end = e.update('sda', 80, 4);
  assert.strictEqual(end.event, 'end');
  assert.strictEqual(end.peak, 96);
  assert.strictEqual(e.isHigh('unknown'), false);
});

console.log(`\ndiskHighTracker: ${passed} tests passed`);
