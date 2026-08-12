'use strict';

// wekan/wekan#6583 "Missing Data after Upgrade from v6 to latest Release":
// after upgrading, WeKan showed "the state of the data from days ago" and the
// reporter suspected a `snap revert` done four weeks earlier.
// Run: node tests/ferretdbMigrationStale.test.cjs
//
// They were right about the cause and it is not data loss. The MongoDB ->
// FerretDB migration copies MongoDB into SQLite ONCE and writes
// .migration-to-ferretdb-done; nothing keeps that copy in step afterwards. Revert
// the snap to a revision that runs mongod and WeKan carries on writing to
// MongoDB - for four weeks, in this report - while the finished SQLite sits
// frozen at the date it was made. Refresh forward again and mongodb-control saw
// a marker plus a non-empty SQLite, called that a completed migration, and
// switched the snap onto it: every board and card written during the revert was
// still on disk and simply not being served.
//
// Nothing was ever in danger. The database lives in $SNAP_COMMON, which is shared
// across revisions and is NOT rolled back by `snap revert` (unlike $SNAP_DATA,
// which is per-revision). What was wrong was WHICH of the two copies got served,
// and nothing compared their ages.
//
// So: never serve a migrated copy that is older than the MongoDB beside it. If
// mongod can run, keep MongoDB, which has the newest data. If mongod CANNOT run
// (the AVX case that forces the migration in the first place), migrate again from
// scratch rather than serve the stale copy.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const stale = path.join(repoRoot, 'snap-src/bin/ferretdb-migration-stale');
const mongodbControl = fs.readFileSync(path.join(repoRoot, 'snap-src/bin/mongodb-control'), 'utf8');
const wekanControl = fs.readFileSync(path.join(repoRoot, 'snap-src/bin/wekan-control'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the detector exists, is executable, and parses', () => {
  assert.ok(fs.existsSync(stale), 'snap-src/bin/ferretdb-migration-stale is missing');
  assert.ok(fs.statSync(stale).mode & 0o111, 'it must be executable');
  const check = spawnSync('bash', ['-n', stale]);
  assert.strictEqual(check.status, 0, `bash -n failed: ${check.stderr}`);
});

// A $SNAP_COMMON as the snap really lays it out: WiredTiger files at the top,
// the FerretDB SQLite under files/db, the marker beside them.
// sqliteAt defaults to the migration time because that is what the migration
// itself leaves behind: it writes the SQLite and the marker in the same breath. A
// LATER sqliteAt means something has been using FerretDB since - which is the
// whole difference between a copy nobody touched and a live database.
function makeCommon({ mongoAt, migratedAt, sqliteAt, sqlite = true, mongo = true, extra = {} }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-common-'));
  fs.mkdirSync(path.join(dir, 'files/db'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'journal'), { recursive: true });
  if (mongo) {
    for (const f of ['WiredTiger', '_mdb_catalog.wt', 'collection-0.wt']) {
      fs.writeFileSync(path.join(dir, f), 'x');
      fs.utimesSync(path.join(dir, f), new Date(mongoAt), new Date(mongoAt));
    }
  }
  if (sqlite) {
    const db = path.join(dir, 'files/db/wekan.sqlite');
    fs.writeFileSync(db, 'data');
    const at = sqliteAt || migratedAt;
    if (at) fs.utimesSync(db, new Date(at), new Date(at));
  }
  if (migratedAt) {
    const marker = path.join(dir, '.migration-to-ferretdb-done');
    fs.writeFileSync(marker, '');
    fs.utimesSync(marker, new Date(migratedAt), new Date(migratedAt));
  }
  for (const [name, when] of Object.entries(extra)) {
    fs.writeFileSync(path.join(dir, name), 'x');
    fs.utimesSync(path.join(dir, name), new Date(when), new Date(when));
  }
  return dir;
}

// Exit 0 = stale, 1 = current / cannot tell, 2 = both written since the migration.
function run(dir) {
  const r = spawnSync('bash', [stale, dir], { encoding: 'utf8' });
  return { code: r.status, out: r.stderr };
}
function isStale(dir) {
  return run(dir).code === 0;
}

