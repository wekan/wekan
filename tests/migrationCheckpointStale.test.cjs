'use strict';

// wekan/wekan#6585 "Data Lost in DB after Update 10.81 to 10.85": the snap
// refreshed overnight and came up serving data from two to three weeks earlier -
// "many cards and work is lost".
// Run: node tests/migrationCheckpointStale.test.cjs
//
// Nothing was lost. The MongoDB data is in $SNAP_COMMON and untouched; what was
// being served was a FerretDB whose text collections were copied weeks before.
//
// The MongoDB -> FerretDB migration is resumable, and has to be: it can run for
// hours and a snap refresh part-way through is normal. So the importer records
// every finished collection in $SNAP_COMMON/migration-progress.json and skips those
// next time. That checkpoint was only ever checked against the TARGET -
// migration-control deletes it whenever it discards a partial SQLite - and never
// against the SOURCE. But between an interruption and its resume the snap hands
// WeKan back to MongoDB and people go on using it, so a migration interrupted in
// July and resumed in August skips every collection it finished in July, copies
// only the rest, and reports success: the database as it stood in July, with three
// weeks of work still in MongoDB and missing from the copy.
//
// A new snap revision is what usually sets the resume going again (the per-revision
// failure counter starts at zero), which is why it reads as "the update lost my
// data": the update is when the weeks-old copy finally got served.
//
// So: a resume checkpoint is only good while the source has not moved on. When
// MongoDB has been written to since the checkpoint was saved, the collection half
// is dropped and those collections are copied again from the current database. The
// FILE half is kept - attachments are written once and re-verified on disk, and
// re-extracting gigabytes is the slowest part of a resume.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const helper = path.join(repoRoot, 'snap-src/bin/migration-checkpoint-stale.mjs');
const migrationControl = fs.readFileSync(path.join(repoRoot, 'snap-src/bin/migration-control'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const DAY = 86400000;
const now = Date.now();

// A $SNAP_COMMON as the snap really lays it out: the WiredTiger files at the top,
// the resume checkpoint beside them, the FerretDB SQLite under files/db.
function makeCommon({ mongoAt, savedAt, updatedAt, collections = ['boards', 'cards'],
                      files = [['attachments:1', { path: '/x/1', size: 10 }]],
                      mongo = true, checkpoint = true }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-common-'));
  fs.mkdirSync(path.join(dir, 'files/db'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'journal'), { recursive: true });
  if (mongo) {
    for (const f of ['WiredTiger', '_mdb_catalog.wt', 'collection-0.wt']) {
      fs.writeFileSync(path.join(dir, f), 'x');
      fs.utimesSync(path.join(dir, f), mongoAt / 1000, mongoAt / 1000);
    }
    // A log and a pid file are touched by STARTING the snap, not by writing data:
    // they are deliberately not evidence, so make them the newest thing here.
    for (const f of ['mongodb.log', 'mongodb.pid']) {
      fs.writeFileSync(path.join(dir, f), 'x');
      fs.utimesSync(path.join(dir, f), now / 1000, now / 1000);
    }
  }
  const cpFile = path.join(dir, 'migration-progress.json');
  if (checkpoint) {
    fs.writeFileSync(cpFile, JSON.stringify({
      version: 2,
      updatedAt: new Date(updatedAt === undefined ? savedAt : updatedAt).toISOString(),
      phase: 'migrating-collections',
      completedCollections: collections,
      completedFiles: files,
      collections: { boards: { total: 3, done: 3 } },
      success: false,
    }));
    fs.utimesSync(cpFile, savedAt / 1000, savedAt / 1000);
  }
  return dir;
}

function run(dir, args = []) {
  const r = spawnSync(process.execPath, [helper, dir, ...args], { encoding: 'utf8' });
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const readCp = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'migration-progress.json'), 'utf8'));

test('the helper parses', () => {
  assert.ok(fs.existsSync(helper), 'snap-src/bin/migration-checkpoint-stale.mjs is missing');
  const check = spawnSync(process.execPath, ['--check', helper], { encoding: 'utf8' });
  assert.strictEqual(check.status, 0, `node --check failed: ${check.stderr}`);
});

test('a checkpoint MongoDB has outgrown loses its collections - the #6585 case', () => {
  // The migration stopped three weeks ago; WeKan has been on MongoDB ever since.
  const dir = makeCommon({ savedAt: now - 21 * DAY, mongoAt: now - 60000 });
  const { status, out } = run(dir);
  assert.strictEqual(status, 0, 'the source has moved on, so this is the stale case');
  assert.match(out, /about 20 day\(s\) later|about 21 day\(s\) later/,
    'it has to say HOW far behind the copies are - that number is the reported symptom');
  const cp = readCp(dir);
  assert.ok(!('completedCollections' in cp),
    'every collection copied three weeks ago must be copied again, or the migration ' +
    'completes onto three-week-old boards and cards');
  assert.ok(!('collections' in cp),
    'the per-collection counters describe the dropped copies too');
  assert.deepStrictEqual(cp.completedFiles, [['attachments:1', { path: '/x/1', size: 10 }]],
    'the extracted attachments are still on disk and are re-verified before they are ' +
    'trusted - re-extracting gigabytes is the slowest part of a resume');
  assert.strictEqual(cp.collectionsResetReason, 'source-newer-than-checkpoint',
    'the checkpoint should record why it lost half of itself');
});

