'use strict';

// #6583 comment 5313053318: database-compare and database-merge called retained
// MongoDB files "unreadable" while migration-control carried mongod 5.0 and 4.2
// specifically to read those vintages. Both recovery phases must use the same
// compatibility ladder, and a real failure must point to its startup log.
// Run: node tests/snapRecoveryUsesLegacyMongoReaders.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const autopick = read('snap-src/bin/database-autopick');
const migration = read('snap-src/bin/migration-control');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapRecoveryUsesLegacyMongoReaders:');

function body(name, source = autopick) {
  const at = source.indexOf(`${name}() {`);
  assert.notStrictEqual(at, -1, `missing ${name}`);
  const next = source.indexOf('\n}\n', at);
  return source.slice(at, next + 3);
}

test('recovery offers every modern WiredTiger reader migration offers', () => {
  const start = body('start_mongo_reader');
  for (const [label, dir] of [
    ['mongod 7', '$SNAP/bin/mongod'],
    ['mongod 5.0', '$SNAP/mongo50/bin/mongod'],
    ['mongod 4.2', '$SNAP/mongo42/bin/mongod'],
  ]) {
    assert.ok(start.includes(`"${label}"`), `${label} missing from recovery ladder`);
    assert.ok(start.includes(`bin="${dir}"`), `${dir} missing from recovery ladder`);
  }
  assert.ok(/M50="\$SNAP\/mongo50"/.test(migration), 'migration still carries 5.0');
  assert.ok(/M42="\$SNAP\/mongo42"/.test(migration), 'migration still carries 4.2');
});

test('comparison uses the compatibility ladder, not mongod 7 directly', () => {
  const evidence = body('evidence_from_mongodb');
  assert.ok(/start_mongo_reader/.test(evidence));
  assert.ok(!/\$SNAP\/bin\/mongod/.test(evidence),
    'a direct current-mongod start recreates the unreadable-old-data bug');
});

test('merge starts MongoDB through the same compatibility ladder', () => {
  const merge = autopick.slice(autopick.indexOf('if [ -n "$MERGE_FROM" ]'));
  assert.ok(/if have_mongo_data; then\n\s+start_mongo_reader/.test(merge),
    'merge must not forget the reader that comparison needed');
  assert.ok(!/cpu-exec[^\n]*\$SNAP\/bin\/mongod/.test(merge),
    'merge must not fall back to a direct mongod 7-only start');
});

test('merge reuses a live FerretDB instead of opening SQLite twice', () => {
  const merge = autopick.slice(autopick.indexOf('if [ -n "$MERGE_FROM" ]'));
  assert.ok(/if \[ "\$LIVE_KIND" = ferretdb \]; then\n\s+MERGE_FERRET_URL="\$LIVE_URL"/.test(merge),
    'the running FerretDB must be the merge target');
  assert.ok(/else\n\s+DO_NOT_TRACK=1 FERRETDB_TELEMETRY=disable/.test(merge),
    'a temporary FerretDB is started only when it is not already running');
  assert.ok(/ping "\$MERGE_FERRET_URL"/.test(merge),
    'readiness follows whichever target URL was selected');
});

test('merge never shuts down a live database it borrowed (negative)', () => {
  const merge = autopick.slice(autopick.indexOf('if [ -n "$MERGE_FROM" ]'));
  assert.ok(/\[ "\$MERGE_MONGO_URL" = "\$MONGO_URL" \]/.test(merge),
    'only the temporary MongoDB URL is eligible for shutdown');
  assert.ok(!/shutdown "\$LIVE_URL"/.test(merge));
});

test('unreadable means every bundled reader failed and names the log', () => {
  const start = body('start_mongo_reader');
  assert.ok(/none of the bundled 7\/5\.0\/4\.2 readers/.test(start));
  assert.ok(/startup details are in \$LOGF/.test(start));
});

test('absent legacy readers are skipped safely (negative)', () => {
  const start = body('start_mongo_reader');
  assert.ok(/\[ -x "\$bin" \] \|\| continue/.test(start),
    'architectures without an upstream legacy binary must continue safely');
});

console.log(`\nsnapRecoveryUsesLegacyMongoReaders: ${passed} tests passed`);