function withCommon(opts, fn) {
  const dir = makeCommon(opts);
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

const JULY = '2026-07-14T12:00:00Z';
const AUGUST = '2026-08-11T09:00:00Z';

test('the reported case: MongoDB written to for weeks after the migration', () => {
  withCommon({ migratedAt: JULY, mongoAt: AUGUST }, dir => {
    assert.strictEqual(isStale(dir), true,
      'a migration from four weeks before the newest MongoDB write is behind it, ' +
      'and serving it is what showed "the state of the data from days ago"');
    const out = spawnSync('bash', [stale, dir], { encoding: 'utf8' }).stderr;
    assert.ok(/BEHIND the MongoDB data/.test(out), `it must say so: ${out}`);
    assert.ok(/day\(s\) later/.test(out), 'and by how much');
  });
});

// ── the regression this guard itself caused (#6583 comment 5259638482) ──────
//
//   "A couple of weeks ago, I did a snap revert ... but then completed the
//    migration successfully. Today, my database suddenly reverted to an old
//    version from what looks like weeks ago. Upgrading to 10.83 did not fix the
//    problem automatically."
//
// Their FerretDB was the LIVE database and had been for two weeks; MongoDB was
// the frozen one. But STARTING mongod rewrites its WiredTiger files - recovery
// and the startup checkpoint - so one service start during a refresh put
// MongoDB's newest mtime hours ago against a marker from two weeks ago. The first
// version of this script compared only those two, called the live copy stale, and
// wekan-control switched them onto the frozen MongoDB. Every start re-applied it,
// which is why upgrading did not help: the upgrade was the cause.

test('a LIVE FerretDB is not called stale because mongod was started once', () => {
  const { code, out } = (() => {
    const dir = makeCommon({
      migratedAt: JULY,            // migrated a couple of weeks ago
      sqliteAt: AUGUST,            // and FerretDB has been serving ever since
      mongoAt: AUGUST,             // mongod merely started today: files touched
    });
    try { return run(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  })();
  assert.notStrictEqual(code, 0,
    'calling the live database stale is what "reverted to an old version from ' +
    'weeks ago" WAS - the guard did it, at every start');
  assert.strictEqual(code, 2, 'both were touched after the migration: ambiguous');
  assert.ok(/BOTH databases have been written to/.test(out), out);
  assert.ok(/cannot be told from timestamps/.test(out),
    'and it has to say that it does not know, rather than pick');
  assert.ok(/Nothing has\s+been changed or switched/.test(out),
    'the admin needs to know their data was left alone');
});

test('ambiguity is never resolved by acting - only exit 0 may be acted on', () => {
  // Both callers test with `if`, so 2 falls through to "do not switch". The one
  // that matters most is the branch in mongodb-control that DELETES files/db to
  // re-migrate: on ambiguity the SQLite holds work of its own, and wiping it
  // would destroy exactly the copy in doubt.
  const control = fs.readFileSync(
    path.join(repoRoot, 'snap-src/bin/mongodb-control'), 'utf8');
  const at = control.indexOf('local stale_migration=1');
  assert.ok(at !== -1);
  const branch = control.slice(at, at + 400);
  assert.ok(/bash "\$SNAP\/bin\/ferretdb-migration-stale"[^\n]*; then\n\s*stale_migration=0/.test(branch),
    'stale_migration may only be set from a plain success test, never from ' +
    '"not 1" - which would let ambiguity reach the rm -rf');
  const wipe = control.indexOf('rm -rf "${SNAP_COMMON:?}/files/db/"*');
  assert.ok(wipe > at, 'and the deletion is downstream of it');
});

test('a migration newer than the data is current', () => {
  withCommon({ migratedAt: AUGUST, mongoAt: JULY }, dir => {
    assert.strictEqual(isStale(dir), false,
      'the normal case - migrate, then stop using MongoDB - must not be called stale');
  });
});

test('the migration stopping its own source mongod does not count as staleness', () => {
  // The migration starts a temporary mongod to read from and stops it again, and
  // that shutdown writes to the data directory moments AFTER the marker appears.
  // Without a margin every fresh migration would look stale and the snap would
  // migrate in a loop.
  withCommon({ migratedAt: '2026-08-11T09:56:00Z', mongoAt: '2026-08-11T10:00:00Z' }, dir => {
    assert.strictEqual(isStale(dir), false, 'four minutes later is the migration itself');
  });
  withCommon({ migratedAt: '2026-08-11T09:30:00Z', mongoAt: '2026-08-11T10:00:00Z' }, dir => {
    assert.strictEqual(isStale(dir), true, 'half an hour later is somebody using MongoDB');
  });
});

test('only DATABASE files count, not a log or a pid file', () => {
  // $SNAP_COMMON also holds mongodb.log and mongodb.pid, which starting the snap
  // touches. Counting those would call every migration stale on the next boot.
  withCommon({
    migratedAt: '2026-08-11T09:30:00Z',
    mongoAt: '2026-08-11T09:00:00Z',
    extra: { 'mongodb.log': '2026-08-11T10:00:00Z', 'mongodb.pid': '2026-08-11T10:00:00Z' },
  }, dir => {
    assert.strictEqual(isStale(dir), false,
      'a newer log file says the snap was started, not that the database was written to');
  });
});

test('nothing to compare is never reported as stale', () => {
  // Each of these must answer "not stale": being unsure has to leave the existing
  // behaviour alone, because the caller acts on a yes.
  withCommon({ mongoAt: AUGUST, migratedAt: null }, dir =>
    assert.strictEqual(isStale(dir), false, 'no marker: no migration to be behind'));
  withCommon({ migratedAt: JULY, mongoAt: AUGUST, sqlite: false }, dir =>
    assert.strictEqual(isStale(dir), false,
      'the marker is written even when the migration produced no data; an empty ' +
      'FerretDB is the OTHER guard\'s business'));
  withCommon({ migratedAt: JULY, mongoAt: AUGUST, mongo: false }, dir =>
    assert.strictEqual(isStale(dir), false,
      'a FerretDB-only install has no MongoDB to have fallen behind'));
  assert.strictEqual(isStale(path.join(os.tmpdir(), 'wekan-nonexistent-dir')), false,
    'a directory that is not there must not be called stale either');
});

// ── the two places that act on it ───────────────────────────────────────────

test('mongodb-control will not switch to a stale migration', () => {
  const at = mongodbControl.indexOf('switch_to_completed_ferretdb() {');
  assert.notStrictEqual(at, -1, 'mongodb-control must still have that function');
  const body = mongodbControl.slice(at, mongodbControl.indexOf('\n}', at));
  assert.ok(/ferretdb-migration-stale/.test(body),
    'the switch must consult the check - "a completed migration exists" was the ' +
    'whole of its test, and completed is not the same as up to date');
  const guard = body.indexOf('ferretdb-migration-stale');
  // There is no `snapctl set database=ferretdb` any more - the completion marker
  // and the data say which database runs (bin/database-role) - so what has to
  // come after the check is the SERVICE move.
  const doSwitch = body.indexOf('start --enable "${svc}.ferretdb"');
  assert.ok(guard !== -1 && guard < doSwitch,
    'and consult it BEFORE starting FerretDB, not after');
  assert.ok(/return 1/.test(body.slice(guard, doSwitch)),
    'a stale migration must leave MongoDB running, which has the newest data');
});

test('when mongod cannot run at all, a stale migration is redone rather than served', () => {
  const at = mongodbControl.indexOf('handle_mongod_start_failure() {');
  const body = mongodbControl.slice(at, mongodbControl.indexOf('\n# #6458', at));
  assert.ok(/stale_migration/.test(body),
    'keeping MongoDB is not on offer when mongod will not start, so the choice is ' +
    'between a fresh copy and a stale one');
  for (const cleared of ['.migration-to-ferretdb-done', 'migration-progress.json', 'files/db/']) {
    assert.ok(body.includes(cleared),
      `a stale migration must be RESTARTED, so ${cleared} has to go - migration-control ` +
      'exits immediately while the marker is there, and the checkpoint describes a ' +
      'finished copy of the old data');
  }
  assert.ok(!/rm -rf "\$SNAP_COMMON"\/collection|rm .*WiredTiger/.test(body),
    'and the MongoDB data itself must never be touched');
});

test('a migrated copy that is behind is caught up, not abandoned', () => {
  assert.ok(/ferretdb-migration-stale/.test(wekanControl),
    'wekan-control guards against an EMPTY FerretDB already; a full but out-of-date ' +
    'one looks worse, because WeKan comes up with only the last weeks missing');
  // Anchored on the STALE branch specifically. The ambiguous branch sits above it
  // and deliberately switches nothing, so a window that starts at the first
  // mention of the detector would be reading the wrong block.
  const at = wekanControl.indexOf('migration_stale_rc" -eq 0');
  assert.ok(at !== -1, 'the stale branch must test for exactly 0');
  const after = wekanControl.slice(at, at + 3000);
  // This assertion was the opposite until the reports came in: the branch used
  // to answer by switching the snap to database=mongodb, and what people saw was
  // "WeKan changed to old MongoDB data" - onto the database the snap is
  // migrating away from, and when the detector had guessed wrong (#6583) onto a
  // copy that was weeks behind. Merging is the repair; switching is the
  // fallback for when the merge cannot run.
  assert.ok(/database-autopick" --to-ferretdb/.test(after),
    'the newer MongoDB documents are merged INTO FerretDB, and WeKan stays there');
  const merge = after.indexOf('--to-ferretdb');
  // Nothing is written down for the fallback either: there is no setting to
  // write. It serves MongoDB for THIS start, and the next start asks the data
  // again and retries the merge.
  const fallback = after.indexOf('export DATABASE="mongodb"');
  assert.ok(fallback > merge,
    'MongoDB is only what it falls back to when the merge could not run');
  assert.ok(!/snapctl set database=/.test(after),
    'and the fallback is for this start only - it does not pin the snap to MongoDB');
  assert.ok(/snap revert. does not roll back|not rolled back by a revert/.test(after),
    'and it still says that nothing is lost - $SNAP_COMMON is shared across revisions - ' +
    'or the message reads as a report of data loss');
});

test('wekan-control never switches on a GUESS when both databases have been used', () => {
  // What changed, and why the assertion did with it: this branch used to do
  // nothing but print, because the only evidence it had was mtimes and an mtime
  // cannot tell a used database from a started one. It now asks
  // bin/database-autopick, which READS both databases - counts and the newest
  // moment their data carries - and serves the copy holding the work, merging the
  // other copy's documents into it insert-only so nothing is stranded or
  // overwritten (#6585 follow-up, and an email report of users unable to log in
  // and boards missing on an instance that was being served the older copy).
  //
  // The rule this test protects is unchanged: no switch on a guess. So what is
  // pinned is that this branch does not set the database ITSELF from the mtime
  // verdict, and that when autopick declines - too close to call, nothing
  // readable - the admin still gets both commands.
  const at = wekanControl.indexOf('migration_stale_rc" -eq 2');
  assert.ok(at !== -1, 'the ambiguous case needs a branch of its own');
  const branch = wekanControl.slice(at, wekanControl.indexOf('if [ "ferretdb" = "$DATABASE" ]', at));
  assert.ok(!/snapctl set database=/.test(branch),
    'this branch must not choose from the timestamps it has - that is the bug ' +
    'this whole guard exists to prevent, in either direction');
  assert.ok(/bin\/database-autopick/.test(branch),
    'the choice is delegated to the one thing that can make it: what is IN the ' +
    'two databases');
  assert.ok(/database=mongodb/.test(branch) && /database=ferretdb/.test(branch),
    'and when even that cannot tell them apart, the admin gets both commands');
});

test('the detector ships inside the snap', () => {
  const snapcraft = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');
  assert.ok(/helpers:\s*\n\s*source: snap-src\s*\n\s*plugin: dump/.test(snapcraft),
    'snap-src is dumped wholesale, which is what puts bin/ferretdb-migration-stale ' +
    'in $SNAP/bin - if that part ever stops being a dump, the callers break');
});

console.log(`\n${passed} passed`);
