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
function makeCommon({ mongoAt, migratedAt, sqlite = true, mongo = true, extra = {} }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-common-'));
  fs.mkdirSync(path.join(dir, 'files/db'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'journal'), { recursive: true });
  if (mongo) {
    for (const f of ['WiredTiger', '_mdb_catalog.wt', 'collection-0.wt']) {
      fs.writeFileSync(path.join(dir, f), 'x');
      fs.utimesSync(path.join(dir, f), new Date(mongoAt), new Date(mongoAt));
    }
  }
  if (sqlite) fs.writeFileSync(path.join(dir, 'files/db/wekan.sqlite'), 'data');
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

// Exit 0 = stale. Anything else = current / cannot tell.
function isStale(dir) {
  return spawnSync('bash', [stale, dir], { encoding: 'utf8' }).status === 0;
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
  const doSwitch = body.indexOf('snapctl set database=ferretdb');
  assert.ok(guard !== -1 && guard < doSwitch,
    'and consult it BEFORE switching, not after');
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

test('wekan-control keeps MongoDB when the migrated copy is behind it', () => {
  assert.ok(/ferretdb-migration-stale/.test(wekanControl),
    'wekan-control guards against an EMPTY FerretDB already; a full but out-of-date ' +
    'one looks worse, because WeKan comes up with only the last weeks missing');
  const at = wekanControl.indexOf('ferretdb-migration-stale');
  const after = wekanControl.slice(at, at + 1600);
  assert.ok(/export DATABASE="mongodb"/.test(after) &&
            /snapctl set database=mongodb/.test(after),
    'it must fall back to MongoDB, which has the newest data');
  assert.ok(/snap revert. does not roll back|not rolled back by a revert/.test(after),
    'and say that nothing is lost - $SNAP_COMMON is shared across revisions - or the ' +
    'message reads as a report of data loss');
});

test('the detector ships inside the snap', () => {
  const snapcraft = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');
  assert.ok(/helpers:\s*\n\s*source: snap-src\s*\n\s*plugin: dump/.test(snapcraft),
    'snap-src is dumped wholesale, which is what puts bin/ferretdb-migration-stale ' +
    'in $SNAP/bin - if that part ever stops being a dump, the callers break');
});

console.log(`\n${passed} passed`);
