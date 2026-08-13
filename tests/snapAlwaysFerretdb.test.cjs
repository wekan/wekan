'use strict';

// The snap's answer to "which database" is FerretDB - on every platform, for
// every install. MongoDB is bundled to be READ during a migration and is never
// what WeKan runs on. Run: node tests/snapAlwaysFerretdb.test.cjs
//
// Three things had to change for that to be true in practice, and each of them
// came from a report:
//
//   1. A DATABASE NOBODY COULD READ. A server starts only on data at most one
//      major behind it, so mongod 7 covers FCV 6.0/7.0 and mongod 4.2 covers
//      4.0/4.2 - and FCV 4.4/5.0 was covered by nothing, although the WeKan snap
//      itself shipped MongoDB 5 in February 2023. Those sites got
//      .mongodb-data-too-old and an explanatory page. mongod 5.0 reads both.
//
//   2. "WeKan CHANGED TO OLD MONGODB DATA". When the migrated FerretDB copy had
//      fallen behind the MongoDB beside it, the snap switched itself to
//      database=mongodb - onto the database it is migrating away from, and
//      (when the detector guessed wrong, #6583) onto one that was weeks behind.
//      The repair is the merge, not the switch: bring what MongoDB has into
//      FerretDB and carry on there.
//
//   3. A FAILED MIGRATION THAT NEVER RETRIED. A failure set migrate=off to stop
//      it looping, and nothing ever set it back on, so the snap stayed on
//      MongoDB until an admin read the logs. A failure is a retry now.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const migrationControl = read('snap-src/bin/migration-control');
const wekanControl = read('snap-src/bin/wekan-control');
const pending = read('snap-src/bin/migration-pending');
const autopick = read('snap-src/bin/database-autopick');
const snapcraft = read('snapcraft.yaml');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapAlwaysFerretdb:');

test('the readers cover every MongoDB the snap ever shipped', () => {
  // 3.2 (the 6.09 era), 4.0 (2019), 5 (2023-02), 6.0.6 (2023-05), 7 (2025-10).
  // mongod 5.0 is the rung that was missing: FCV 4.4 and 5.0.
  const at = snapcraft.indexOf('    mongo50:');
  assert.notStrictEqual(at, -1, 'snapcraft.yaml has a mongo50 part');
  const part = snapcraft.slice(at, snapcraft.indexOf('    mongo42:', at));
  assert.ok(/V=5\.0\.\d+/.test(part), 'it pins a MongoDB 5.0 release');
  assert.ok(/ubuntu2004/.test(part),
    'from the ubuntu2004 build - MongoDB published no 18.04 build of 5.0');
  assert.ok(/amd64\)\s*MARCH=x86_64/.test(part) && /arm64\)\s*MARCH=aarch64/.test(part),
    'for the two architectures that ever had a MongoDB');
  assert.ok(/no MongoDB 5\.0 for \$\{CRAFT_ARCH_BUILD_FOR\}/.test(part),
    'and it skips the others instead of failing their builds');
});

test('the 5.0 reader is tried between 7 and 4.2, and only to READ', () => {
  const i7 = migrationControl.indexOf('Trying the bundled mongod 5.0');
  const i42 = migrationControl.indexOf('Trying the bundled mongod 4.2');
  assert.ok(i7 !== -1 && i42 !== -1 && i7 < i42,
    'newest reader first: 7, then 5.0, then 4.2, then the 3.2 tools');
  const branch = migrationControl.slice(i7, i42);
  assert.ok(/IMPORTER_MODERN/.test(branch),
    'it hands the source to the driver importer, like the 4.2 branch');
  assert.ok(/x86_64=avx/.test(branch),
    'MongoDB 5.0 requires AVX on x86_64, so the probe goes through cpu-exec');
  assert.ok(!/snapctl set database=mongodb/.test(branch),
    'reading a 5.0 database never leaves the snap running on it');
});

test('a FerretDB copy that fell behind is MERGED, not abandoned', () => {
  const at = wekanControl.indexOf('was migrated from MongoDB,');
  const branch = wekanControl.slice(at, wekanControl.indexOf('# Bring up the chosen database', at));
  assert.ok(/database-autopick" --to-ferretdb/.test(branch),
    'the newer MongoDB data is merged into FerretDB');
  const mergedOk = branch.indexOf('merged" = true');
  const fallback = branch.indexOf('export DATABASE="mongodb"');
  assert.ok(mergedOk !== -1 && fallback > mergedOk,
    'switching to MongoDB is the FALLBACK, only when the merge could not run');
  assert.ok(/showing old data/.test(branch),
    'and the fallback says why it is the lesser evil, because serving a copy that '
    + 'is behind is exactly the complaint this came from');
});

