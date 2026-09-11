'use strict';

// Database health for Admin Panel / Problems (models/lib/databaseHealth.js,
// pure; server/lib/databaseHealth.js, the probe). Born from a reported crash
// series (.tools/crash): MongoDB on an SMB/DFS share aborting on every
// checkpoint with fsync ENOSPC, restarting, and aborting again, with every
// query in between slow - and nothing in WeKan seeing any of it. These are
// the checks WeKan can make from its side of the socket, and the one
// remediation it can do itself (create a missing index at startup).
//
// Run: node tests/databaseHealth.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const H = require(path.join(ROOT, 'models', 'lib', 'databaseHealth.js'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('databaseHealth:');

test('a restart is uptime going DOWN, with a margin for a probe that ran twice quickly', () => {
  assert.strictEqual(H.restartDetected(3600, 12), true, 'the reported case: mongod came back');
  assert.strictEqual(H.restartDetected(3600, 3900), false);
  assert.strictEqual(H.restartDetected(3600, 3598), false, 'two seconds of clock skew is not a restart');
  assert.strictEqual(H.restartDetected(undefined, 100), false, 'first probe has nothing to compare');
  assert.strictEqual(H.restartDetected(100, NaN), false);
});

test('the SMB/CIFS, NFS and FUSE data directories the crash came from are recognised; local ones are not', () => {
  assert.strictEqual(H.networkFilesystem(0xff534d42), 'cifs');
  assert.strictEqual(H.networkFilesystem(0xfe534d42), 'smb2');
  assert.strictEqual(H.networkFilesystem(0x6969), 'nfs');
  assert.strictEqual(H.networkFilesystem(0xef53), null, 'ext4');
  assert.strictEqual(H.networkFilesystem(0x58465342), null, 'xfs');
  assert.strictEqual(H.networkFilesystem('garbage'), null);
  assert.strictEqual(H.filesystemName(0xef53), 'ext4');
  assert.strictEqual(H.filesystemName(0x12345), '0x12345');
});

test('read latency is the delta of serverStatus.opLatencies, as an average in ms', () => {
  const before = { reads: { latency: 1000000, ops: 100 } };
  const after = { reads: { latency: 1000000 + 200000 * 50, ops: 150 } };
  assert.strictEqual(H.readLatencyMs(before, after), 200, '50 reads at 200 ms each');
  assert.strictEqual(H.readLatencyMs(before, before), null, 'no reads in the interval');
  assert.strictEqual(H.readLatencyMs(null, after), null);
  assert.strictEqual(H.slowStorage(200, 50), true);
  assert.strictEqual(H.slowStorage(200, 3), false, 'three slow reads are not the storage');
  assert.strictEqual(H.slowStorage(40, 5000), false);
});

test('disk space: the real "no space left on device", before it happens', () => {
  const gib = n => n * 1024 * 1024 * 1024;
  const ok = H.diskSpace({ fsTotalSize: gib(100), fsUsedSize: gib(50) });
  assert.strictEqual(ok.critical, false);
  assert.ok(Math.abs(ok.percentFree - 50) < 0.01);
  const tight = H.diskSpace({ fsTotalSize: gib(100), fsUsedSize: gib(99.8) });
  assert.strictEqual(tight.critical, true, '0.2 GiB free is critical by bytes');
  const small = H.diskSpace({ fsTotalSize: gib(4), fsUsedSize: gib(3.9) });
  assert.strictEqual(small.critical, true, 'under 5% free is critical by percent');
  assert.strictEqual(H.diskSpace({}), null, 'a database that does not report it (FerretDB) is skipped');
  // The reported case: 519 MB used, 10 GiB available - NOT a space problem,
  // which is exactly why the ENOSPC pointed at the filesystem instead.
  const reported = H.diskSpace({ fsTotalSize: gib(10.5), fsUsedSize: 519 * 1024 * 1024 });
  assert.strictEqual(reported.critical, false);
});

test('every problem row is in the database stream\'s shape and says what to do', () => {
  for (const row of [
    H.restartProblem(3), H.networkFilesystemProblem('cifs', '/data/db'),
    H.slowStorageProblem(200, 50), H.diskSpaceProblem(H.diskSpace({ fsTotalSize: 1e10, fsUsedSize: 9.9e9 })),
    H.indexCreatedRemediation('card_comment_reactions', { cardId: 1 }, 1234),
  ]) {
    assert.ok(/^db\./.test(row.type) && row.kind && ['low', 'medium', 'high'].includes(row.severity), row.type);
    assert.ok(row.detail.length > 40 && !/\n/.test(row.detail), row.type);
  }
  assert.ok(H.restartProblem(1).detail.includes(H.DOCS), 'the restart row points at the storage page');
  assert.ok(H.networkFilesystemProblem('nfs', '/data/db').detail.includes('/data/db'));
  assert.ok(H.indexCreatedRemediation('x', { a: 1 }, 2).detail.includes('Fixed automatically'));
});

test('the probe records through the database stream, runs at startup and on a timer, and is imported', () => {
  const probe = fs.readFileSync(path.join(ROOT, 'server/lib/databaseHealth.js'), 'utf8');
  assert.ok(/recordDatabaseHealth/.test(probe));
  assert.ok(/serverStatus: 1/.test(probe) && /dbStats: 1/.test(probe) && /getCmdLineOpts: 1/.test(probe));
  assert.ok(/fs\.statfs/.test(probe), 'the data directory is checked with statfs when it is local');
  assert.ok(/Meteor\.setInterval/.test(probe) && /Meteor\.startup/.test(probe));
  assert.ok(fs.readFileSync(path.join(ROOT, 'server/imports.js'), 'utf8').includes("import '/server/lib/databaseHealth';"));
  const problems = fs.readFileSync(path.join(ROOT, 'server/lib/databaseProblems.js'), 'utf8');
  assert.ok(/export function recordDatabaseHealth\(/.test(problems) && /stream: 'database'/.test(problems));
});

test('ensureIndex records a created index as an automatic remediation, only when the collection had data', () => {
  const src = fs.readFileSync(path.join(ROOT, 'server/lib/mongoStartup.js'), 'utf8');
  assert.ok(/estimatedDocumentCount\(\)/.test(src));
  assert.ok(/indexCreatedRemediation\(/.test(src));
  assert.ok(/await raw\.createIndex\(keys, options\);/.test(src));
});

console.log(`\ndatabaseHealth: ${passed} tests passed`);
