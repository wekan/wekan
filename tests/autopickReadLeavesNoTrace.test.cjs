'use strict';

// Guard: reading MongoDB to compare the two copies must not look like writing to it.
// Run: node tests/autopickReadLeavesNoTrace.test.cjs
//
// THE LOOP THIS BREAKS. bin/ferretdb-migration-stale decides "MongoDB has been
// written to since the migration" from the mtimes of the WiredTiger data files,
// and its own header admits an mtime cannot tell "somebody used this database"
// from "this database was started". bin/database-autopick is the answer to that
// - it reads both copies and compares their contents.
//
// But to read MongoDB it STARTS mongod, and starting mongod does recovery and a
// checkpoint, which stamps exactly the files the staleness check reads. So the
// diagnostic manufactures its own evidence: after autopick has run once,
// MongoDB looks freshly written forever, and a live site prints
//
//   WeKan: BOTH databases have been written to since the migration.
//     MongoDB  last written 2026-08-16 01:41 (WiredTiger.wt)
//     FerretDB last written 2026-08-16 01:38
//
// at every restart, on an instance where nothing has opened MongoDB in months.
// The giveaway in that report is the MongoDB timestamp being the minute the snap
// started, three minutes AFTER the FerretDB it is being compared to.
//
// The fix: note the newest data-file mtime before mongod starts, put anything
// newer back afterwards. mongod does not use mtimes - the catalog and journal
// are what it reads - and what it checkpointed is not user data, so the metadata
// is made to say what is true.
//
// These tests run the real shell functions against a WiredTiger-shaped directory,
// because the thing that can break is behaviour, not wording.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const AUTOPICK = path.join(ROOT, 'snap-src', 'bin', 'database-autopick');
const STALE = path.join(ROOT, 'snap-src', 'bin', 'ferretdb-migration-stale');
const autopick = fs.readFileSync(AUTOPICK, 'utf8');
const stale = fs.readFileSync(STALE, 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Pull the three functions out of the script and run them against a temp dbpath,
// so what is tested is the code that ships.
function harness(dbpath, body) {
  const grab = re => {
    const m = re.exec(autopick);
    assert.ok(m, `could not find ${re} in database-autopick`);
    return m[0];
  };
  const script = [
    `DBPATH=${JSON.stringify(dbpath)}`,
    grab(/^mongo_data_files\(\) \{[\s\S]*?^\}/m),
    grab(/^MONGO_MTIME_BEFORE=0[\s\S]*?^\}/m),
    grab(/^restore_mongo_mtime\(\) \{[\s\S]*?^\}/m),
    body,
  ].join('\n');
  return execFileSync('bash', ['-c', script], { encoding: 'utf8' });
}

// A dbpath shaped like MongoDB's, every file stamped at the migration time.
const MIGRATED_AT = 1784088000;   // 2026-07-15 07:00
function makeDbpath(dir) {
  const dbpath = path.join(dir, 'common');
  fs.mkdirSync(path.join(dbpath, 'journal'), { recursive: true });
  for (const f of ['WiredTiger', 'WiredTiger.wt', 'WiredTiger.turtle', '_mdb_catalog.wt',
    'sizeStorer.wt', 'collection-1.wt', 'index-2.wt']) {
    fs.writeFileSync(path.join(dbpath, f), 'x');
  }
  fs.writeFileSync(path.join(dbpath, 'journal', 'WiredTigerLog.0000000001'), 'x');
  fs.writeFileSync(path.join(dbpath, 'mongod.log'), 'log');
  for (const p of [dbpath, path.join(dbpath, 'journal')]) {
    for (const f of fs.readdirSync(p)) {
      const q = path.join(p, f);
      if (fs.statSync(q).isFile()) fs.utimesSync(q, MIGRATED_AT, MIGRATED_AT);
    }
  }
  return dbpath;
}

function withDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-autopick-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

const newestData = dbpath => {
  let newest = 0;
  const names = ['WiredTiger', 'WiredTiger.wt', 'WiredTiger.turtle', '_mdb_catalog.wt',
    'sizeStorer.wt'];
  for (const f of fs.readdirSync(dbpath)) {
    if (names.includes(f) || /^(collection|index)-.*\.wt$/.test(f)) {
      newest = Math.max(newest, Math.floor(fs.statSync(path.join(dbpath, f)).mtimeMs / 1000));
    }
  }
  for (const f of fs.readdirSync(path.join(dbpath, 'journal'))) {
    newest = Math.max(newest, Math.floor(fs.statSync(path.join(dbpath, 'journal', f)).mtimeMs / 1000));
  }
  return newest;
};

test('a simulated mongod start leaves the data files as it found them', () => withDir(dir => {
  const dbpath = makeDbpath(dir);
  harness(dbpath, [
    'note_mongo_mtime',
    // What starting mongod does: checkpoint the existing files, add a journal file.
    'touch "$DBPATH/WiredTiger.wt" "$DBPATH/WiredTiger.turtle"',
    'touch "$DBPATH/journal/WiredTigerLog.0000000002"',
    'restore_mongo_mtime',
  ].join('\n'));
  assert.strictEqual(newestData(dbpath), MIGRATED_AT,
    'after a read, the newest data file must still be the migration - otherwise the next '
    + 'start reports MongoDB as freshly written and the ambiguity never ends');
}));