test('a checkpoint the source has NOT outgrown is left alone', () => {
  // The ordinary resume: interrupted by a snap refresh, continued minutes later.
  const dir = makeCommon({ savedAt: now - 5 * 60000, mongoAt: now - 5 * 60000 });
  const { status, out } = run(dir);
  assert.strictEqual(status, 1, 'nothing here is stale');
  assert.strictEqual(out, '', 'and a resume that is fine should say nothing');
  assert.deepStrictEqual(readCp(dir).completedCollections, ['boards', 'cards'],
    'skipping the collections it already finished is what makes a resume cheap');
});

test('the margin covers the migration stopping its own source mongod', () => {
  // The migration reads the source with a temporary mongod of its own and stops it
  // moments after the last checkpoint save, which writes to the data directory. A
  // few minutes of slack tells that apart from days of ordinary use.
  const dir = makeCommon({ savedAt: now - 3600000, mongoAt: now - 3600000 + 90000 });
  assert.strictEqual(run(dir).status, 1,
    '90 seconds later is our own shutdown, not somebody using WeKan');
  const wide = makeCommon({ savedAt: now - 3600000, mongoAt: now - 3600000 + 90000 });
  const r = spawnSync(process.execPath, [helper, wide], {
    encoding: 'utf8', env: { ...process.env, MIGRATION_CHECKPOINT_MARGIN_SECONDS: '30' } });
  assert.strictEqual(r.status, 0, 'the margin has to be overridable to be testable');
});

test('--check reports without touching the checkpoint', () => {
  const dir = makeCommon({ savedAt: now - 21 * DAY, mongoAt: now - 60000 });
  const { status, out } = run(dir, ['--check']);
  assert.strictEqual(status, 0);
  assert.match(out, /resume checkpoint/);
  assert.deepStrictEqual(readCp(dir).completedCollections, ['boards', 'cards'],
    '--check answers the question; it does not act on the answer');
});

test('the OLDER of updatedAt and the file mtime decides', () => {
  // The two disagreeing is a reason to doubt the checkpoint, and the safe direction
  // is always to copy again: a needless re-copy costs minutes, and skipping one that
  // should have happened is the bug this exists for.
  const dir = makeCommon({ savedAt: now - 21 * DAY, updatedAt: now - 60000, mongoAt: now });
  assert.strictEqual(run(dir).status, 0, 'a fresh-looking updatedAt on a three-week-old file is doubt');
  const other = makeCommon({ savedAt: now, updatedAt: now - 21 * DAY, mongoAt: now });
  assert.strictEqual(run(other).status, 0, 'and so is the other way round');
});

test('nothing to compare against means nothing is changed', () => {
  const noCp = makeCommon({ savedAt: now, mongoAt: now, checkpoint: false });
  assert.strictEqual(run(noCp).status, 1, 'no checkpoint, nothing to be stale');
  const noMongo = makeCommon({ savedAt: now - 21 * DAY, mongoAt: now, mongo: false });
  assert.strictEqual(run(noMongo).status, 1, 'no MongoDB data files: no evidence either way');
  assert.deepStrictEqual(readCp(noMongo).completedCollections, ['boards', 'cards']);
  const empty = makeCommon({ savedAt: now - 21 * DAY, mongoAt: now, collections: [] });
  assert.strictEqual(run(empty).status, 1, 'a checkpoint that skips nothing cannot hide anything');
  const broken = makeCommon({ savedAt: now, mongoAt: now });
  fs.writeFileSync(path.join(broken, 'migration-progress.json'), 'not json');
  assert.strictEqual(run(broken).status, 1, 'an unreadable checkpoint is not a licence to rewrite it');
});

test('a mongodb.log alone is not somebody using the database', () => {
  // Starting the snap touches the log and the pid file; only the WiredTiger data
  // files move when data is written. makeCommon always stamps those two with NOW.
  const dir = makeCommon({ savedAt: now - 21 * DAY, mongoAt: now - 21 * DAY });
  assert.strictEqual(run(dir).status, 1,
    'if a log file counted, every start would throw away a good resume');
});

test('migration-control asks BEFORE it starts a mongod of its own', () => {
  const call = migrationControl.indexOf('migration-checkpoint-stale.mjs');
  assert.notStrictEqual(call, -1, 'migration-control is the only way into a text migration');
  assert.ok(/"\$NODE" "\$CHECKPOINT_STALE" "\$DBPATH"/.test(migrationControl),
    'it has to be asked about the real database directory');
  const firstStart = migrationControl.indexOf('if start_mongod ');
  assert.ok(firstStart !== -1 && call < firstStart,
    'starting ANY mongod rewrites the WiredTiger files, so after that the source ' +
    'mtime says "today" whatever happened - the question can only be asked first');
  const declared = migrationControl.indexOf('CHECKPOINT_STALE="$SNAP/bin/migration-checkpoint-stale.mjs"');
  assert.ok(declared !== -1 && declared < firstStart);
});

test('the helper ships inside the snap', () => {
  const snapcraft = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');
  assert.ok(/helpers:\s*\n\s*source: snap-src\s*\n\s*plugin: dump/.test(snapcraft),
    'snap-src is dumped wholesale, which is what puts bin/migration-checkpoint-stale.mjs ' +
    'in $SNAP/bin - if that part ever stops being a dump, migration-control cannot call it');
});

console.log(`\n${passed} passed`);