test('--to-ferretdb does not let the evidence choose MongoDB (negative)', () => {
  const at = autopick.indexOf('if [ "$TO_FERRETDB" = true ]');
  assert.notStrictEqual(at, -1, 'the mode exists');
  const block = autopick.slice(at, autopick.indexOf('if [ -z "$CHOICE" ]', at));
  assert.ok(/CHOICE=ferretdb/.test(block), 'the destination is FerretDB');
  assert.ok(/MERGE_FROM=mongodb/.test(block), 'and MongoDB is what is merged in');
  assert.ok(/have_ferret_data/.test(block),
    'with nothing to merge into, it says the migration has to run first rather '
    + 'than inventing an empty FerretDB');
  // The merge itself is still insert-only: that guarantee lives in
  // database-merge-missing.mjs and is what makes this safe to do unattended.
  const merge = read('snap-src/bin/database-merge-missing.mjs');
  assert.ok(/THE ONLY OPERATION IS INSERT/.test(merge));
});

test('a failed migration retries by itself', () => {
  assert.ok(!/snapctl set migrate=off/.test(migrationControl),
    'a failure must not park the snap on MongoDB for good');
  assert.ok(/\.migration-retry/.test(migrationControl), 'it records the failure instead');
  assert.ok(/attempts=\$\(\(attempts \+ 1\)\)/.test(migrationControl), 'counting the attempts');
  assert.ok(/revision=\$\{SNAP_REVISION:-unknown\}/.test(migrationControl),
    'and which snap revision failed');
});

test('the retry waits, but never longer than a day - and not at all after a refresh', () => {
  assert.ok(/SNAP_REVISION" != "\$r_revision"/.test(pending),
    'a new snap revision retries immediately: the release may be the fix');
  assert.ok(/wait_s=3600/.test(pending), 'the first wait is an hour');
  assert.ok(/wait_s=86400/.test(pending), 'and it is capped at a day');
  assert.ok(/migrate 2>\/dev\/null\)" = "off"/.test(pending),
    'an admin saying migrate=off still stops it - that is a decision, not a failure');
  assert.ok(/\.migration-retry/.test(read('snap-src/bin/wekan-force-migrate')),
    'and a manual `snap run wekan.migrate` clears the backoff');
});

test('a successful migration leaves no retry record behind', () => {
  const at = migrationControl.indexOf('finish_success() {');
  const fn = migrationControl.slice(at, migrationControl.indexOf('\n}', at));
  assert.ok(/rm -f "\$SNAP_COMMON\/\.migration-retry"/.test(fn),
    'or the next failure would count from the old attempts and wait a day too soon');
  // The `database` setting is gone; `touch "$MARKER"` plus the service move IS
  // the switch, and bin/database-role reads that marker.
  assert.ok(/touch "\$MARKER"/.test(fn) && /start --enable "\$\{svc\}\.ferretdb"/.test(fn),
    'and it ends on FerretDB, which is the whole point');
});

test('the migration is not gated on the database setting', () => {
  // "All snaps should be migrated to FerretDB, regardless of the setting."
  // migration-pending refuses only for: already done, already ON FerretDB with
  // data, admin pause, missing tools, no MongoDB data, or a backoff that has not
  // elapsed. database=mongodb is not one of them.
  assert.ok(!/snapctl get database/.test(pending),
    'there is no database setting left to gate a migration on');
  assert.ok(/database-role" 2>\/dev\/null\)" = "ferretdb"/.test(pending),
    'the only check is what the DATA says: already on FerretDB, with data in it');
});

test('a migration never runs over, or deletes, a FerretDB that holds work', () => {
  // #6583 comment 5273400932: "the migration re-ran yesterday (even though it
  // had already run successfully a few weeks ago) ... That explains why I'm
  // seeing old data." The marker had gone, the old staleness guard had put the
  // instance back on MongoDB, and the re-run replaced months of work with the
  // copy it had been made from. Two locks on that door now, and the checkpoint
  // is what tells a FINISHED database from an interrupted migration.
  const top = migrationControl.slice(0, migrationControl.indexOf('start_target_ferretdb() {'));
  assert.ok(/already holds data and no migration is in progress/.test(top),
    'migration-control refuses to import over a database that is already serving');
  assert.ok(/touch "\$MARKER"/.test(top) && /start --enable "\$\{svc\}\.ferretdb"/.test(top),
    'and marks it done and serves FerretDB instead of doing nothing');

  const discard = migrationControl.slice(migrationControl.indexOf('discard_partial_ferretdb() {'));
  const body = discard.slice(0, discard.indexOf('\n}'));
  const guard = body.indexOf('migration-progress.json');
  const rm = body.indexOf('rm -rf "${SQLITE_DIR');
  assert.ok(guard !== -1 && guard < rm,
    'and the cleanup checks for the checkpoint BEFORE deleting anything');
  assert.ok(/NOT deleting the FerretDB database/.test(body),
    'saying so when it declines, because a silent skip reads as a failed cleanup');
});

console.log(`\nsnapAlwaysFerretdb: ${passed} tests passed`);