test('a file mongod CREATES during the read is put back too', () => withDir(dir => {
  const dbpath = makeDbpath(dir);
  harness(dbpath, ['note_mongo_mtime', 'touch "$DBPATH/journal/WiredTigerLog.0000000009"',
    'restore_mongo_mtime'].join('\n'));
  const created = path.join(dbpath, 'journal', 'WiredTigerLog.0000000009');
  assert.ok(fs.existsSync(created), 'the new journal file is still there');
  assert.strictEqual(Math.floor(fs.statSync(created).mtimeMs / 1000), MIGRATED_AT,
    'a NEW journal file is the newest thing in the directory and would report as a write');
}));

test('a genuine write BEFORE the read is preserved, not erased (negative)', () => withDir(dir => {
  // The point is to hide OUR read, never somebody's work. A write that happened
  // before the read must still be visible after it.
  const dbpath = makeDbpath(dir);
  const userWrote = MIGRATED_AT + 86400;
  fs.utimesSync(path.join(dbpath, 'collection-1.wt'), userWrote, userWrote);
  harness(dbpath, ['note_mongo_mtime', 'touch "$DBPATH/WiredTiger.wt"',
    'restore_mongo_mtime'].join('\n'));
  assert.strictEqual(newestData(dbpath), userWrote,
    'the real write must survive the read that came after it');
}));

test('non-data files are left alone (negative)', () => withDir(dir => {
  // ferretdb-migration-stale deliberately ignores logs and pid files, so this
  // must not touch them either: making a log look old would be its own lie.
  const dbpath = makeDbpath(dir);
  harness(dbpath, ['note_mongo_mtime', 'touch "$DBPATH/mongod.log"',
    'restore_mongo_mtime'].join('\n'));
  assert.ok(Math.floor(fs.statSync(path.join(dbpath, 'mongod.log')).mtimeMs / 1000) > MIGRATED_AT,
    'the log was written and should still say so');
}));

test('with no MongoDB data at all it does nothing and does not fail', () => withDir(dir => {
  const dbpath = path.join(dir, 'empty');
  fs.mkdirSync(path.join(dbpath, 'journal'), { recursive: true });
  const out = harness(dbpath, ['note_mongo_mtime', 'echo "noted=$MONGO_MTIME_BEFORE"',
    'restore_mongo_mtime', 'echo done'].join('\n'));
  assert.ok(/noted=0/.test(out), 'nothing to note');
  assert.ok(/done/.test(out), 'and restoring is a no-op rather than an error');
}));

test('the read notes the mtimes BEFORE starting mongod, and restores after', () => {
  const fn = autopick.slice(autopick.indexOf('evidence_from_mongodb() {'));
  const body = fn.slice(0, fn.indexOf('\n}\n'));
  assert.ok(body.indexOf('note_mongo_mtime') < body.indexOf('start_mongo_reader'),
    'noting after mongod has started would note the value mongod just wrote');
  assert.ok(/restore_mongo_mtime/.test(body), 'and the read must restore them');
  // Every way out after mongod may have started has to restore, or a failed read
  // leaves the stamp behind - which is the case that matters, since a failing
  // read is exactly when the ambiguity is reported.
  const afterNote = body.slice(body.indexOf('note_mongo_mtime'));
  const returns = afterNote.split('\n').filter(l => /\breturn\b/.test(l));
  assert.ok(returns.length > 0, 'expected the early returns');
  for (const line of returns) {
    assert.ok(/restore_mongo_mtime/.test(line) || /return \$rc/.test(line),
      `this way out of the read does not restore the mtimes: ${line.trim()}`);
  }
});

test('it watches the same files the staleness check reads', () => {
  // Two lists of WiredTiger filenames that must agree: the one
  // ferretdb-migration-stale reads as evidence, and the one autopick puts back.
  // A file in the first and not the second is a stamp left behind.
  const names = text => new Set(
    (text.match(/(?:WiredTiger(?:\.wt|\.turtle)?|_mdb_catalog\.wt|sizeStorer\.wt|collection-\*\.wt|index-\*\.wt|WiredTigerLog\.\*)/g) || []));
  const staleList = names(stale.slice(stale.indexOf('for f in "$DBPATH"/WiredTiger'),
    stale.indexOf('done', stale.indexOf('for f in "$DBPATH"/WiredTiger'))));
  const pickList = names(autopick.slice(autopick.indexOf('mongo_data_files() {'),
    autopick.indexOf('}', autopick.indexOf('mongo_data_files() {'))));
  assert.ok(staleList.size >= 7, `expected the evidence list, found ${[...staleList]}`);
  const missing = [...staleList].filter(n => !pickList.has(n));
  assert.deepStrictEqual(missing, [],
    'ferretdb-migration-stale reads these as evidence and database-autopick does not put '
    + `them back, so a read still looks like a write: ${missing.join(', ')}`);
});

console.log(`\nautopickReadLeavesNoTrace: ${passed} tests passed`);
