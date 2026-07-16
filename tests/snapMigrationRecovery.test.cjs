'use strict';

// Plain-Node regression guard (no Meteor) for issues #6458 and #6466: the
// WeKan snap served "502 Bad Gateway" forever when mongod could not start
// (SIGILL on CPUs without AVX; MongoDB 3.x data files after a failed
// migration), and a migration finishing with a few per-item errors ("Avatars
// Errors") deleted the fully-copied FerretDB database.
// Run: node tests/snapMigrationRecovery.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const mongodbControl = read('snap-src/bin/mongodb-control');
const migrationControl = read('snap-src/bin/migration-control');
const importer3 = read('snap-src/bin/migrate-mongo3-to-ferretdb.mjs');
const importerModern = read('releases/migrate-mongodb-to-ferretdb.mjs');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// --- #6458: mongod start failures get a real outcome --------------------------

test('mongodb-control has an AVX pre-flight (MongoDB 5+ SIGILLs without AVX)', () => {
  assert.ok(mongodbControl.includes('grep -qw avx /proc/cpuinfo'));
  assert.ok(/uname -m.*x86_64/.test(mongodbControl), 'AVX check is x86_64-only');
});

test('mongod runs through cpu-exec with its CPU feature requirements', () => {
  assert.ok(mongodbControl.includes('MONGOD_CPU_FEATURES="x86_64=avx,aarch64=atomics"'));
  const wrapped = mongodbControl.match(/bash "\$CPU_EXEC" --features "\$MONGOD_CPU_FEATURES" \$SNAP\/bin\/mongod/g) || [];
  assert.strictEqual(wrapped.length, 2, 'both the temp fork and the final start use cpu-exec');
  assert.ok(!/^\$SNAP\/bin\/mongod \\$/m.test(mongodbControl), 'no bare absolute-path mongod start remains');
});

test('the temporary mongod fork exit status is checked', () => {
  assert.ok(mongodbControl.includes('|| handle_mongod_start_failure $?'));
});

test('the final mongod start is no longer exec-and-forget', () => {
  assert.ok(!/exec \$SNAP\/bin\/mongod/.test(mongodbControl),
    'exec would let snapd blindly restart into the same crash forever');
  assert.ok(mongodbControl.includes('_mongod_rc=$?'));
  assert.ok(/handle_mongod_start_failure \$_mongod_rc/.test(mongodbControl));
});

test('failure handler switches to a COMPLETED FerretDB migration only', () => {
  const switcher = mongodbControl.match(/switch_to_completed_ferretdb\(\) \{[\s\S]*?\n\}/);
  assert.ok(switcher, 'switch_to_completed_ferretdb found');
  assert.ok(switcher[0].includes('.migration-to-ferretdb-done'),
    'must require the completion marker');
  assert.ok(switcher[0].includes('ferretdb-has-data'),
    'must require a non-empty SQLite');
  assert.ok(switcher[0].includes('snapctl set database=ferretdb'));
  const handler = mongodbControl.match(/handle_mongod_start_failure\(\) \{[\s\S]*?\n\}/);
  assert.ok(handler, 'handler found');
  assert.ok(handler[0].includes('switch_to_completed_ferretdb'),
    'the failure handler prefers the completed migration');
});

test('failure handler re-runs the migration with a bounded attempt counter', () => {
  const handler = mongodbControl.match(/handle_mongod_start_failure\(\) \{[\s\S]*?\n\}/);
  assert.ok(handler[0].includes('exec bash "$SNAP/bin/migration-control"'));
  assert.ok(/-le 3/.test(handler[0]), 'at most 3 automatic attempts');
  assert.ok(mongodbControl.includes('MONGOD_FAIL_COUNT_FILE='));
});

test('the failure counter is cleared once mongod answers', () => {
  assert.ok(/rm -f "\$MONGOD_FAIL_COUNT_FILE"/.test(mongodbControl));
});

test('migration-control probes mongod 7 through cpu-exec (qemu on non-AVX CPUs)', () => {
  assert.ok(migrationControl.includes('MONGOD7_CPU_FEATURES="x86_64=avx,aarch64=atomics"'));
  assert.ok(/start_mongod "\$SNAP\/bin\/mongod" "" "--wiredTigerCacheSizeGB \$\{SRC_WT_CACHE_GB\}" "\$MONGOD7_CPU_FEATURES"/.test(migrationControl),
    'the probe passes the feature spec so a modern MongoDB can be READ for migration without AVX');
  assert.ok(migrationControl.includes('bash "$SNAP/bin/cpu-exec" --features "${4:-}"'),
    'start_mongod routes every source mongod through cpu-exec');
});

// --- #6466: per-item errors are not fatal; 3.x failures keep progress ---------

test('mongo3 importer: per-item errors no longer fail the whole migration', () => {
  assert.ok(!importer3.includes('state.success = state.errors.length < 10;'),
    'the <10-errors success threshold must be gone');
  assert.ok(importer3.includes('if (state.success !== false) state.success = true;'),
    'a completed run succeeds unless a FATAL path already failed it');
});

test('modern importer: per-item errors no longer fail the whole migration', () => {
  assert.ok(!importerModern.includes('state.success = totalErrors < 10;'),
    'the <10-errors success threshold must be gone');
  assert.ok(importerModern.includes('if (state.success !== false) state.success = true;'));
});

test('negative: fatal paths still fail — the success override respects them', () => {
  // Both importers must still contain fatal paths that set success = false
  // BEFORE the completion code (disk-full aborts, unusable tools).
  assert.ok(/state\.abort = true; state\.success = false/.test(importer3));
  assert.ok(/state\.abort = true; state\.success = false/.test(importerModern));
});

test('a failed 3.x-source migration keeps the copied data and resumes', () => {
  assert.ok(migrationControl.includes('fail_3x_keep_progress() {'));
  // ... and the 3.x branch calls it (the modern branch may keep the MongoDB
  // fallback — mongod 7 CAN serve that data).
  const after3x = migrationControl.slice(migrationControl.indexOf('Detected MongoDB 3.x'));
  assert.ok(after3x.includes('fail_3x_keep_progress "$rc"'));
  assert.ok(!after3x.includes('\n  fail_and_run_mongodb\n'),
    '3.x failures must NOT fall back to a mongod 7 that cannot open 3.x data files');
});

test('fail_3x_keep_progress never discards the partial FerretDB or checkpoint', () => {
  const fn = migrationControl.match(/fail_3x_keep_progress\(\) \{[\s\S]*?\n\}/);
  assert.ok(fn, 'function found');
  assert.ok(!fn[0].includes('discard_partial_ferretdb'));
  assert.ok(!fn[0].includes('migrate=off'), 'auto-migration must stay ON so the next start resumes');
});

test('a successful migration clears the mongod start-failure counter', () => {
  const finish = migrationControl.match(/finish_success\(\) \{[\s\S]*?\n\}/);
  assert.ok(finish, 'finish_success found');
  assert.ok(finish[0].includes('.mongod-start-failures'));
});

console.log(`\n${passed} tests passed`);
